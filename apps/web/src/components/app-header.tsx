'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/features/auth';
import { usePropertyStore } from '@/features/properties';
import { useTranslation, LanguageSwitcher } from '@/lib/i18n';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationInbox } from '@/features/notifications/components/notification-inbox';

export const AppHeader: React.FC = () => {
  const { t } = useTranslation();
  const activeProperty = usePropertyStore((state) => state.activeProperty);

  const { data: profileData } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => authService.getProfile(),
    staleTime: 60000,
    retry: false,
  });

  const user = profileData?.user || profileData?.data?.user || profileData;

  const getDisplayName = () => {
    return user?.name || user?.owner?.fullName || user?.fullName || user?.email?.split('@')[0] || 'User';
  };

  const getInitial = () => {
    const name = user?.name || user?.email;
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <header className="h-14 bg-white/95 dark:bg-[#09100d]/95 backdrop-blur-xl border-b border-divider sticky top-0 z-30 px-4 lg:px-6 flex items-center justify-between gap-4 shrink-0 transition-colors duration-150">
      {/* Left: Active Property Context */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {!activeProperty ? (
          <div className="space-y-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : (
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
              {activeProperty.name}
            </h2>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {activeProperty.city ? `${activeProperty.city}, ${activeProperty.country || 'IN'}` : t('activeManagementHub')}
            </p>
          </div>
        )}
      </div>

      {/* Right: Global actions cluster */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Live Socket Realtime Pulse Badge */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-400"
          title="Multi-device live real-time synchronization active"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{t('realtimeSyncActive')}</span>
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Notifications */}
        <NotificationInbox />

        <div className="w-px h-5 bg-divider mx-1" aria-hidden="true" />

        {/* User Avatar → Settings */}
        <Link
          href="/settings"
          className="interactive flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 border border-emerald-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-xs"
          title={`${t('settings')} — ${getDisplayName()}`}
          aria-label={`${t('settings')} — ${getDisplayName()}`}
        >
          <span className="font-extrabold text-xs">
            {getInitial()}
          </span>
        </Link>
      </div>
    </header>
  );
};
