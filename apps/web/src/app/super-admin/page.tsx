'use client';

import React from 'react';
import { AppShell } from '@/components/app-shell';
import { useAuthStore } from '@/features/auth/store/use-auth-store';
import { useTranslation } from '@/lib/i18n';
import { ShieldAlert, AlertTriangle, Bell, Activity, Radio, Server } from 'lucide-react';
import { AdminNotificationComposer } from '@/features/notifications/components/admin-notification-composer';

export default function SuperAdminPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  if (!isSuperAdmin) {
    return (
      <AppShell
        sectionIcon={ShieldAlert}
        sectionTitle="Access Denied"
        sectionDescription="Super Admin Privileges Required"
      >
        <div className="p-12 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Access Denied</h2>
          <p className="text-slate-500 text-xs">Only Super Admins can access this global administration panel.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      sectionIcon={ShieldAlert}
      sectionTitle={t('sectionSuperAdmin') || 'Super Admin Panel'}
      sectionDescription={t('sectionSuperAdminDesc') || 'Global Administration & Broadcast Announcements'}
      sectionTabs={[
        { label: 'Broadcast Announcements', icon: Bell, href: '/super-admin' },
      ]}
      layout="wide"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div>
          <AdminNotificationComposer />
        </div>
        
        <div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-600" />
                  System Telemetry & Actions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Global administrative actions and platform status.</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ACTIVE
              </span>
            </div>

            <div className="p-4 space-y-3.5 text-xs text-slate-500 dark:text-slate-400">
              <p className="font-medium">In-app broadcasts and system updates are dispatched directly to active hotel property nodes and connected staff devices.</p>
              
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700 space-y-1.5 font-medium">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                  <Radio className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Real-Time Broadcast Engine</span>
                </div>
                <p className="text-[11px] text-slate-400">Push notification pipeline connected via WebSocket and FCM device token endpoints.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
