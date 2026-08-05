'use client';

import React from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { AppHeader } from '@/components/app-header';
import { useAuthStore } from '@/features/auth/store/use-auth-store';
import { useTranslation } from '@/lib/i18n';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { AdminNotificationComposer } from '@/features/notifications/components/admin-notification-composer';

export default function SuperAdminPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative">
        <DashboardSidebar />
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          <AppHeader>
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">Access Denied</h1>
          </AppHeader>
          <div className="p-6 flex flex-col items-center justify-center flex-1">
            <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-slate-500">Only Super Admins can access this area.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative">
      <DashboardSidebar />
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <AppHeader>
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                Super Admin Panel
              </h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                Global Administration & Announcements
              </p>
            </div>
          </div>
        </AppHeader>

        <div className="p-6 max-w-[1400px] w-full mx-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-6">
              <AdminNotificationComposer />
            </div>
            
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-semibold text-lg">System Actions</h3>
                  <p className="text-sm text-slate-500">Global administrative actions for the entire platform.</p>
                </div>
                <div className="p-6 space-y-4 text-sm text-slate-500">
                  <p>In-app announcements and updates sent from the Admin Panel, plus the plumbing for push notifications.</p>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    Push notification plumbing is ready via the `/v1/notifications/device-tokens` endpoint.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
