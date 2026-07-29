'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePropertyStore, propertyService } from '@/features/properties';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BedDouble,
  TrendingUp,
  DollarSign,
  UserCheck,
  Building2,
  Sparkles,
  Settings,
  ChevronRight,
  Clock,
  ArrowUpRight,
  Plus,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const activeProperty = usePropertyStore((state) => state.activeProperty);
  const setActiveProperty = usePropertyStore((state) => state.setActiveProperty);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPropertyData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await propertyService.getActiveProperty();
      if (res?.activeProperty) {
        setActiveProperty(res.activeProperty);
      }
    } catch (err: any) {
      if (err?.statusCode === 401) {
        router.push('/login');
      } else {
        setError(err?.message || 'Unable to load property details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [router, setActiveProperty]);

  useEffect(() => {
    fetchPropertyData();
  }, [fetchPropertyData]);

  return (
    <div className="min-h-screen bg-slate-50/90 text-slate-900 font-sans antialiased flex relative overflow-hidden">
      {/* Ambient Rich Emerald Glow Elements */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Modern Left Sidebar */}
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
              {loading ? (
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">
                    {activeProperty ? activeProperty.name : 'Orvyn PMS Portfolio'}
                  </h2>
                  <p className="text-[11px] font-bold text-emerald-700/80 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {activeProperty?.city ? `${activeProperty.city}, ${activeProperty.country || 'IN'}` : 'Active Management Hub'}
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
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/90 text-rose-800 flex items-center justify-between gap-4 shadow-sm animate-fade-in">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                <p className="text-xs font-bold">{error}</p>
              </div>
              <button
                onClick={fetchPropertyData}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          {/* Flagship Gradient Hero Banner */}
          {loading ? (
            <Skeleton className="h-32 w-full rounded-2xl" />
          ) : (
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 text-white shadow-lg shadow-emerald-950/15 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-700/40">
              <div className="space-y-2 z-10 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-[11px] font-bold uppercase tracking-wider border border-white/10">
                  <Sparkles className="w-3 h-3 text-emerald-300" /> Property Command Center
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  {activeProperty ? activeProperty.name : 'Welcome to Orvyn PMS'}
                </h1>
                <p className="text-xs text-emerald-100/90 font-medium leading-relaxed">
                  {activeProperty?.settings?.checkInTime
                    ? `Check-in starts at ${activeProperty.settings.checkInTime} • Check-out at ${activeProperty.settings.checkOutTime || '11:00 AM'}`
                    : 'Manage room inventory, guest check-ins, automated billing, and live performance metrics from your workspace.'}
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

          {/* Shimmer / Live Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
              </>
            ) : (
              <>
                {/* Card 1: Total Rooms */}
                <div className="p-5 bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all space-y-2.5 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Total Rooms</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-700 border border-emerald-200/80 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <BedDouble className="w-4 h-4 text-emerald-700" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-950">
                    {activeProperty?.roomTypes?.reduce((acc, rt) => acc + Number(rt.totalUnits), 0) || 0}
                  </div>
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Configured room inventory
                  </p>
                </div>

                {/* Card 2: Occupancy */}
                <div className="p-5 bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all space-y-2.5 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Occupancy Rate</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-200/80 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-950">84%</div>
                  <p className="text-[11px] text-emerald-600 font-extrabold flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" /> +12% from last week
                  </p>
                </div>

                {/* Card 3: Revenue */}
                <div className="p-5 bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all space-y-2.5 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Monthly Revenue</span>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-200/80 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <DollarSign className="w-4 h-4 text-amber-600" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-950">₹2,45,000</div>
                  <p className="text-[11px] text-emerald-700 font-semibold">Direct & OTA bookings</p>
                </div>

                {/* Card 4: Check-ins */}
                <div className="p-5 bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all space-y-2.5 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Check-ins Today</span>
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-200/80 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <UserCheck className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-950">8 Guests</div>
                  <p className="text-[11px] text-purple-600 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-purple-500" /> Next check-in at 14:00
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Property Details Card */}
          {loading ? (
            <Skeleton className="h-44 w-full rounded-2xl" />
          ) : (
            <div className="p-6 bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Property Configuration & Terms</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Active policy settings and configured room categories for this property.
                  </p>
                </div>
                <Link
                  href="/settings/property"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all border border-emerald-200/80"
                >
                  Edit Setup
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1 hover:border-emerald-200 transition-all">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Check-in / Check-out</span>
                  <p className="text-xs sm:text-sm font-black text-slate-900">
                    {activeProperty?.settings?.checkInTime || '12:00 PM'} / {activeProperty?.settings?.checkOutTime || '11:00 AM'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1 hover:border-emerald-200 transition-all">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Room Categories</span>
                  <p className="text-xs sm:text-sm font-black text-slate-900">
                    {activeProperty?.roomTypes?.length || 0} Room Types Configured
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1 hover:border-emerald-200 transition-all">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Amenities Provided</span>
                  <p className="text-xs sm:text-sm font-black text-slate-900">
                    {activeProperty?.amenities?.length || 0} Amenities Active
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
