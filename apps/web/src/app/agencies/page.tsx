'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  X,
  Search,
  Edit3,
  Eye,
  Percent,
  Phone,
  Mail,
  User,
  SlidersHorizontal,
  ArrowRight,
  TrendingUp,
  Receipt,
  MessageSquare,
} from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { useTranslation } from '@/lib/i18n';
import { usePropertyStore } from '@/features/properties/store/use-property-store';
import {
  useAgenciesQuery,
  useCreateAgencyMutation,
  useUpdateAgencyMutation,
  useSettleCommissionMutation,
} from '@/features/agencies/api/use-agencies';
import { AgencyDetailsDrawer } from '@/features/agencies/components/agency-details-drawer';
import { formatDisplayName } from '@/lib/utils';

export default function AgenciesPage() {
  const { t } = useTranslation();
  const activeProperty = usePropertyStore((state) => state.activeProperty);
  const propertyId = activeProperty?.id || '';

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'settled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<any | null>(null);
  const [viewingAgency, setViewingAgency] = useState<any | null>(null);
  const [settleAgency, setSettleAgency] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [defaultTacRate, setDefaultTacRate] = useState('10');
  const [settleAmount, setSettleAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [referenceNote, setReferenceNote] = useState('');

  const { data, isLoading } = useAgenciesQuery(propertyId);
  const createMutation = useCreateAgencyMutation(propertyId);
  const updateMutation = useUpdateAgencyMutation(propertyId);
  const settleMutation = useSettleCommissionMutation(propertyId);

  const resetForm = () => {
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setDefaultTacRate('10');
    setEditingAgency(null);
  };

  const handleOpenEdit = (agency: any) => {
    setEditingAgency(agency);
    setName(agency.name || '');
    setContactPerson(agency.contactPerson || '');
    setPhone(agency.phone || '');
    setEmail(agency.email || '');
    setDefaultTacRate(String(agency.defaultTacRate || '10'));
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      contactPerson: contactPerson.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      defaultTacRate: parseFloat(defaultTacRate) || 0,
    };

    if (editingAgency) {
      updateMutation.mutate(
        { agencyId: editingAgency.id, payload },
        {
          onSuccess: () => {
            setIsAddModalOpen(false);
            resetForm();
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setIsAddModalOpen(false);
          resetForm();
        },
      });
    }
  };

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleAgency || !settleAmount) return;

    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) return;

    settleMutation.mutate(
      {
        agencyId: settleAgency.id,
        payload: {
          amount,
          paymentMethod,
          referenceNote: referenceNote.trim() || undefined,
        },
      } as any,
      {
        onSuccess: () => {
          setSettleAgency(null);
          setSettleAmount('');
          setReferenceNote('');
        },
      }
    );
  };

  const agencies = data?.agencies || [];

  // Filtered agencies based on search term & tab
  const filteredAgencies = useMemo(() => {
    return agencies.filter((agency: any) => {
      const matchSearch =
        !searchTerm.trim() ||
        agency.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        agency.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        agency.phone?.includes(searchTerm.trim()) ||
        agency.email?.toLowerCase().includes(searchTerm.toLowerCase().trim());

      const pendingBalance = (agency.totalTac || 0) - (agency.tacPaid || 0);
      if (activeTab === 'pending') return matchSearch && pendingBalance > 0;
      if (activeTab === 'settled') return matchSearch && pendingBalance <= 0;
      return matchSearch;
    });
  }, [agencies, searchTerm, activeTab]);

  // Overall TAC Summary Statistics
  const summaryMetrics = useMemo(() => {
    let totalAgencies = agencies.length;
    let totalTacEarned = 0;
    let totalTacPaid = 0;

    for (const a of agencies) {
      totalTacEarned += Number(a.totalTac || 0);
      totalTacPaid += Number(a.tacPaid || 0);
    }

    const pendingLedger = Math.max(0, totalTacEarned - totalTacPaid);

    return {
      totalAgencies,
      totalTacEarned,
      totalTacPaid,
      pendingLedger,
    };
  }, [agencies]);

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative overflow-hidden bg-slate-50/70 dark:bg-slate-950">
      <DashboardSidebar />

      <div className="flex-1 min-w-0 transition-all duration-300 relative z-10 flex flex-col min-h-screen overflow-y-auto">
        {/* Header Standardized across app */}
        <AppHeader
          actions={
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-md shadow-emerald-900/20 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('addAgency') || 'Add agency'}</span>
            </button>
          }
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {t('tacModuleTitle') || 'Travel Agency Commissions (TAC)'}
              </h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {activeProperty?.name || t('activeManagementHub')}
              </p>
            </div>
          </div>
        </AppHeader>

        <main className="p-4 sm:p-6 space-y-6 w-full flex-1">
          {/* ─── 1. TAC Summary Metrics Bar (Sentence Case & Headline Metric) ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Headline Metric: Total TAC (Accent Visual Weight) */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Total TAC
                </span>
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-emerald-800 dark:text-emerald-200 tracking-tight">
                ₹{summaryMetrics.totalTacEarned.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                Gross TAC generated to date
              </p>
            </div>

            {/* Metric 2: Active TAC agencies */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Active TAC agencies
                </span>
                <Building2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {summaryMetrics.totalAgencies}
              </p>
              <p className="text-[11px] font-medium text-slate-500">Registered travel agency partners</p>
            </div>

            {/* Metric 3: Pending TAC (Amber ONLY when pendingLedger > 0, else neutral) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    summaryMetrics.pendingLedger > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Pending TAC
                </span>
                <Clock
                  className={`w-4 h-4 ${
                    summaryMetrics.pendingLedger > 0 ? 'text-amber-500' : 'text-slate-400'
                  }`}
                />
              </div>
              <p
                className={`text-2xl font-black tracking-tight ${
                  summaryMetrics.pendingLedger > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                ₹{summaryMetrics.pendingLedger.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] font-medium text-slate-500">Unsettled commission payouts</p>
            </div>

            {/* Metric 4: TAC paid */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  TAC paid
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight">
                ₹{summaryMetrics.totalTacPaid.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] font-medium text-slate-500">Total settled agency payouts</p>
            </div>
          </div>

          {/* ─── 2. Search & Tab Filter Bar ─── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                All agencies ({agencies.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
                  activeTab === 'pending'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Pending payouts
              </button>
              <button
                onClick={() => setActiveTab('settled')}
                className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
                  activeTab === 'settled'
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs'
                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Settled history
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search agency, contact, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-full text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* ─── 3. Shared Low-Data Empty State / Agency Directory Table ─── */}
          {isLoading ? (
            <div className="py-16 text-center text-xs font-bold text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              Loading travel agencies...
            </div>
          ) : filteredAgencies.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-2xs">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {searchTerm ? 'No travel agencies found' : 'No TAC agencies registered'}
              </h3>
              <p className="text-xs font-medium text-slate-400 max-w-sm mx-auto">
                {searchTerm
                  ? 'No travel agency matches your search criteria. Try a different search term or clear filters.'
                  : `Register travel agency partners for ${
                      activeProperty?.name || 'this property'
                    } to automate commission calculations.`}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => {
                    resetForm();
                    setIsAddModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-full bg-emerald-800 text-white font-extrabold text-xs hover:bg-emerald-900 transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add agency
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xs border border-slate-200/90 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700">
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Agency name
                      </th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                        TAC rate (%)
                      </th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                        Total TAC
                      </th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                        TAC paid
                      </th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                        Pending TAC
                      </th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                    {filteredAgencies.map((agency: any) => {
                      const totalTac = Number(agency.totalTac || 0);
                      const tacPaid = Number(agency.tacPaid || 0);
                      const pendingBalance = Math.max(0, totalTac - tacPaid);
                      const formattedAgencyName = formatDisplayName(agency.name);
                      const formattedContactPerson = formatDisplayName(agency.contactPerson || '');

                      return (
                        <tr
                          key={agency.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Agency Details */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs">
                                <Building2 className="w-4.5 h-4.5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {formattedAgencyName}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                  {formattedContactPerson && (
                                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                                      {formattedContactPerson}
                                    </span>
                                  )}
                                  {formattedContactPerson && agency.phone && <span>•</span>}
                                  {agency.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      {agency.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Rate */}
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200/60 dark:border-slate-700">
                              {agency.defaultTacRate || 10}%
                            </span>
                          </td>

                          {/* Total TAC */}
                          <td className="px-6 py-4 text-right">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              ₹{totalTac.toLocaleString('en-IN')}
                            </span>
                          </td>

                          {/* Paid TAC */}
                          <td className="px-6 py-4 text-right">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{tacPaid.toLocaleString('en-IN')}
                            </span>
                          </td>

                          {/* Pending TAC (Neutral when 0) */}
                          <td className="px-6 py-4 text-right">
                            {pendingBalance > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200/80 dark:border-amber-800">
                                ₹{pendingBalance.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                                ₹0
                              </span>
                            )}
                          </td>

                          {/* Actions: Verb-First "Mark settled" vs Read-Only Badge */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setViewingAgency(agency)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 dark:text-slate-300 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/50 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{t('view') || 'View'}</span>
                              </button>

                              <button
                                onClick={() => handleOpenEdit(agency)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 dark:text-slate-300 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/50 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>{t('edit') || 'Edit'}</span>
                              </button>

                              {pendingBalance > 0 ? (
                                <button
                                  onClick={() => {
                                    setSettleAgency(agency);
                                    setSettleAmount(String(pendingBalance));
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Mark settled</span>
                                </button>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Settled
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Bottom-Right Support Chat Launcher Button */}
      <button
        onClick={() => alert('Support & PMS Help Assistant launcher initialized')}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white shadow-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 border border-emerald-700 z-40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        aria-label="Support & Help Assistant"
        title="Support & Help Assistant"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {/* Drawer */}
      {viewingAgency && (
        <AgencyDetailsDrawer
          agencyId={viewingAgency.id}
          initialAgency={viewingAgency}
          propertyId={propertyId}
          onClose={() => setViewingAgency(null)}
          onEdit={(agency: any) => handleOpenEdit(agency)}
          onSettle={(agency: any) => {
            const pendingBalance = Math.max(0, Number(agency.totalTac || 0) - Number(agency.tacPaid || 0));
            setSettleAgency(agency);
            setSettleAmount(String(pendingBalance));
          }}
        />
      )}

      {/* Add / Edit Agency Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingAgency ? 'Edit Travel Agency' : 'Register New Travel Agency'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Agency Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MakeMyTrip, Agoda, Goibibo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    TAC Rate (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={defaultTacRate}
                    onChange={(e) => setDefaultTacRate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="contact@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingAgency ? (
                    'Save Changes'
                  ) : (
                    'Register Agency'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Commission Modal */}
      {settleAgency && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Settle TAC Payout
                </h3>
                <p className="text-xs font-bold text-emerald-600">
                  {formatDisplayName(settleAgency.name)}
                </p>
              </div>
              <button
                onClick={() => setSettleAgency(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Payout Amount (₹) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="BANK_TRANSFER font-bold">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CREDIT_CARD">Credit / Debit Card</option>
                  <option value="CASH">Cash Payout</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Reference Note / Transaction ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR #12345678 or Cheque #0045"
                  value={referenceNote}
                  onChange={(e) => setReferenceNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSettleAgency(null)}
                  className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settleMutation.isPending}
                  className="px-5 py-2 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {settleMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Confirm Payout
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
