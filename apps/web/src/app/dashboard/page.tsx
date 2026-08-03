'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { usePropertyStore, useActivePropertyQuery, useMyPropertiesQuery } from '@/features/properties';
import { authService } from '@/features/auth';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
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

import { useTranslation, LanguageSwitcher } from '@/lib/i18n';

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

  // Auto-redirect housekeepers to dedicated housekeeping portal
  useEffect(() => {
    if (userRole === 'HOUSEKEEPING') {
      router.replace('/housekeeping');
    }
  }, [userRole, router]);

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

  const handleAutoCheckout = () => {
    autoCheckoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-slate-50/90 text-slate-900 font-sans antialiased flex relative overflow-hidden">
      {/* Ambient Rich Emerald Glow Elements */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Left Navigation Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 transition-all duration-300 relative z-10 flex flex-col min-h-screen">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-emerald-200/80 sticky top-0 z-30 px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100/80 border border-emerald-200 text-emerald-800 shadow-xs">
              <Building2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              {!activeProperty ? (
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                    {activeProperty.name}
                    {isOwner && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase">
                        Owner
                      </span>
                    )}
                    {isManager && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase">
                        Manager
                      </span>
                    )}
                    {isReception && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-black uppercase">
                        Reception
                      </span>
                    )}
                    {isViewer && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-black uppercase">
                        Viewer
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] font-bold text-emerald-700/80 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {activeProperty.city ? `${activeProperty.city}, ${activeProperty.country || 'IN'}` : 'Active Management Hub'}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Language Switcher Pill (English ↔ Malayalam) */}
            <LanguageSwitcher />

            {/* Primary Add Property Action: Reserved strictly for Property Owner */}
            {isOwner && (
              <Link
                href="/onboarding/property"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 active:scale-95 text-white text-xs font-black transition-all duration-200 shadow-md shadow-emerald-700/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-200" />
                <span>{t('addProperty')}</span>
              </Link>
            )}

            {/* User Profile & Role Chip (Navigates to Settings) */}
            <Link
              href="/settings"
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 shadow-2xs transition-all cursor-pointer group"
              title="Account & Property Settings"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-900 text-white flex items-center justify-center font-black text-xs shadow-xs uppercase shrink-0 ring-2 ring-emerald-500/20 group-hover:scale-105 transition-transform">
                {profileData?.user?.name ? profileData.user.name.charAt(0) : profileData?.user?.email?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-black text-slate-900 leading-none capitalize group-hover:text-emerald-800 transition-colors">
                  {profileData?.user?.name || profileData?.user?.email?.split('@')[0] || 'Manager'}
                </span>
                <span className="text-[10px] font-bold text-slate-500 mt-0.5 leading-none">
                  {isOwner && t('propertyOwner')}
                  {isManager && t('operationsManager')}
                  {isReception && t('receptionStaff')}
                  {isViewer && t('propertyViewer')}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Dashboard Workspace */}
        <main className="p-6 space-y-6 w-full flex-1">
          
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

          {/* Role-Specific Gradient Hero Banner */}
          {analyticsLoading ? (
            <Skeleton className="h-32 w-full rounded-2xl" />
          ) : (
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 text-white shadow-lg shadow-emerald-950/15 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-700/40">
              <div className="space-y-2 z-10 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-[11px] font-bold uppercase tracking-wider border border-white/10">
                  {isOwner && <Crown className="w-3 h-3 text-amber-300" />}
                  {isManager && <ShieldCheck className="w-3 h-3 text-emerald-300" />}
                  {isReception && <UserCheck className="w-3 h-3 text-blue-300" />}
                  {isViewer && <Eye className="w-3 h-3 text-slate-300" />}

                  <span>
                    {isOwner && t('ownerCommandCenterBanner')}
                    {isManager && t('operationsManagerBanner')}
                    {isReception && t('receptionPortalBanner')}
                    {isViewer && t('viewerObserverBanner')}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  {activeProperty ? activeProperty.name : 'Welcome to Orvyn PMS'}
                </h1>

                <p className="text-xs text-emerald-100/90 font-medium leading-relaxed">
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
                  className="px-4 py-2 rounded-xl bg-white text-emerald-900 text-xs font-extrabold hover:bg-emerald-50 transition-all shadow-sm z-10 shrink-0 flex items-center gap-1.5 group"
                >
                  <span>Properties Portfolio</span>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}

              {isManager && (
                <Link
                  href="/settings/staff"
                  className="px-4 py-2 rounded-xl bg-white text-emerald-900 text-xs font-extrabold hover:bg-emerald-50 transition-all shadow-sm z-10 shrink-0 flex items-center gap-1.5 group"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Staff Directory</span>
                </Link>
              )}

              <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
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

          {/* Quick Actions Strip (Hide auto-checkout for Viewers) */}
          {!isViewer && (
            <QuickActionsStrip
              onTriggerAutoCheckout={handleAutoCheckout}
              isAutoCheckoutSyncing={autoCheckoutMutation.isPending}
            />
          )}

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
