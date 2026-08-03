'use client';

import React from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { useTranslation, LanguageSwitcher } from '@/lib/i18n';
import { Receipt, Rocket } from 'lucide-react';

export default function InvoicesPage() {
  const { t } = useTranslation();
  useActivePropertyQuery();
  const activeProperty = usePropertyStore((s) => s.activeProperty);

  return (
    <div className="min-h-screen bg-slate-50/90 text-slate-900 font-sans antialiased flex relative overflow-hidden">
      {/* Ambient Rich Emerald Glow */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Left Navigation Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 transition-all duration-300 relative z-10 flex flex-col min-h-screen">
        {/* ═══ Top Header Bar ═══ */}
        <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-emerald-200/80 sticky top-0 z-30 px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-100/80 border border-emerald-200 text-emerald-800 shadow-xs shrink-0">
              <Receipt className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-slate-900 tracking-tight truncate">
                {t('invoicesAndBilling')}
              </h1>
              <p className="text-[11px] font-semibold text-emerald-700/80 truncate">
                {activeProperty?.name || t('activeManagementHub')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <LanguageSwitcher />
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100/90 text-amber-900 border border-amber-300 shadow-2xs">
              {t('comingSoon')}
            </span>
          </div>
        </header>

        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] flex-1">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-emerald-200/90 shadow-sm p-12 max-w-md text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-700 shadow-inner">
              <Rocket className="w-8 h-8 animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-slate-900">{t('invoicesAndBilling')} — Phase 6</h2>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Automated GST Invoice PDF generation, folio splits, credit notes, and payment gateway settlement reconciliation coming in Phase 6.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
