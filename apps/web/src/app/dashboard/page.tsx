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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex relative overflow-hidden">
      {/* Ambient Light Emerald Gradients */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Modern Left Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex-1 pl-64 transition-all duration-300 relative z-10 flex flex-col min-h-screen">
        
        {/* Top Header Bar */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-30 px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              {loading ? (
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {activeProperty ? activeProperty.name : 'Orvyn PMS Portfolio'}
                  </h2>
                  <p className="text-xs font-semibold text-slate-500">
                    {activeProperty?.city ? `${activeProperty.city}, ${activeProperty.country || 'IN'}` : 'Active Management Hub'}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/onboarding/property"
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Property
            </Link>
            <Link
              href="/settings/property"
              className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 text-xs font-bold shadow-xs"
              title="Property Settings"
            >
              <Settings className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </div>
        </header>

        {/* Dashboard Workspace */}
        <main className="p-8 space-y-8 max-w-7xl mx-auto w-full flex-1">
          
          {/* Error Banner with Retry */}
          {error && (
            <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200/90 text-rose-800 flex items-center justify-between gap-4 shadow-sm animate-fade-in">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <p className="text-xs font-bold">{error}</p>
              </div>
              <button
                onClick={fetchPropertyData}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-2 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {/* Flagship Gradient Hero Banner */}
          {loading ? (
            <Skeleton className="h-44 w-full rounded-3xl" />
          ) : (
            <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-bold uppercase tracking-wider border border-white/10">
                  <Sparkles className="w-3.5 h-3.5" /> Property Command Center
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  {activeProperty ? activeProperty.name : 'Welcome to Orvyn PMS'}
                </h1>
                <p className="text-sm text-emerald-100/90 font-medium leading-relaxed">
                  {activeProperty?.settings?.checkInTime
                    ? `Check-in starts at ${activeProperty.settings.checkInTime} • Check-out at ${activeProperty.settings.checkOutTime || '11:00 AM'}`
                    : 'Manage room inventory, guest check-ins, automated billing, and live performance metrics from your workspace.'}
                </p>
              </div>

              <Link
                href="/settings/property"
                className="px-6 py-3.5 rounded-2xl bg-white text-emerald-800 text-xs font-extrabold hover:bg-emerald-50 transition-all shadow-md z-10 shrink-0 flex items-center gap-2 group"
              >
                Configure Property <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
            </div>
          )}

          {/* Shimmer / Live Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              <>
                <Skeleton className="h-36 rounded-3xl" />
                <Skeleton className="h-36 rounded-3xl" />
                <Skeleton className="h-36 rounded-3xl" />
                <Skeleton className="h-36 rounded-3xl" />
              </>
            ) : (
              <>
                {/* Card 1: Total Rooms */}
                <div className="p-6 bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Rooms</span>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BedDouble className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-900">
                    {activeProperty?.roomTypes?.reduce((acc, rt) => acc + Number(rt.totalUnits), 0) || 0}
                  </div>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Configured room inventory
                  </p>
                </div>

                {/* Card 2: Occupancy */}
                <div className="p-6 bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Occupancy Rate</span>
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-900">84%</div>
                  <p className="text-xs text-emerald-600 font-extrabold flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +12% from last week
                  </p>
                </div>

                {/* Card 3: Revenue */}
                <div className="p-6 bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Monthly Revenue</span>
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-900">₹2,45,000</div>
                  <p className="text-xs text-slate-500 font-medium">Direct & OTA bookings</p>
                </div>

                {/* Card 4: Check-ins */}
                <div className="p-6 bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Check-ins Today</span>
                    <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-900">8 Guests</div>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-500" /> Next check-in at 14:00
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Property Details Card */}
          {loading ? (
            <Skeleton className="h-56 w-full rounded-3xl" />
          ) : (
            <div className="p-8 bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Property Configuration & Terms</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    Active policy settings and configured room categories for this property.
                  </p>
                </div>
                <Link
                  href="/settings/property"
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Edit Setup
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Check-in / Check-out</span>
                  <p className="text-sm font-extrabold text-slate-900">
                    {activeProperty?.settings?.checkInTime || '12:00 PM'} / {activeProperty?.settings?.checkOutTime || '11:00 AM'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Room Categories</span>
                  <p className="text-sm font-extrabold text-slate-900">
                    {activeProperty?.roomTypes?.length || 0} Room Types Configured
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Amenities Provided</span>
                  <p className="text-sm font-extrabold text-slate-900">
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
