'use client';

import React from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { AppHeader } from '@/components/app-header';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { useTranslation } from '@/lib/i18n';
import { Users, Rocket } from 'lucide-react';

export default function GuestsPage() {
  const { t } = useTranslation();
  useActivePropertyQuery();
  const activeProperty = usePropertyStore((s) => s.activeProperty);

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative">
      {/* Left Navigation Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header */}
        <AppHeader
          actions={
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {t('comingSoon')}
            </span>
          }
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {t('guests')}
              </h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {activeProperty?.name || t('activeManagementHub')}
              </p>
            </div>
          </div>
        </AppHeader>

        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] flex-1">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 max-w-md text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <Rocket className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('guests')} CRM</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Guest CRM, stay analytics, VIP tagging, blacklisting, and document vault are coming in Phase 5.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
