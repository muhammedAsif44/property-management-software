'use client';

import React, { useState } from 'react';
import { Building, Plus, CheckCircle2, Clock, DollarSign, Loader2, X } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { useTranslation } from '@/lib/i18n';
import { usePropertyStore } from '@/features/properties/store/use-property-store';
import { useAgenciesQuery, useCreateAgencyMutation, useSettleCommissionMutation } from '@/features/agencies/api/use-agencies';

export default function AgenciesPage() {
  const { t } = useTranslation();
  const activeProperty = usePropertyStore((state) => state.activeProperty);
  const propertyId = activeProperty?.id || '';

  const [activeTab, setActiveTab] = useState<'pending' | 'settled'>('pending');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [settleAgency, setSettleAgency] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [defaultTacRate, setDefaultTacRate] = useState('10');
  const [settleAmount, setSettleAmount] = useState('');

  const { data, isLoading } = useAgenciesQuery(propertyId);
  const createMutation = useCreateAgencyMutation(propertyId);
  const settleMutation = useSettleCommissionMutation(propertyId);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    createMutation.mutate(
      {
        name,
        contactPerson,
        phone,
        email,
        defaultTacRate: parseFloat(defaultTacRate) || 0,
      },
      {
        onSuccess: () => {
          setIsAddModalOpen(false);
          setName('');
          setContactPerson('');
          setPhone('');
          setEmail('');
        },
      },
    );
  };

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleAgency || !settleAmount) return;

    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) return;

    settleMutation.mutate(
      { agencyId: settleAgency.id, amount },
      {
        onSuccess: () => {
          setSettleAgency(null);
          setSettleAmount('');
        },
      },
    );
  };

  const agencies = data?.agencies || [];

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative">
      {/* Left Navigation Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <AppHeader
          actions={
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="truncate">{t('addAgency')}</span>
            </button>
          }
        />

        <main className="w-full px-6 py-6 space-y-6 flex-1 max-w-[1400px]">
          {/* Page Header */}
          <div className="flex items-center justify-between min-w-0">
            <div className="min-w-0">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                {t('agencyManagement')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {t('agenciesAndTac')}
              </p>
            </div>
          </div>

          {/* Pending vs Settled Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'pending'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{t('pending')} TAC Ledger</span>
            </button>
            <button
              onClick={() => setActiveTab('settled')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'settled'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('settled')} TAC History</span>
            </button>
          </div>

          {/* Agency Directory List */}
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading agencies...</div>
          ) : agencies.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Building className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">No travel agencies found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agencies.map((agency: any) => (
                <div
                  key={agency.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 min-w-0"
                >
                  <div className="flex items-start justify-between min-w-0">
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {agency.name}
                      </h3>
                      {agency.contactPerson && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          Contact: {agency.contactPerson}
                        </p>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 shrink-0">
                      {agency.defaultTacRate}% TAC
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold">
                    <div>
                      <span className="text-[10px] text-slate-400 block truncate">{t('totalTac')}</span>
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        ₹{agency.totalTac.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block truncate">{t('tacPaid')}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate">
                        ₹{agency.tacPaid.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block truncate">{t('pendingTac')}</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400 truncate">
                        ₹{agency.pendingTac.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {activeTab === 'pending' && agency.pendingTac > 0 && (
                    <button
                      onClick={() => {
                        setSettleAgency(agency);
                        setSettleAmount(agency.pendingTac.toString());
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span className="truncate">{t('settleCommission')}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add Agency Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {t('addAgency')}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t('agencyName')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t('contactPerson')}</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{t('tacRate')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={defaultTacRate}
                    onChange={(e) => setDefaultTacRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{t('addAgency')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Commission Modal */}
      {settleAgency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {t('settleCommission')} — {settleAgency.name}
              </h3>
              <button onClick={() => setSettleAgency(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSettleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('settlementAmount')} (Max: ₹{settleAgency.pendingTac})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={settleAgency.pendingTac}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-amber-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={settleMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {settleMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{t('settleConfirm')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
