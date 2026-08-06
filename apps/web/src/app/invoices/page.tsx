'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  FileText,
  CreditCard,
  Plus,
  Check,
  Eye,
  Download,
  Loader2,
  Sparkles,
  CheckCircle2,
  Clock,
  Wand2,
  Code2,
  Palette,
  Search,
  Filter,
  DollarSign,
  Building2,
  Receipt,
  ArrowUpRight,
  Send,
  AlertCircle,
  Calendar,
  Layers,
  CheckCheck,
} from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { useTranslation } from '@/lib/i18n';
import {
  useTemplatesQuery,
  useSaveDraftTemplateMutation,
  usePublishTemplateMutation,
} from '@/features/invoices/api/use-invoices';
import { invoiceService } from '@/features/invoices/services/invoice.service';
import { useBookingsQuery } from '@/features/bookings/api/use-bookings';
import { usePropertyStore } from '@/features/properties';
import { Booking } from '@/features/bookings/types/booking.types';
import { calculateTac } from '@/lib/utils/financial-math';

const PaymentEntryModal = dynamic(
  () => import('@/features/payments/components/payment-entry-modal').then((m) => m.PaymentEntryModal),
  { ssr: false }
);
const InvoicePreviewModal = dynamic(
  () => import('@/features/invoices/components/invoice-preview-modal').then((m) => m.InvoicePreviewModal),
  { ssr: false }
);

// Pre-built template presets for non-technical users
const PRESET_TEMPLATES = {
  STANDARD: {
    name: 'Standard Hotel Invoice',
    accentColor: '#059669',
    footerNote: 'Thank you for staying with us! We hope to see you again soon.',
  },
  CORPORATE: {
    name: 'Corporate & Tax Invoice',
    accentColor: '#2563eb',
    footerNote: 'Official Business Receipt. Subject to local GST and luxury tax regulations.',
  },
  LUXURY: {
    name: 'Resort & Luxury Spa Invoice',
    accentColor: '#d97706',
    footerNote: 'Thank you for choosing our luxury resort. Safe travels!',
  },
};

import { useToast } from '@/components/ui/toast';

export default function InvoicesPage() {
  const { t } = useTranslation();
  const activeProperty = usePropertyStore((s) => s.activeProperty);
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'templates'>('invoices');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'DUE' | 'AGENCY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected modals
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);
  const [selectedPaymentBooking, setSelectedPaymentBooking] = useState<Booking | null>(null);
  const [openingPdfId, setOpeningPdfId] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  const handleRowOpenPdf = async (invoiceId: string) => {
    try {
      setOpeningPdfId(invoiceId);
      toast.info('Opening PDF viewer...', 'PDF Viewer');
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/invoices/${invoiceId}/download?_t=${Date.now()}`;
      const response = await fetch(url, { credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch PDF');
      const rawBlob = await response.blob();
      const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(pdfBlob);
      const printWin = window.open(blobUrl, '_blank');
      if (!printWin) {
        toast.error('Pop-up blocked by browser. Please allow pop-ups.', 'Pop-up Blocked');
      }
    } catch (err: any) {
      toast.error('Failed to open PDF viewer.', 'Error');
    } finally {
      setOpeningPdfId(null);
    }
  };

  const handleRowDownload = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setDownloadingInvoiceId(invoiceId);
      toast.info('Downloading PDF invoice...', 'Downloading');
      await invoiceService.downloadInvoice(invoiceId, invoiceNumber);
    } catch (err: any) {
      toast.error('Failed to download invoice PDF.', 'Error');
    } finally {
      setTimeout(() => setDownloadingInvoiceId(null), 1000);
    }
  };

  // Fetch Bookings for financial ledger
  const { data: bookingsData, isLoading: isBookingsLoading } = useBookingsQuery(
    { propertyId: activeProperty?.id, limit: 100 },
    2500, // Poll every 2.5s so GENERATING invoices automatically turn READY on the table
  );

  const resData: any = bookingsData;
  const bookings: Booking[] = Array.isArray(resData)
    ? resData
    : (resData?.bookings || resData?.data?.bookings || (Array.isArray(resData?.data) ? resData.data : []));

  // Calculated Financial Metrics
  const summaryMetrics = useMemo(() => {
    let totalInvoiced = 0;
    let collectedRevenue = 0;
    let pendingBalance = 0;
    let totalTacCommission = 0;

    bookings.forEach((b) => {
      const gross = Number(b.totalAmount || 0);
      const paid = Number(b.advancePaid || 0);
      const due = Number(b.balanceDue || 0);
      totalInvoiced += gross;
      collectedRevenue += paid;
      pendingBalance += due;

      if (b.channel === 'AGENCY' || b.agencyId) {
        const rate = Number(b.tacRateAtBooking || b.agency?.defaultTacRate || 10);
        const { tacAmount } = calculateTac(gross, rate);
        totalTacCommission += tacAmount;
      }
    });

    return {
      totalInvoiced,
      collectedRevenue,
      pendingBalance,
      totalTacCommission,
    };
  }, [bookings]);

  // Filtered Bookings for Invoice Ledger
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Status filter
      if (statusFilter === 'PAID' && (b.balanceDue || 0) > 0) return false;
      if (statusFilter === 'DUE' && (b.balanceDue || 0) <= 0) return false;
      if (statusFilter === 'AGENCY' && b.channel !== 'AGENCY' && !b.agencyId) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const guestName = b.guest?.fullName?.toLowerCase() || '';
        const guestPhone = b.guest?.phone?.toLowerCase() || '';
        const agencyName = b.agency?.name?.toLowerCase() || '';
        const invNum = `inv-${b.id.slice(0, 8)}`.toLowerCase();
        const agyNum = `agy-${b.id.slice(0, 8)}`.toLowerCase();

        return (
          guestName.includes(q) ||
          guestPhone.includes(q) ||
          agencyName.includes(q) ||
          invNum.includes(q) ||
          agyNum.includes(q)
        );
      }

      return true;
    });
  }, [bookings, statusFilter, searchQuery]);

  // Template customizer states
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');
  const [templateName, setTemplateName] = useState('Standard Hotel Invoice');
  const [accentColor, setAccentColor] = useState('#059669');
  const [footerNote, setFooterNote] = useState('Thank you for staying with us! Generated by Orvyn PMS.');
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  // Helper to compile HTML dynamically for visual mode users
  const generateVisualHtml = (color: string, footer: string, bank: boolean) => {
    return `
<div style="font-family: 'Inter', Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; background: #ffffff;">
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid ${color}; padding-bottom: 20px;">
    <div>
      <h1 style="color: ${color}; font-size: 26px; font-weight: 800; margin: 0;">{{property_name}}</h1>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Official Guest Stay Invoice</p>
    </div>
    <div style="text-align: right;">
      <span style="font-size: 16px; font-weight: 800; color: #1e40af; display: block;">{{invoice_number}}</span>
      <span style="font-size: 12px; color: #64748b;">Date: {{check_in_date}}</span>
    </div>
  </div>

  <div style="margin-top: 30px; display: flex; justify-content: space-between; background: #f8fafc; padding: 16px; border-radius: 12px;">
    <div>
      <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">Billed Guest / Agency</p>
      <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">{{guest_name}}</p>
      <p style="margin: 2px 0 0 0; font-size: 12px; color: #475569;">{{guest_email}} | {{guest_phone}}</p>
    </div>
    <div style="text-align: right;">
      <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">Stay Period</p>
      <p style="margin: 0; font-size: 13px; font-weight: 600; color: #0f172a;">{{check_in_date}} &rarr; {{check_out_date}}</p>
    </div>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
    <thead>
      <tr style="background-color: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
        <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">Description</th>
        <th style="padding: 12px; text-align: right; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 14px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600;">Room Accommodations ({{room_type}})</td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; font-weight: 700;">{{total_amount}}</td>
      </tr>
      <tr>
        <td style="padding: 14px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: ${color};">Total Payments Received</td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 13px; font-weight: 800; color: ${color};">{{total_paid}}</td>
      </tr>
      <tr style="background-color: #fef2f2;">
        <td style="padding: 14px 12px; font-size: 14px; font-weight: 800; color: #dc2626;">Outstanding Balance Due</td>
        <td style="padding: 14px 12px; text-align: right; font-size: 14px; font-weight: 800; color: #dc2626;">{{balance_due}}</td>
      </tr>
    </tbody>
  </table>

  ${
    bank
      ? `
  <div style="margin-top: 24px; padding: 16px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 12px;">
    <strong style="color: #166534; display: block; margin-bottom: 4px;">Bank Settlement Details:</strong>
    <span style="color: #15803d;">Bank: HDFC Bank | A/C: 50200012345678 | IFSC: HDFC0001234 | UPI: azura@hdfcbank</span>
  </div>`
      : ''
  }

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
    ${footer}
  </div>
</div>`;
  };

  const [htmlContent, setHtmlContent] = useState(
    generateVisualHtml('#059669', 'Thank you for staying with us! Generated by Orvyn PMS.', false)
  );

  const { data: templatesData, isLoading: isTemplatesLoading } = useTemplatesQuery();
  const saveDraftMutation = useSaveDraftTemplateMutation();
  const publishMutation = usePublishTemplateMutation();

  const handleVisualParamChange = (newColor: string, newFooter: string, newBank: boolean) => {
    setAccentColor(newColor);
    setFooterNote(newFooter);
    setShowBankDetails(newBank);
    setHtmlContent(generateVisualHtml(newColor, newFooter, newBank));
    setIsSaved(false);
  };

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES.STANDARD) => {
    setTemplateName(preset.name);
    handleVisualParamChange(preset.accentColor, preset.footerNote, showBankDetails);
  };

  const handleCodeChange = (newCode: string) => {
    setHtmlContent(newCode);
    setIsSaved(false);
  };

  const handleSave = () => {
    saveDraftMutation.mutate(
      {
        name: templateName,
        htmlContent,
        themeConfig: { accentColor, footerNote, showBankDetails, editorMode },
      },
      {
        onSuccess: () => setIsSaved(true),
      }
    );
  };

  const handlePublish = (templateId: string) => {
    publishMutation.mutate(templateId);
  };

  const formatDate = (d: string) => {
    if (!d) return '—';
    const dateStr = d.includes('T') ? d : `${d}T00:00:00`;
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative bg-slate-50/50 dark:bg-slate-950">
      {/* Left Navigation Sidebar */}
      <DashboardSidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <AppHeader />

        {/* ═══ ENTERPRISE FINANCIAL KPI METRICS BAR ═══ */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Receipt className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                {t('invoicesWorkspaceTitle')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                Manage guest tax invoices, agency commercial billing, payments ledger, and customizable templates
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-1 shadow-2xs">
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'invoices'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{t('allInvoicesTab')}</span>
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'payments'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>{t('paymentLedgerTab')}</span>
              </button>

              <button
                onClick={() => setActiveTab('templates')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'templates'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>{t('templatesTab')}</span>
              </button>
            </div>
          </div>

          {/* KPI Analytics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* 1. Total Invoiced */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">{t('totalInvoiced')}</span>
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg font-black text-slate-900 dark:text-white">
                {formatCurrency(summaryMetrics.totalInvoiced)}
              </p>
              <p className="text-[11px] font-bold text-slate-400">Across {bookings.length} reservations</p>
            </div>

            {/* 2. Collected Revenue */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">{t('collectedRevenue')}</span>
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summaryMetrics.collectedRevenue)}
              </p>
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Advance & Payments Received</p>
            </div>

            {/* 3. Pending Balance Due */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">{t('pendingBalance')}</span>
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg font-black text-rose-600 dark:text-rose-400">
                {formatCurrency(summaryMetrics.pendingBalance)}
              </p>
              <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">Outstanding Balance</p>
            </div>

            {/* 4. Agency TAC Commissions */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">{t('agencyTacCommissions')}</span>
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                {formatCurrency(summaryMetrics.totalTacCommission)}
              </p>
              <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400">Travel Partner Commissions</p>
            </div>
          </div>
        </div>

        {/* ═══ TAB 1: ALL INVOICES LEDGER WORKSPACE ═══ */}
        {activeTab === 'invoices' && (
          <main className="px-6 pb-12 space-y-4 flex-1">
            {/* Filter & Search Header */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search invoice #, guest, or agency..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex gap-1 text-xs font-bold border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'ALL'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    All Invoices
                  </button>
                  <button
                    onClick={() => setStatusFilter('PAID')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'PAID'
                        ? 'bg-emerald-600 text-white font-black shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Fully Paid
                  </button>
                  <button
                    onClick={() => setStatusFilter('DUE')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'DUE'
                        ? 'bg-rose-600 text-white font-black shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Balance Due
                  </button>
                  <button
                    onClick={() => setStatusFilter('AGENCY')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'AGENCY'
                        ? 'bg-blue-600 text-white font-black shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Agency TAC
                  </button>
                </div>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="p-4 pl-6">Invoice # & Channel</th>
                      <th className="p-4">Billed Guest / Agency</th>
                      <th className="p-4">Stay Dates</th>
                      <th className="p-4">Total Amount</th>
                      <th className="p-4">Advance Paid</th>
                      <th className="p-4">Balance Due</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                    {isBookingsLoading ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-500 font-bold">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                          <span>Loading invoice records...</span>
                        </td>
                      </tr>
                    ) : filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-500 font-bold">
                          <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-black text-slate-800 dark:text-white">No Invoices Found</p>
                          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search criteria</p>
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => {
                        const isAgency = b.channel === 'AGENCY' || !!b.agencyId;
                        const realInv = b.invoices?.[0];
                        const invNumber = realInv?.invoiceNumber || (isAgency
                          ? `AGY-${b.id.slice(0, 8).toUpperCase()}`
                          : `INV-${b.id.slice(0, 8).toUpperCase()}`);

                        const billedTo = isAgency
                          ? b.agency?.name || 'Travel Agency Partner'
                          : b.guest?.fullName || 'Guest';

                        const subBilled = isAgency
                          ? `Passenger: ${b.guest?.fullName || 'Guest'}`
                          : b.guest?.phone || b.guest?.email || '—';

                        const isFullyPaid = (b.balanceDue || 0) <= 0;

                        return (
                          <tr
                            key={b.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors"
                          >
                            {/* Invoice # & Channel */}
                            <td className="p-4 pl-6">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`p-2 rounded-xl shrink-0 ${
                                    isAgency
                                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  }`}
                                >
                                  {isAgency ? <Building2 className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-black text-slate-900 dark:text-white font-mono text-xs block">
                                      {invNumber}
                                    </span>
                                    {realInv?.status === 'READY' && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        READY
                                      </span>
                                    )}
                                    {realInv?.status === 'GENERATING' && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                        GENERATING
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                    {b.channel}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Billed Guest / Agency */}
                            <td className="p-4">
                              <p className="font-black text-slate-900 dark:text-white truncate">{billedTo}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                {subBilled}
                              </p>
                            </td>

                            {/* Stay Dates */}
                            <td className="p-4">
                              <span className="font-extrabold text-slate-800 dark:text-slate-200 block text-[11px]">
                                {formatDate(b.checkInDate)} &rarr; {formatDate(b.checkOutDate)}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500">
                                {b.roomType?.name || 'Deluxe Room'}
                              </span>
                            </td>

                            {/* Total Amount */}
                            <td className="p-4">
                              <span className="font-black text-slate-900 dark:text-white">
                                {formatCurrency(b.totalAmount)}
                              </span>
                            </td>

                            {/* Advance Paid */}
                            <td className="p-4">
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(b.advancePaid)}
                              </span>
                            </td>

                            {/* Balance Due */}
                            <td className="p-4">
                              {isFullyPaid ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                  <CheckCheck className="w-3 h-3 text-emerald-600" />
                                  PAID IN FULL
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                  DUE: {formatCurrency(b.balanceDue)}
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="p-4 pr-6 text-right">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                {(() => {
                                  const issuedInvoice = b.invoices?.[0];

                                  return (
                                    <>
                                      {issuedInvoice && (
                                        <>
                                          <button
                                            onClick={() => setSelectedInvoiceBooking(b)}
                                            className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                            title="View & Print PDF"
                                          >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>View PDF</span>
                                          </button>

                                          <button
                                            onClick={() => handleRowDownload(issuedInvoice.id, issuedInvoice.invoiceNumber || 'INV-FINAL')}
                                            disabled={downloadingInvoiceId === issuedInvoice.id}
                                            className="h-8 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                            title="Download PDF"
                                          >
                                            {downloadingInvoiceId === issuedInvoice.id ? (
                                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600 dark:text-slate-300" />
                                            ) : (
                                              <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                                            )}
                                          </button>
                                        </>
                                      )}

                                      <button
                                        onClick={() => setSelectedInvoiceBooking(b)}
                                        className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer"
                                        title="Preview Invoice"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                                        <span>Preview</span>
                                      </button>
                                    </>
                                  );
                                })()}

                                {!isFullyPaid && (
                                  <button
                                    onClick={() => setSelectedPaymentBooking(b)}
                                    className="h-8 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                    title="Record Payment"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Pay</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* ═══ TAB 2: PAYMENT TRANSACTIONS LEDGER ═══ */}
        {activeTab === 'payments' && (
          <main className="px-6 pb-12 space-y-4 flex-1">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Recorded Payments & Receipts
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  Real-time transaction history across all reservations
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="p-4 pl-6">Transaction Ref</th>
                      <th className="p-4">Guest / Booking</th>
                      <th className="p-4">Payment Method</th>
                      <th className="p-4">Amount Received</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4 pr-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                    {bookings.map((b) => {
                      if (!b.advancePaid || b.advancePaid <= 0) return null;

                      return (
                        <tr key={`pay-${b.id}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 pl-6 font-mono font-black text-slate-900 dark:text-white">
                            TXN-{b.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="p-4 font-extrabold text-slate-900 dark:text-white">
                            {b.guest?.fullName || 'Guest'}
                            <span className="block text-[11px] font-semibold text-slate-500">
                              {b.roomType?.name || 'Deluxe Room'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CreditCard className="w-3 h-3 text-emerald-600" />
                              CASH / UPI / CARD
                            </span>
                          </td>
                          <td className="p-4 font-black text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(b.advancePaid)}
                          </td>
                          <td className="p-4 text-slate-500 font-medium">{formatDate(b.createdAt)}</td>
                          <td className="p-4 pr-6 text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              CONFIRMED
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* ═══ TAB 3: INVOICE TEMPLATE CUSTOMIZER WORKSPACE ═══ */}
        {activeTab === 'templates' && (
          <main className="px-6 pb-12 space-y-6 flex-1 max-w-[1400px]">
            {/* Template Presets Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Template Presets
                  </h3>
                  <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">
                    Select a pre-designed layout or customize your property brand styling below
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleApplyPreset(PRESET_TEMPLATES.STANDARD)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black transition-all cursor-pointer"
                  >
                    Standard Hotel
                  </button>
                  <button
                    onClick={() => handleApplyPreset(PRESET_TEMPLATES.CORPORATE)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-black transition-all cursor-pointer"
                  >
                    Corporate Tax
                  </button>
                  <button
                    onClick={() => handleApplyPreset(PRESET_TEMPLATES.LUXURY)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-black transition-all cursor-pointer"
                  >
                    Luxury Resort
                  </button>
                </div>
              </div>
            </div>

            {/* Template Editor Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Visual / Code Editor Controls */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Invoice Brand Customizer
                    </h3>
                  </div>

                  <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex gap-1 text-xs font-bold border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setEditorMode('visual')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        editorMode === 'visual'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Visual Mode
                    </button>
                    <button
                      onClick={() => setEditorMode('code')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        editorMode === 'code'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Code Mode
                    </button>
                  </div>
                </div>

                {editorMode === 'visual' ? (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Template Name
                      </label>
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Brand Accent Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={accentColor}
                          onChange={(e) => handleVisualParamChange(e.target.value, footerNote, showBankDetails)}
                          className="w-10 h-10 rounded-xl cursor-pointer border-0"
                        />
                        <span className="font-mono font-extrabold text-slate-700 dark:text-slate-300">
                          {accentColor}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Footer Note
                      </label>
                      <input
                        type="text"
                        value={footerNote}
                        onChange={(e) => handleVisualParamChange(accentColor, e.target.value, showBankDetails)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showBankDetails}
                          onChange={(e) => handleVisualParamChange(accentColor, footerNote, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                        />
                        <span>Include Bank Settlement Instructions</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
                      HTML Source Code
                    </label>
                    <textarea
                      value={htmlContent}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      rows={14}
                      className="w-full p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">
                    {isSaved ? 'Saved as draft' : 'Unsaved changes'}
                  </span>
                  <button
                    onClick={handleSave}
                    disabled={saveDraftMutation.isPending}
                    className="px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {saveDraftMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Save Template</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Live Render Preview Panel */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  Live Render Preview
                </h3>

                <div className="w-full h-[480px] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white shadow-inner">
                  <iframe
                    srcDoc={htmlContent}
                    title="Invoice Live Preview"
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Invoice Preview Modal */}
      {selectedInvoiceBooking && (
        <InvoicePreviewModal
          bookingId={selectedInvoiceBooking.id}
          bookingData={selectedInvoiceBooking}
          isOpen={!!selectedInvoiceBooking}
          onClose={() => setSelectedInvoiceBooking(null)}
        />
      )}

      {/* Record Payment Modal */}
      {selectedPaymentBooking && (
        <PaymentEntryModal
          bookingId={selectedPaymentBooking.id}
          booking={selectedPaymentBooking}
          isOpen={!!selectedPaymentBooking}
          onClose={() => setSelectedPaymentBooking(null)}
        />
      )}
    </div>
  );
}
