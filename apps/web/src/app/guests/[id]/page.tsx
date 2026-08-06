'use client';

import React from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { AppHeader } from '@/components/app-header';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { useGuestQuery } from '@/features/guests/api/use-guests';
import { useTranslation } from '@/lib/i18n';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GuestProfileCard } from '@/features/guests/components/guest-profile-card';
import { StayHistoryTimeline } from '@/features/guests/components/stay-history-timeline';

import { formatDisplayName } from '@/lib/utils';

export default function GuestDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const guestId = params.id as string;
  
  useActivePropertyQuery();
  const activeProperty = usePropertyStore((s) => s.activeProperty);
  
  const { data: rawGuest, isLoading } = useGuestQuery(activeProperty?.id || null, guestId);
  const guest = (rawGuest as any)?.data?.id ? (rawGuest as any).data : rawGuest;

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative bg-slate-50/50 dark:bg-slate-950">
      <DashboardSidebar />
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <AppHeader>
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => router.push('/guests')} className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {guest?.fullName ? formatDisplayName(guest.fullName) : t('guestDetails')}
              </h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {activeProperty?.name || t('activeManagementHub')}
              </p>
            </div>
          </div>
        </AppHeader>

        <main className="p-4 sm:p-6 space-y-6 w-full flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : !guest ? (
            <div className="text-center py-20 text-slate-500">
              {t('guestNotFound') || 'Guest not found'}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <GuestProfileCard guest={guest} />
              </div>
              <div className="lg:col-span-2 space-y-6">
                <StayHistoryTimeline guest={guest} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
