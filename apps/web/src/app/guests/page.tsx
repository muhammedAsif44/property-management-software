'use client';

import React from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { useTranslation } from '@/lib/i18n';
import { Users, Sparkles } from 'lucide-react';

export default function GuestsPage() {
  const { t } = useTranslation();
  useActivePropertyQuery();
  const activeProperty = usePropertyStore((s) => s.activeProperty);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                {t('guests')}
              </h1>
              <p className="text-sm text-gray-500">{activeProperty?.name}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {t('comingSoon')}
            </span>
          </div>
        </div>

        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-12 max-w-md text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{t('guests')} — Phase 5</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Comprehensive Guest CRM, lifetime stay analytics, VIP tagging, blacklisting, and document vault are coming in Phase 5.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
