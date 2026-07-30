import React from 'react';
import { DashboardMetrics } from '../types/dashboard.types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BedDouble,
  TrendingUp,
  DollarSign,
  UserCheck,
  Calendar,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

interface RevenueSummaryCardsProps {
  metrics?: DashboardMetrics;
  currency?: string;
  loading?: boolean;
}

export function RevenueSummaryCards({
  metrics,
  currency = '₹',
  loading = false,
}: RevenueSummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  const formattedTodayRev = metrics
    ? `${currency}${metrics.todayRevenue.toLocaleString('en-IN')}`
    : `${currency}0`;

  const formattedMonthlyRev = metrics
    ? `${currency}${metrics.monthlyRevenue.toLocaleString('en-IN')}`
    : `${currency}0`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Today's Revenue */}
      <div className="p-5 bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all space-y-2.5 group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
            Today's Revenue
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-800 border border-emerald-200/80 flex items-center justify-center group-hover:scale-105 transition-transform">
            <DollarSign className="w-4 h-4 text-emerald-700" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-emerald-950">
          {formattedTodayRev}
        </div>
        <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live payments collected
        </p>
      </div>

      {/* Card 2: Monthly Revenue */}
      <div className="p-5 bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all space-y-2.5 group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
            Monthly Revenue
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-200/80 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-emerald-950">
          {formattedMonthlyRev}
        </div>
        <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3 text-emerald-600" /> Calendar Month Total
        </p>
      </div>

      {/* Card 3: Check-ins & Check-outs */}
      <div className="p-5 bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all space-y-2.5 group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
            Today's Movement
          </span>
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-200/80 flex items-center justify-center group-hover:scale-105 transition-transform">
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-emerald-950 flex items-baseline gap-2">
          <span>{metrics?.todayCheckIns || 0}</span>
          <span className="text-xs font-bold text-slate-400">Ins</span>
          <span className="text-slate-300">/</span>
          <span>{metrics?.todayCheckOuts || 0}</span>
          <span className="text-xs font-bold text-slate-400">Outs</span>
        </div>
        <p className="text-[11px] text-purple-600 font-bold flex items-center gap-1">
          <Clock className="w-3 h-3 text-purple-500" /> Scheduled for today
        </p>
      </div>

      {/* Card 4: Occupancy & Room Status */}
      <div className="p-5 bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all space-y-2.5 group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
            Occupancy Rate
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-200/80 flex items-center justify-center group-hover:scale-105 transition-transform">
            <BedDouble className="w-4 h-4 text-blue-600" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-emerald-950 flex items-baseline gap-2">
          <span>{metrics?.occupancyRate || 0}%</span>
          <span className="text-xs font-semibold text-slate-500">
            ({metrics?.occupiedRooms || 0}/{metrics?.totalRooms || 0} rooms)
          </span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${metrics?.occupancyRate || 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
