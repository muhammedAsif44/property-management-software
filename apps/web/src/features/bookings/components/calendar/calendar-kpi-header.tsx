'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import {
  TrendingUp,
  BedDouble,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Wrench,
  DollarSign,
} from 'lucide-react';

interface CalendarKpiHeaderProps {
  totalUnits?: number;
  bookedUnits?: number;
  availableUnits?: number;
  occupancyRate?: number;
}

export function CalendarKpiHeader({
  totalUnits = 40,
  bookedUnits = 12,
  availableUnits = 28,
  occupancyRate = 30,
}: CalendarKpiHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
      {/* 1. Today's Occupancy */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group min-w-0">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-1 min-w-0">
          <span className="text-[11px] font-black uppercase tracking-wider truncate">
            {t('kpiOccupancy')}
          </span>
          <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-1 min-w-0">
          <span className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight truncate">
            {occupancyRate}%
          </span>
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md truncate">
            {bookedUnits}/{totalUnits} {t('kpiSold')}
          </span>
        </div>
      </div>

      {/* 2. Available Rooms */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group min-w-0">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-1 min-w-0">
          <span className="text-[11px] font-black uppercase tracking-wider truncate">
            {t('kpiVacant')}
          </span>
          <div className="p-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
            <BedDouble className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-1 min-w-0">
          <span className="text-xl font-black text-teal-700 dark:text-teal-400 leading-none tracking-tight truncate">
            {availableUnits}
          </span>
          <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded-md truncate">
            {t('kpiReady')}
          </span>
        </div>
      </div>

      {/* 3. Arrivals (Check-ins) */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group min-w-0">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-1 min-w-0">
          <span className="text-[11px] font-black uppercase tracking-wider truncate">
            {t('kpiArrivals')}
          </span>
          <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <ArrowDownLeft className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-1 min-w-0">
          <span className="text-xl font-black text-blue-600 dark:text-blue-400 leading-none tracking-tight truncate">
            5
          </span>
          <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-md truncate">
            2 {t('kpiInHouse')}
          </span>
        </div>
      </div>

      {/* 4. Departures (Check-outs) */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group min-w-0">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-1 min-w-0">
          <span className="text-[11px] font-black uppercase tracking-wider truncate">
            {t('kpiDepartures')}
          </span>
          <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-1 min-w-0">
          <span className="text-xl font-black text-amber-600 dark:text-amber-400 leading-none tracking-tight truncate">
            3
          </span>
          <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md truncate">
            1 {t('kpiPending')}
          </span>
        </div>
      </div>

      {/* 5. Housekeeping Pending */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group min-w-0">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-1 min-w-0">
          <span className="text-[11px] font-black uppercase tracking-wider truncate">
            {t('kpiDirtyRooms')}
          </span>
          <div className="p-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-1 min-w-0">
          <span className="text-xl font-black text-purple-600 dark:text-purple-400 leading-none tracking-tight truncate">
            4
          </span>
          <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded-md truncate">
            {t('kpiCleaning')}
          </span>
        </div>
      </div>

      {/* 6. Maintenance */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group min-w-0">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-1 min-w-0">
          <span className="text-[11px] font-black uppercase tracking-wider truncate">
            {t('kpiOutOfOrder')}
          </span>
          <div className="p-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
            <Wrench className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-1 min-w-0">
          <span className="text-xl font-black text-slate-700 dark:text-slate-300 leading-none tracking-tight truncate">
            1
          </span>
          <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-md truncate">
            {t('kpiBlocked')}
          </span>
        </div>
      </div>

      {/* 7. Today Revenue */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group hidden lg:flex min-w-0">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-1 min-w-0">
          <span className="text-[11px] font-black uppercase tracking-wider truncate">
            {t('kpiEstRevenue')}
          </span>
          <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-1 min-w-0">
          <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 leading-none tracking-tight truncate">
            ₹45,200
          </span>
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md truncate">
            +12%
          </span>
        </div>
      </div>
    </div>
  );
}
