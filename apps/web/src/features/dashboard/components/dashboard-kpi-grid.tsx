'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Sparkline } from '@/components/ui/sparkline';
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* ─── 1. Today's Revenue Spotlight Bento Card ─── */}
      <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.15)">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('todayRevenue') || "Today's Revenue"}
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2">
          <p className="text-2xl sm:text-[28px] font-black text-slate-900 dark:text-white tracking-tight leading-none">
            <AnimatedNumber value={todayRev} currency={currency} />
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-1">
            from {todayPaymentsCount} payments
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+12.5% vs yesterday</span>
          </div>
          <Sparkline changePercentage={12.5} width={50} height={16} />
        </div>
      </SpotlightCard>

      {/* ─── 2. Monthly Revenue Spotlight Bento Card ─── */}
      <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.15)">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('monthlyRevenue') || "Monthly Revenue"}
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2">
          <p className="text-2xl sm:text-[28px] font-black text-slate-900 dark:text-white tracking-tight leading-none">
            <AnimatedNumber value={monthlyRev} currency={currency} />
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-1">
            from {monthlyPaymentsCount} payments
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.6% vs last month</span>
          </div>
          <Sparkline changePercentage={18.6} width={50} height={16} />
        </div>
      </SpotlightCard>

      {/* ─── 3. Today's Bookings Spotlight Bento Card ─── */}
      <SpotlightCard spotlightColor="rgba(59, 130, 246, 0.15)">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Today's Movement
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-4 my-2">
          <div>
            <span className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight">
              <AnimatedNumber value={checkIns} />
            </span>
            <span className="text-[11px] font-bold text-slate-400 ml-1.5">Check-ins</span>
          </div>
          <div className="text-slate-300 dark:text-slate-700 font-light">|</div>
          <div>
            <span className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight">
              <AnimatedNumber value={checkOuts} />
            </span>
            <span className="text-[11px] font-bold text-slate-400 ml-1.5">Check-outs</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-medium text-slate-400">
          <span>{cancellationsCount} Cancellations today</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">Active Arrivals</span>
        </div>
      </SpotlightCard>

      {/* ─── 4. Occupancy Rate Spotlight Bento Card ─── */}
      <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.15)">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Occupancy Rate
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center shrink-0">
            <BedDouble className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2">
          <p className="text-2xl sm:text-[28px] font-black text-slate-900 dark:text-white tracking-tight leading-none">
            <AnimatedNumber value={occupancyRate} suffix="%" />
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-1">
            {occupiedRooms} / {totalRooms} Rooms Occupied
          </p>
        </div>

        {/* Progress Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-1">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#0B6E4F] dark:bg-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(occupancyRate, 100)}%` }}
            />
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
}
