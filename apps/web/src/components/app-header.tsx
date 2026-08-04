'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/features/auth';
import { usePropertyStore } from '@/features/properties';
import { useTranslation, LanguageSwitcher } from '@/lib/i18n';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell } from 'lucide-react';

interface AppHeaderProps {
  /** Left side content — typically page title or property info */
  children?: React.ReactNode;
  /** Additional right-side actions (e.g., Add Property button) */
  actions?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ children, actions }) => {
  const { t } = useTranslation();
  const activeProperty = usePropertyStore((state) => state.activeProperty);

  const { data: profileData } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => authService.getProfile(),
    staleTime: 60000,
    retry: false,
  });

  const user = profileData?.user || profileData?.data?.user || profileData;
  const userRole = user?.role || 'OWNER';
  const isOwner = userRole === 'OWNER' || userRole === 'SUPER_ADMIN';
  const isManager = userRole === 'MANAGER';
  const isReception = userRole === 'RECEPTION_STAFF';
  const isViewer = userRole === 'VIEWER';

  const getRoleLabel = () => {
    if (isOwner) return t('propertyOwner');
    if (isManager) return t('operationsManager');
    if (isReception) return t('receptionStaff');
    if (isViewer) return t('propertyViewer');
    return userRole;
  };

  const getDisplayName = () => {
    return user?.name || user?.owner?.fullName || user?.fullName || user?.email?.split('@')[0] || 'User';
  };

  const getInitial = () => {
    const name = user?.name || user?.email;
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <header className="h-14 bg-white/95 dark:bg-[#09100d]/95 backdrop-blur-xl border-b border-divider sticky top-0 z-30 px-4 lg:px-6 flex items-center justify-between gap-4 shrink-0 transition-colors duration-150">
      {/* Left: Page-specific content */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {children || (
          <>
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
          </>
        )}
      </div>

      {/* Right: Actions cluster */}
      <div className="flex items-center gap-2 shrink-0">
        {actions}

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Notifications placeholder */}
        <button
          className="interactive relative flex items-center justify-center w-9 h-9 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-divider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-divider mx-1" aria-hidden="true" />

        {/* User Profile Chip → Settings */}
        <Link
          href="/settings"
          className="interactive flex items-center gap-2 h-9 pl-1 pr-3 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-divider cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          title={`${t('settings')} — ${getDisplayName()}`}
        >
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {getInitial()}
          </div>
          <div className="hidden sm:flex flex-col items-start min-w-0">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[120px] capitalize">
              {getDisplayName()}
            </span>
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 leading-tight truncate">
              {getRoleLabel()}
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
};
