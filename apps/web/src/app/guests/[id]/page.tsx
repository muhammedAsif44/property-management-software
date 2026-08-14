'use client';

import React from 'react';
import { AppShell } from '@/components/app-shell';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { useGuestQuery } from '@/features/guests/api/use-guests';
import { useTranslation } from '@/lib/i18n';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Users } from 'lucide-react';
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
    <AppShell
      sectionIcon={Users}
      breadcrumb={{ parent: t('guestsAndCrm') || 'Guests & CRM', parentHref: '/guests' }}
      sectionTitle={guest?.fullName ? formatDisplayName(guest.fullName) : (t('guestDetails') || 'Guest Profile')}
      sectionDescription="Guest stay history and relationship details"
      sectionActions={
        <button
          onClick={() => router.push('/guests')}
          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border border-slate-200 dark:border-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t('backToGuests') || 'Back to Directory'}</span>
        </button>
      }
    >
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
    </AppShell>
  );
}
