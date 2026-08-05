'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { usePropertyStore, useActivePropertyQuery, useMyPropertiesQuery } from '@/features/properties';
import { authService } from '@/features/auth';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { AppHeader } from '@/components/app-header';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDashboardAnalyticsQuery,
  useAutoCheckoutMutation,
  RevenueSummaryCards,
  QuickActionsStrip,
  RecentBookingsFeed,
  PendingTacWidget,
} from '@/features/dashboard';
import {
  Building2,
  Zap,
  Settings,
  ChevronRight,
  Plus,
  RefreshCw,
  AlertTriangle,
  Crown,
  ShieldCheck,
  UserCheck,
  Eye,
  Users,
} from 'lucide-react';

import { useTranslation } from '@/lib/i18n';

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  
  // Query active & my properties on load
  const { isError: propError, error: propQueryError } = useActivePropertyQuery();
  useMyPropertiesQuery();
  const activeProperty = usePropertyStore((state) => state.activeProperty);

  // TanStack Query profile to resolve user role
  const { data: profileData } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => authService.getProfile(),
    staleTime: 60000,
    retry: false,
  });

  const userRole = profileData?.user?.role || 'OWNER';
  const isOwner = userRole === 'OWNER' || userRole === 'SUPER_ADMIN';
  const isManager = userRole === 'MANAGER';
  const isReception = userRole === 'RECEPTION_STAFF';
  const isViewer = userRole === 'VIEWER';
  const isHousekeeper = userRole === 'HOUSEKEEPING';
  const isManagerOrOwner = isOwner || isManager;

  // TanStack Query live analytics refetch
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    isError: analyticsError,
    error: queryError,
    refetch,
  } = useDashboardAnalyticsQuery(activeProperty?.id);

  // Instant fallback active property initialization if store was uninitialized
  useEffect(() => {
    if (analyticsData?.property && !activeProperty) {
      usePropertyStore.getState().setActiveProperty(analyticsData.property as any);
    }
  }, [analyticsData, activeProperty]);

  // Auto-checkout mutation
  const autoCheckoutMutation = useAutoCheckoutMutation(activeProperty?.id);

  // Redirect to login if user session is unauthenticated (401)
  useEffect(() => {
    const isUnauthError = (err: any) => err?.statusCode === 401 || err?.message?.toLowerCase().includes('unauthorized');

    if (isUnauthError(queryError) || isUnauthError(propQueryError)) {
      router.push('/login');
    }
  }, [queryError, propQueryError, router]);

  // Redirect Housekeeping staff directly to their dedicated task workspace
  useEffect(() => {
    if (isHousekeeper) {
      router.push('/housekeeping');
    }
  }, [isHousekeeper, router]);

  const handleAutoCheckout = () => {
    autoCheckoutMutation.mutate();
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative">
      {/* Left Navigation Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Unified Top Header */}
        <AppHeader
          actions={
            <div className="flex items-center gap-2">
              {/* Quick Actions moved to Header */}
              {(isOwner || isManager) && (
                <>
                  <button
                    onClick={handleAutoCheckout}
                    disabled={autoCheckoutMutation.isPending}
                    className="interactive px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-divider text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${autoCheckoutMutation.isPending ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">{autoCheckoutMutation.isPending ? t('syncing') : t('autoCheckoutExpiredStays')}</span>
                  </button>
                  <Link
                    href="/settings/staff"
                    className="interactive px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-divider text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">{t('staffDirectory')}</span>
                  </Link>
                </>
              )}
              {isOwner && (
                <Link
                  href="/onboarding/property"
                  className="interactive px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 ml-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('addProperty')}</span>
                </Link>
              )}
            </div>
          }
        />

        {/* Dashboard Workspace */}
        <main className="p-4 lg:p-6 space-y-6 w-full flex-1">
          
          {/* Error Banner with Retry */}
          {analyticsError && (queryError as any)?.statusCode !== 401 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/90 text-rose-800 flex items-center justify-between gap-4 shadow-sm animate-fade-in">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                <p className="text-xs font-bold">
                  {(queryError as any)?.message || 'Failed to load live analytics.'}
                </p>
              </div>
              <button
                onClick={() => refetch()}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          {/* Minimal Hero Banner with subtle warmth */}
          {analyticsLoading ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : (
            <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border-l-4 border-emerald-600 border border-divider flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] font-semibold uppercase tracking-wider border border-divider">
                  <span>
                    {isOwner && t('ownerCommandCenterBanner')}
                    {isManager && t('operationsManagerBanner')}
                    {isReception && t('receptionPortalBanner')}
                    {isViewer && t('viewerObserverBanner')}
                  </span>
                </div>

                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {activeProperty ? activeProperty.name : 'Welcome to Orvyn PMS'}
                </h1>

                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
                  {isOwner && 'Full Property Control — Settings, Permanent Staff Removal, Bookings, Invoices, Payments, Agencies & Reports.'}
                  {isManager && 'Full Operational Access — Bookings, Invoices, Agencies, TAC, Reports & Staff Management (Invite, Suspend, Reactivate).'}
                  {isReception && 'Front Desk Operations — Manage Bookings, Send Invoices, Agencies & TAC.'}
                  {isViewer && 'Read-Only Observer — View Bookings, Invoices, Calendar & Reports.'}
                </p>
              </div>

              {/* Action Link in Hero Banner */}
              {isOwner && (
                <Link
                  href="/properties"
                  className="interactive px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-divider text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-1.5 shrink-0"
                >
                  <span>Properties Portfolio</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              )}

              {isManager && (
                <Link
                  href="/settings/staff"
                  className="interactive px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-divider text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-1.5 shrink-0"
                >
                  <span>Team Management</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              )}
            </div>
          )}

          {/* Revenue Summary Cards (Visible to Owner, Manager, Super Admin) */}
          {!isReception && !isViewer && (
            <RevenueSummaryCards
              metrics={analyticsData?.metrics}
              loading={analyticsLoading}
              userRole={userRole}
            />
          )}

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Recent Bookings Feed */}
            <div className={!isReception && !isViewer ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <RecentBookingsFeed
                bookings={analyticsData?.recentBookings}
                loading={analyticsLoading}
              />
            </div>

            {/* Pending TAC Reminders (Visible to Owner & Manager) */}
            {!isReception && !isViewer && (
              <div>
                <PendingTacWidget
                  agencies={analyticsData?.pendingTac?.agencies}
                  loading={analyticsLoading}
                />
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
