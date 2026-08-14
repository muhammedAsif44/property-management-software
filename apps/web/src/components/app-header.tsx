'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/features/auth';
import { usePropertyStore } from '@/features/properties';
import { useTranslation, LanguageSwitcher } from '@/lib/i18n';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationInbox } from '@/features/notifications/components/notification-inbox';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from '@/lib/theme/theme-context';
import { SplitFlapText } from '@/components/ui/split-flap-text';

export const AppHeader: React.FC = () => {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
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

  const propertyName = activeProperty?.name
    ? activeProperty.name.toUpperCase().slice(0, 12)
    : 'AZURA RESORT';

  const headerWords = useMemo(() => {
    return [propertyName, 'SYSTEM SYNCED', '2WAY ARI LIVE', 'ALL ROOMS OK'];
  }, [propertyName]);

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
        {/* Live Socket Realtime SplitFlap Signal Indicator */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50/80 dark:bg-emerald-950/80 border border-emerald-200/90 dark:border-emerald-800/80 shadow-2xs overflow-hidden"
          title={`Multi-device live real-time synchronization active for ${activeProperty?.name || 'Property'}`}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="flex items-center overflow-hidden">
            <SplitFlapText
              words={headerWords}
              flipDuration={0.12}
              stagger={0.05}
              cycleDelay={3200}
              tileColor={isDark ? '#09100d' : '#f1f5f9'}
              textColor={isDark ? '#10b981' : '#047857'}
              tileRadius={5}
              gap={3}
              fontSize={13}
              showSplitLine={false}
              loop
            />
          </div>
        </div>

        {/* Dark / Light Mode Theme Toggle */}
        <ThemeToggle />

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
