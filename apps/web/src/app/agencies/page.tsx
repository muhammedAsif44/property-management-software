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

    const uniqueRef = `SETTLE-${settleAgency.id.slice(0, 6).toUpperCase()}-${crypto.randomUUID().toUpperCase()}`;

    settleMutation.mutate(
      {
        agencyId: settleAgency.id,
        amount,
        reference: uniqueRef,
        paymentMethod,
        remarks: referenceNote.trim() || undefined,
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
        {/* Header Pill Matching PMS Screenshot */}
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
              <span className="hidden sm:inline">{t('addAgency')}</span>
            </button>
          }
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-3 bg-slate-50/90 dark:bg-slate-850 px-4 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-800 shadow-2xs min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate">
                  {activeProperty?.name || 'Azura Resorts & Spa'}
                </h1>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 leading-tight truncate">
                  {t('tacModuleTitle')}
                </span>
              </div>
            </div>
          </div>
        </AppHeader>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full space-y-6 pb-20">
          {/* ─── 1. TAC Summary Metrics Bar ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{t('activeAgencies')}</span>
                <Building2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {summaryMetrics.totalAgencies}
              </p>
              <p className="text-[11px] font-medium text-slate-500">Registered Travel Agency Partners</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-600">{t('pendingTac')}</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                ₹{summaryMetrics.pendingLedger.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] font-medium text-slate-500">Unsettled Commission Payouts</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">{t('tacPaid')}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300 tracking-tight">
                ₹{summaryMetrics.totalTacPaid.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] font-medium text-slate-500">Total Settled Agency Payouts</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{t('totalTac')}</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                ₹{summaryMetrics.totalTacEarned.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] font-medium text-slate-500">Gross TAC Generated to Date</p>
            </div>
          </div>

          {/* ─── 2. Search & Tab Filter Bar ─── */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                All Agencies ({agencies.length})
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
                Pending Payouts
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
                Settled History
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

          {/* ─── 3. Agency Directory Cards ─── */}
          {isLoading ? (
            <div className="py-16 text-center text-xs font-bold text-slate-400">Loading travel agencies...</div>
          ) : filteredAgencies.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl space-y-3">
              <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">No TAC agencies registered</h3>
              <p className="text-xs font-medium text-slate-400 max-w-sm mx-auto">
                Register travel agency partners for {activeProperty?.name || 'this property'} to automate commission calculations.
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setIsAddModalOpen(true);
                }}
                className="px-4 py-2 rounded-full bg-emerald-800 text-white font-extrabold text-xs hover:bg-emerald-900 transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Register Agency
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('agencyName')}</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">{t('tacRate')}</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">{t('totalTac')}</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">{t('tacPaid')}</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">{t('pendingTac')}</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">{t('actionsHeader')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                    {filteredAgencies.map((agency: any) => {
                      const totalTac = Number(agency.totalTac || 0);
                      const tacPaid = Number(agency.tacPaid || 0);
                      const pendingBalance = Math.max(0, totalTac - tacPaid);

                      return (
                        <tr key={agency.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                          {/* Agency Details */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3.5">
                              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/40 dark:to-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
                                <Building2 className="w-5 h-5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                  {agency.name}
                                </span>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {agency.contactPerson && <span className="font-medium text-slate-600 dark:text-slate-300">{agency.contactPerson}</span>}
                                  {agency.contactPerson && agency.phone && <span>•</span>}
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
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200/60 dark:border-slate-700">
                              {agency.defaultTacRate || 10}%
                            </span>
                          </td>

                          {/* Total TAC */}
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                              ₹{totalTac.toLocaleString('en-IN')}
                            </span>
                          </td>

                          {/* Paid TAC */}
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{tacPaid.toLocaleString('en-IN')}
                            </span>
                          </td>

                          {/* Pending TAC */}
                          <td className="px-6 py-4 text-right">
                            {pendingBalance > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-bold text-xs border border-amber-200/60 dark:border-amber-800/50">
                                ₹{pendingBalance.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                                ₹0
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2.5">
                              <button
                                onClick={() => setViewingAgency(agency)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 dark:text-slate-300 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/50 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{t('view')}</span>
                              </button>
                              
                              <button
                                onClick={() => handleOpenEdit(agency)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 dark:text-slate-300 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/50 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>{t('edit')}</span>
                              </button>

                              {pendingBalance > 0 ? (
                                <button
                                  onClick={() => {
                                    setSettleAgency(agency);
                                    setSettleAmount(String(pendingBalance));
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ml-1"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{t('settleCommission')}</span>
                                </button>
                              ) : (
                                <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-[11px] flex items-center gap-1.5 border border-slate-200 dark:border-slate-700/50 ml-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{t('settled')}</span>
                                </div>
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

      {/* ─── Create / Edit Agency Modal ─── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingAgency ? t('editAgency') : t('addAgency')}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Property: {activeProperty?.name || 'Current Property'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('agencyName')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zenith Travels / MakeMyTrip"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('contactPerson')}
                </label>
                <input
                  type="text"
                  placeholder="Primary agent contact name"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('tacRate')} *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    placeholder="10.0"
                    value={defaultTacRate}
                    onChange={(e) => setDefaultTacRate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-xs font-black focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="agent@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-3 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingAgency ? 'Save Changes' : 'Register Agency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Settle Commission Modal ─── */}
      {settleAgency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {t('settleCommission')}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Agency: {settleAgency.name}
                  </p>
                </div>
              </div>
              <button onClick={() => setSettleAgency(null)} className="p-2 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettleSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200/80 text-xs space-y-1">
                <div className="flex justify-between font-extrabold text-amber-900 dark:text-amber-300">
                  <span>Current Pending Balance</span>
                  <span>₹{((settleAgency.totalTac || 0) - (settleAgency.tacPaid || 0)).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('settlementAmount')} (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  max={(settleAgency.totalTac || 0) - (settleAgency.tacPaid || 0)}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-xs font-black focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-xs font-bold focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI Payout</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Reference / Txn #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-987123"
                    value={referenceNote}
                    onChange={(e) => setReferenceNote(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSettleAgency(null)}
                  className="flex-1 py-3 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settleMutation.isPending}
                  className="flex-1 py-3 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {settleMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t('settleConfirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ─── Agency Details Drawer ─── */}
      {viewingAgency && (
        <AgencyDetailsDrawer
          agencyId={viewingAgency.id}
          initialAgency={viewingAgency}
          propertyId={propertyId}
          onClose={() => setViewingAgency(null)}
          onEdit={(agency) => {
            setViewingAgency(null);
            handleOpenEdit(agency);
          }}
          onSettle={(agency) => {
            setViewingAgency(null);
            setSettleAgency(agency);
            setSettleAmount(String(Math.max(0, (agency.totalTac || 0) - (agency.tacPaid || 0))));
          }}
        />
      )}
    </div>
  );
}
