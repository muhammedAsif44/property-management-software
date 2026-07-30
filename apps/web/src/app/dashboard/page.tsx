'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
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
  Sparkles,
  Settings,
  ChevronRight,
  Plus,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  
  // Query active property on load
  const { isError: propError, error: propQueryError } = useActivePropertyQuery();
  const activeProperty = usePropertyStore((state) => state.activeProperty);

  // TanStack Query live analytics refetch
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    isError: analyticsError,
    error: queryError,
    refetch,
  } = useDashboardAnalyticsQuery(activeProperty?.id);

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

  const currencySymbol = activeProperty?.currency === 'USD' ? '$' : '₹';

  return (
    <div className="min-h-screen bg-slate-50/90 text-slate-900 font-sans antialiased flex relative overflow-hidden">
      {/* Ambient Rich Emerald Glow Elements */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Left Navigation Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex-1 pl-60 transition-all duration-300 relative z-10 flex flex-col min-h-screen">
        
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
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">
                    {activeProperty.name}
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
            <Link
              href="/onboarding/property"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Property
            </Link>
            <Link
              href="/settings/property"
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-900 transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs"
              title="Property Settings"
            >
              <Settings className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </div>
        </header>

        {/* Dashboard Workspace */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1">
          
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

          {/* Gradient Hero Banner */}
          {analyticsLoading ? (
            <Skeleton className="h-32 w-full rounded-2xl" />
          ) : (
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 text-white shadow-lg shadow-emerald-950/15 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-700/40">
              <div className="space-y-2 z-10 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-[11px] font-bold uppercase tracking-wider border border-white/10">
                  <Sparkles className="w-3 h-3 text-emerald-300" /> Live Property Command Center
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  {activeProperty ? activeProperty.name : 'Welcome to Orvyn PMS'}
                </h1>
                <p className="text-xs text-emerald-100/90 font-medium leading-relaxed">
                  {activeProperty?.settings?.checkInTime
                    ? `Check-in starts at ${activeProperty.settings.checkInTime} • Check-out at ${activeProperty.settings.checkOutTime || '11:00 AM'}`
                    : 'Real-time revenue aggregations, guest check-in feeds, and travel agency commission tracking.'}
                </p>
              </div>

              <Link
                href="/settings/property"
                className="px-4 py-2 rounded-xl bg-white text-emerald-900 text-xs font-extrabold hover:bg-emerald-50 transition-all shadow-sm z-10 shrink-0 flex items-center gap-1.5 group"
              >
                Configure Property <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            </div>
          )}

          {/* Operational Quick Actions Strip */}
          <QuickActionsStrip
            onTriggerAutoCheckout={handleAutoCheckout}
            isAutoCheckoutSyncing={autoCheckoutMutation.isPending}
          />

          {/* Revenue & Occupancy Summary Cards */}
          <RevenueSummaryCards
            metrics={analyticsData?.metrics}
            currency={currencySymbol}
            loading={analyticsLoading}
          />

          {/* Grid Layout: Recent Bookings Feed & Pending TAC Settlements */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentBookingsFeed
                bookings={analyticsData?.recentBookings}
                currency={currencySymbol}
                loading={analyticsLoading}
              />
            </div>
            <div>
              <PendingTacWidget
                agencies={analyticsData?.pendingTac?.agencies}
                currency={currencySymbol}
                loading={analyticsLoading}
              />
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
