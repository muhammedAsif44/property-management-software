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
  BarChart3,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
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
        toast.warning('Popup was blocked by your browser. Please allow popups to view PDF.', 'Popup Blocked');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to open PDF viewer', 'PDF Error');
    } finally {
      setOpeningPdfId(null);
    }
  };

  const handleRowDownload = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setDownloadingInvoiceId(invoiceId);
      toast.info('Starting PDF download...', 'Invoice PDF');
      await invoiceService.downloadInvoice(invoiceId, invoiceNumber);
      toast.success('Invoice PDF downloaded successfully', 'Downloaded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to download PDF', 'Download Error');
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  // Queries
  const { data: bookingsData, isLoading: isBookingsLoading } = useBookingsQuery({ propertyId: activeProperty?.id });
  const bookings: Booking[] = useMemo(() => {
    if (!bookingsData) return [];
    if (Array.isArray(bookingsData)) return bookingsData;
    if (Array.isArray((bookingsData as any).bookings)) return (bookingsData as any).bookings;
    if (Array.isArray((bookingsData as any).data)) return (bookingsData as any).data;
    return [];
  }, [bookingsData]);

  const { data: templates = [], isLoading: isTemplatesLoading } = useTemplatesQuery();
  const saveDraftMutation = useSaveDraftTemplateMutation();
  const publishMutation = usePublishTemplateMutation();

  // Template editor state
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');
  const [templateName, setTemplateName] = useState('Default Hotel Invoice');
  const [accentColor, setAccentColor] = useState('#0B6E4F');
  const [footerNote, setFooterNote] = useState('Thank you for staying with us! We hope to see you again soon.');
  const [showBankDetails, setShowBankDetails] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  // Generate initial HTML template when activeProperty or params change
  const buildInitialHtml = (color: string, note: string, bank: boolean) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; margin: 0; padding: 32px; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${color}; padding-bottom: 20px; }
    .hotel-name { font-size: 24px; font-weight: 800; color: ${color}; }
    .invoice-title { font-size: 22px; font-weight: 700; text-align: right; color: #0f172a; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #ecfdf5; color: #059669; font-size: 11px; font-weight: 700; margin-top: 4px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; font-size: 12px; line-height: 1.6; }
    .meta-box { background: #f8fafc; border-radius: 8px; padding: 14px; }
    .meta-box h4 { margin: 0 0 6px 0; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 12px; }
    th { background: #f1f5f9; color: #334155; font-weight: 700; text-align: left; padding: 10px 12px; border-bottom: 1px solid #cbd5e1; font-size: 11px; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
    .total-box { margin-left: auto; width: 260px; font-size: 12px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .grand-total { border-top: 2px solid ${color}; font-weight: 800; font-size: 15px; color: ${color}; padding-top: 8px; margin-top: 4px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="hotel-name">{{propertyName}}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">{{propertyAddress}} &bull; GSTIN: {{propertyGst}}</div>
    </div>
    <div style="text-align: right;">
      <div class="invoice-title">TAX INVOICE</div>
      <div style="font-size: 12px; color: #64748b;">#{{invoiceNumber}}</div>
      <div class="badge">ORIGINAL FOR RECIPIENT</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <h4>Billed To (Guest)</h4>
      <div style="font-weight: 700; font-size: 13px; color: #0f172a;">{{guestName}}</div>
      <div>{{guestPhone}} &bull; {{guestEmail}}</div>
      <div>GSTIN: {{guestGst}}</div>
    </div>
    <div class="meta-box">
      <h4>Stay & Reservation Details</h4>
      <div><strong>Check-In:</strong> {{checkInDate}}</div>
      <div><strong>Check-Out:</strong> {{checkOutDate}}</div>
      <div><strong>Room:</strong> {{roomNumber}} ({{roomType}})</div>
      <div><strong>Channel:</strong> {{bookingChannel}}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description / Service Item</th>
        <th style="text-align: center;">SAC Code</th>
        <th style="text-align: center;">Nights / Qty</th>
        <th style="text-align: right;">Rate (₹)</th>
        <th style="text-align: right;">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Room Accommodation Charges ({{roomType}})</td>
        <td style="text-align: center;">996311</td>
        <td style="text-align: center;">{{nightsCount}}</td>
        <td style="text-align: right;">{{nightlyRate}}</td>
        <td style="text-align: right;">{{roomSubtotal}}</td>
      </tr>
      <tr>
        <td>CGST @ 6.0%</td>
        <td style="text-align: center;">—</td>
        <td style="text-align: center;">1</td>
        <td style="text-align: right;">—</td>
        <td style="text-align: right;">{{cgstAmount}}</td>
      </tr>
      <tr>
        <td>SGST @ 6.0%</td>
        <td style="text-align: center;">—</td>
        <td style="text-align: center;">1</td>
        <td style="text-align: right;">—</td>
        <td style="text-align: right;">{{sgstAmount}}</td>
      </tr>
    </tbody>
  </table>

  <div class="total-box">
    <div class="total-row"><span>Subtotal:</span><span>₹{{subtotalAmount}}</span></div>
    <div class="total-row"><span>Total Tax (GST 12%):</span><span>₹{{totalTaxAmount}}</span></div>
    <div class="total-row"><span>Advance Paid:</span><span style="color: #059669;">- ₹{{advancePaid}}</span></div>
    <div class="total-row grand-total"><span>Balance Due:</span><span>₹{{balanceDue}}</span></div>
  </div>

  ${bank ? `<div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; margin-top: 24px; font-size: 11px; color: #475569;">
    <strong>Bank Settlement Details:</strong> Bank: HDFC Bank &bull; A/C: 50200012345678 &bull; IFSC: HDFC0001234 &bull; UPI: azura@upi
  </div>` : ''}

  <div class="footer">
    ${note}
  </div>
</body>
</html>`;

  // Initialize htmlContent once
  React.useEffect(() => {
    if (!htmlContent) {
      setHtmlContent(buildInitialHtml(accentColor, footerNote, showBankDetails));
    }
  }, [accentColor, footerNote, showBankDetails, htmlContent]);

  // Load existing template if available
  React.useEffect(() => {
    if (templates.length > 0) {
      const active = (templates as any[]).find((t: any) => t.isPublished) || templates[0];
      if (active) {
        setTemplateName(active.name);
        setHtmlContent(active.htmlContent);
      }
    }
  }, [templates]);

  // Visual mode change handlers
  const handleVisualParamChange = (color: string, note: string, bank: boolean) => {
    setAccentColor(color);
    setFooterNote(note);
    setShowBankDetails(bank);
    setHtmlContent(buildInitialHtml(color, note, bank));
    setIsSaved(false);
  };

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES.STANDARD) => {
    setTemplateName(preset.name);
    setAccentColor(preset.accentColor);
    setFooterNote(preset.footerNote);
    setHtmlContent(buildInitialHtml(preset.accentColor, preset.footerNote, showBankDetails));
    setIsSaved(false);
  };

  const handleCodeChange = (val: string) => {
    setHtmlContent(val);
    setIsSaved(false);
  };

  const handleSave = async () => {
    if (!activeProperty) return;
    try {
      await saveDraftMutation.mutateAsync({
        name: templateName,
        htmlContent,
      });
      setIsSaved(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishMutation.mutateAsync(id);
    } catch (err) {
      console.error(err);
    }
  };

  // Financial KPIs
  const summaryMetrics = useMemo(() => {
    let totalInvoiced = 0;
    let collectedRevenue = 0;
    let pendingBalance = 0;
    let totalTacCommission = 0;

    bookings.forEach((b) => {
      const total = Number(b.totalAmount || 0);
      const paid = Number(b.advancePaid || 0);
      const due = Number(b.balanceDue || 0);

      totalInvoiced += total;
      collectedRevenue += paid;
      pendingBalance += due;

      if (b.channel === 'AGENCY' || b.agencyId) {
        const tacRes = calculateTac(total, (b.agency as any)?.tacPercentage || 10);
        totalTacCommission += (tacRes.tacAmount || 0);
      }
    });

    return {
      totalInvoiced,
      collectedRevenue,
      pendingBalance,
      totalTacCommission,
    };
  }, [bookings]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Search
      const q = searchQuery.toLowerCase();
      const guestName = b.guest?.fullName?.toLowerCase() || '';
      const agencyName = b.agency?.name?.toLowerCase() || '';
      const bId = b.id.toLowerCase();
      const invNum = b.invoices?.[0]?.invoiceNumber?.toLowerCase() || '';

      const matchesSearch = !q || guestName.includes(q) || agencyName.includes(q) || bId.includes(q) || invNum.includes(q);

      // Status
      if (!matchesSearch) return false;

      const isPaid = (b.balanceDue || 0) <= 0;
      const isDue = (b.balanceDue || 0) > 0;
      const isAgency = b.channel === 'AGENCY' || !!b.agencyId;

      if (statusFilter === 'PAID') return isPaid;
      if (statusFilter === 'DUE') return isDue;
      if (statusFilter === 'AGENCY') return isAgency;
      return true;
    });
  }, [bookings, searchQuery, statusFilter]);

  const paymentsCount = useMemo(() => {
    return bookings.filter((b) => Number(b.advancePaid || 0) > 0).length;
  }, [bookings]);

  const formatDate = (d: string) => {
    if (!d) return '—';
    const dateStr = d.includes('T') ? d : `${d}T00:00:00`;
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

  return (
    <AppShell
      sectionIcon={Receipt}
      sectionTitle={t('sectionFinancials')}
      sectionDescription={t('sectionFinancialsDesc')}
      sectionTabs={[
        {
          label: t('tabInvoices'),
          icon: Receipt,
          count: bookings.length,
          isActive: activeTab === 'invoices',
          onClick: () => setActiveTab('invoices'),
        },
        {
          label: t('tabPaymentLedger'),
          icon: CreditCard,
          count: paymentsCount,
          isActive: activeTab === 'payments',
          onClick: () => setActiveTab('payments'),
        },
        {
          label: t('tabTemplates'),
          icon: Palette,
          isActive: activeTab === 'templates',
          onClick: () => setActiveTab('templates'),
        },
        {
          label: t('tabFinancialReports'),
          icon: BarChart3,
          href: '/reports',
        },
      ]}
      layout="wide"
    >
      {/* ─── KPI Analytics Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Invoiced */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">{t('totalInvoiced')}</span>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {formatCurrency(summaryMetrics.totalInvoiced)}
          </p>
          <p className="text-[10px] font-semibold text-slate-400">Across {bookings.length} reservations</p>
        </div>

        {/* 2. Collected Revenue */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">{t('collectedRevenue')}</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summaryMetrics.collectedRevenue)}
          </p>
          <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Advance & Payments Received</p>
        </div>

        {/* 3. Pending Balance Due */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">{t('pendingBalance')}</span>
            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(summaryMetrics.pendingBalance)}
          </p>
          <p className="text-[10px] font-semibold text-rose-700 dark:text-rose-400">Outstanding Balance</p>
        </div>

        {/* 4. Agency TAC Commissions */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">{t('agencyTacCommissions')}</span>
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
            {formatCurrency(summaryMetrics.totalTacCommission)}
          </p>
          <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-400">Travel Partner Commissions</p>
        </div>
      </div>

      {/* ═══ TAB 1: ALL INVOICES LEDGER WORKSPACE ═══ */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filter & Search Header */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice #, guest, or agency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex gap-0.5 text-xs font-bold border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All Invoices
                </button>
                <button
                  onClick={() => setStatusFilter('PAID')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    statusFilter === 'PAID'
                      ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Fully Paid
                </button>
                <button
                  onClick={() => setStatusFilter('DUE')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    statusFilter === 'DUE'
                      ? 'bg-rose-600 text-white font-bold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Balance Due
                </button>
                <button
                  onClick={() => setStatusFilter('AGENCY')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    statusFilter === 'AGENCY'
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Agency TAC
                </button>
              </div>
            </div>
          </div>

          {/* Invoices Table — Full Width Stretch Without Overflow Scrollbar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3.5 pl-4 w-[20%]">Invoice # & Channel</th>
                  <th className="py-3 px-3.5 w-[20%]">Billed Guest / Agency</th>
                  <th className="py-3 px-3.5 w-[16%]">Stay Dates</th>
                  <th className="py-3 px-3.5 w-[13%]">Total Amount</th>
                  <th className="py-3 px-3.5 w-[11%]">Advance Paid</th>
                  <th className="py-3 px-3.5 w-[11%]">Balance Due</th>
                  <th className="py-3 px-3.5 pr-4 text-right w-[9%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                {isBookingsLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-bold">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                      <span>Loading invoice records...</span>
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-bold">
                      <Receipt className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-800 dark:text-white">No Invoices Found</p>
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
                        <td className="py-3 px-3.5 pl-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`p-1.5 rounded-lg shrink-0 ${
                                isAgency
                                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              }`}
                            >
                              {isAgency ? <Building2 className="w-3.5 h-3.5" /> : <Receipt className="w-3.5 h-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-slate-900 dark:text-white font-mono text-xs truncate">
                                  {invNumber}
                                </span>
                                {realInv?.status === 'READY' && (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    READY
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                                {b.channel}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Billed Guest / Agency */}
                        <td className="py-3 px-3.5">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{billedTo}</p>
                          <p className="text-[11px] text-slate-400 font-medium truncate">
                            {subBilled}
                          </p>
                        </td>

                        {/* Stay Dates */}
                        <td className="py-3 px-3.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px] truncate">
                            {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 block truncate">
                            {b.roomType?.name || 'Deluxe Room'}
                          </span>
                        </td>

                        {/* Total Amount */}
                        <td className="py-3 px-3.5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(b.totalAmount)}
                          </span>
                        </td>

                        {/* Advance Paid */}
                        <td className="py-3 px-3.5">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(b.advancePaid)}
                          </span>
                        </td>

                        {/* Balance Due */}
                        <td className="py-3 px-3.5">
                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              <CheckCheck className="w-3 h-3 text-emerald-600" />
                              PAID
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 truncate">
                              DUE: {formatCurrency(b.balanceDue)}
                            </span>
                          )}
                        </td>

                        {/* Actions — Compact Icon Group */}
                        <td className="py-3 px-3.5 pr-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            {(() => {
                              const issuedInvoice = b.invoices?.[0];

                              return (
                                <>
                                  {issuedInvoice ? (
                                    <>
                                      <button
                                        onClick={() => setSelectedInvoiceBooking(b)}
                                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
                                        title="View & Print PDF"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        onClick={() => handleRowDownload(issuedInvoice.id, issuedInvoice.invoiceNumber || 'INV-FINAL')}
                                        disabled={downloadingInvoiceId === issuedInvoice.id}
                                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                                        title="Download PDF"
                                      >
                                        {downloadingInvoiceId === issuedInvoice.id ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                                        ) : (
                                          <Download className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => setSelectedInvoiceBooking(b)}
                                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                                      title="Preview Invoice"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              );
                            })()}

                            {!isFullyPaid && (
                              <button
                                onClick={() => setSelectedPaymentBooking(b)}
                                className="px-2 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Record Payment"
                              >
                                <CreditCard className="w-3 h-3" />
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
      )}

      {/* ═══ TAB 2: PAYMENT TRANSACTIONS LEDGER ═══ */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Recorded Payments & Receipts
              </h3>
              <span className="text-xs font-medium text-slate-400">
                Real-time transaction history across all reservations
              </span>
            </div>

            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3.5 pl-4 w-[20%]">Transaction Ref</th>
                  <th className="py-3 px-3.5 w-[25%]">Guest / Booking</th>
                  <th className="py-3 px-3.5 w-[20%]">Payment Method</th>
                  <th className="py-3 px-3.5 w-[15%]">Amount Received</th>
                  <th className="py-3 px-3.5 w-[10%]">Date</th>
                  <th className="py-3 px-3.5 pr-4 text-right w-[10%]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                {bookings.filter((b) => Number(b.advancePaid || 0) > 0).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-bold">
                      <CreditCard className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-800 dark:text-white">No Payments Recorded</p>
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => {
                    if (!b.advancePaid || b.advancePaid <= 0) return null;

                    return (
                      <tr key={`pay-${b.id}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="py-3 px-3.5 pl-4 font-mono font-bold text-slate-900 dark:text-white truncate">
                          TXN-{b.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                          <span className="block truncate">{b.guest?.fullName || 'Guest'}</span>
                          <span className="block text-[11px] font-medium text-slate-400 truncate">
                            {b.roomType?.name || 'Deluxe Room'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CreditCard className="w-3 h-3 text-emerald-600" />
                            CASH / UPI / CARD
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(b.advancePaid)}
                        </td>
                        <td className="py-3 px-3.5 text-slate-400 font-medium">{formatDate(b.createdAt)}</td>
                        <td className="py-3 px-3.5 pr-4 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            CONFIRMED
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ TAB 3: INVOICE TEMPLATE CUSTOMIZER WORKSPACE ═══ */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {/* Template Presets Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Template Presets
                </h3>
                <p className="text-xs font-semibold text-slate-800 dark:text-white mt-0.5">
                  Select a pre-designed layout or customize your property brand styling below
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleApplyPreset(PRESET_TEMPLATES.STANDARD)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Standard Hotel
                </button>
                <button
                  onClick={() => handleApplyPreset(PRESET_TEMPLATES.CORPORATE)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Corporate Tax
                </button>
                <button
                  onClick={() => handleApplyPreset(PRESET_TEMPLATES.LUXURY)}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Luxury Resort
                </button>
              </div>
            </div>
          </div>

          {/* Template Editor Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column: Visual / Code Editor Controls */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Invoice Brand Customizer
                  </h3>
                </div>

                <div className="p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex gap-0.5 text-xs font-bold border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setEditorMode('visual')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      editorMode === 'visual'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Visual Mode
                  </button>
                  <button
                    onClick={() => setEditorMode('code')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      editorMode === 'code'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Code Mode
                  </button>
                </div>
              </div>

              {editorMode === 'visual' ? (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="w-full px-3.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
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
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
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
                      className="w-full px-3.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="pt-1">
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
                <div className="space-y-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
                    HTML Source Code
                  </label>
                  <textarea
                    value={htmlContent}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    rows={12}
                    className="w-full p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  {isSaved ? 'Saved as draft' : 'Unsaved changes'}
                </span>
                <button
                  onClick={handleSave}
                  disabled={saveDraftMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {saveDraftMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Template</span>
                </button>
              </div>
            </div>

            {/* Right Column: Live Render Preview Panel */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                Live Render Preview
              </h3>

              <div className="w-full h-[450px] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white shadow-inner">
                <iframe
                  srcDoc={htmlContent}
                  title="Invoice Live Preview"
                  className="w-full h-full border-0 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

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
    </AppShell>
  );
}
