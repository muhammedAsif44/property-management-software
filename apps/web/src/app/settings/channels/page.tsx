'use client';

import React from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { AppHeader } from '@/components/app-header';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { ChannelManagerDashboard } from '@/features/channels/components/channel-manager-dashboard';
import { Building2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function ChannelsPage() {
  useActivePropertyQuery();
  const activeProperty = usePropertyStore((s) => s.activeProperty);
  const { t } = useTranslation();

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative">
      {/* COLUMN 1: Main Application Left Sidebar */}
      <DashboardSidebar />

      {/* Main Workspace Frame */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <AppHeader />

        {/* Workspace Body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950">
          {!activeProperty ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-4 min-w-0">
              <div className="p-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-amber-500 shadow-sm">
                <Building2 className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('noPropertySelected')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">{t('selectPropertyToManage')}</p>
            </div>
          ) : (
            <div className="w-full space-y-6 min-w-0">
              <ChannelManagerDashboard propertyId={activeProperty.id} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
