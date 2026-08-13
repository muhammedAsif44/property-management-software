import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/lib/i18n';
import {
  DollarSign,
  Calendar,
  BedDouble,
  TrendingUp,
  LogIn,
  LogOut,
  ShoppingBag,
} from 'lucide-react';
import { DashboardMetrics } from '../types/dashboard.types';

interface DashboardKpiGridProps {
  metrics?: DashboardMetrics;
  currency?: string;
  loading?: boolean;
  todayPaymentsCount?: number;
  monthlyPaymentsCount?: number;
  cancellationsCount?: number;
}

export function DashboardKpiGrid({
  metrics,
  currency = '₹',
  loading = false,
  todayPaymentsCount = 12,
  monthlyPaymentsCount = 268,
  cancellationsCount = 0,
}: DashboardKpiGridProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  const todayRev = metrics?.todayRevenue || 0;
  const monthlyRev = metrics?.monthlyRevenue || 0;
  const checkIns = metrics?.todayCheckIns || 0;
  const checkOuts = metrics?.todayCheckOuts || 0;
  const occupancyRate = metrics?.occupancyRate || (metrics?.totalRooms ? Math.round((metrics.occupiedRooms / metrics.totalRooms) * 100) : 0);
  const occupiedRooms = metrics?.occupiedRooms || 0;
  const totalRooms = metrics?.totalRooms || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* ─── 1. Today's Revenue ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('todayRevenue') || "Today's Revenue"}
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>

        <div>
          <p className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight leading-none">
            {currency}{todayRev.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-1">
            from {todayPaymentsCount} payments
          </p>
        </div>

        <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="w-3 h-3" />
          <span>↑ 12.5% vs yesterday</span>
        </div>
      </div>

      {/* ─── 2. Monthly Revenue ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('monthlyRevenue') || "Monthly Revenue"}
          </span>
          <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5" />
          </div>
        </div>

        <div>
          <p className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight leading-none">
            {currency}{monthlyRev.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-1">
            from {monthlyPaymentsCount} payments
          </p>
        </div>

        <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="w-3 h-3" />
          <span>↑ 18.6% vs last month</span>
        </div>
      </div>

      {/* ─── 3. Today's Bookings Movement ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Today's Bookings
          </span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-baseline gap-4">
          <div>
            <span className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight">
              {checkIns}
            </span>
            <span className="text-[11px] font-bold text-slate-400 ml-1.5">Check-ins</span>
          </div>
          <div className="text-slate-300 dark:text-slate-700 font-light">|</div>
          <div>
            <span className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight">
              {checkOuts}
            </span>
            <span className="text-[11px] font-bold text-slate-400 ml-1.5">Check-outs</span>
          </div>
        </div>

        <p className="text-[11px] font-medium text-slate-400 pt-1">
          {cancellationsCount} Cancellations today
        </p>
      </div>

      {/* ─── 4. Occupancy Rate ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Occupancy Rate
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center">
            <BedDouble className="w-3.5 h-3.5" />
          </div>
        </div>

        <div>
          <p className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight leading-none">
            {occupancyRate}%
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-1">
            {occupiedRooms} / {totalRooms} Rooms
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#0B6E4F] dark:bg-emerald-500 h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(occupancyRate, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
