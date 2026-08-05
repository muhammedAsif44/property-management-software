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
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-extrabold uppercase tracking-wider">Occupancy</span>
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
            {occupancyRate}%
          </span>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            {bookedUnits}/{totalUnits} Sold
          </span>
        </div>
      </div>

      {/* 2. Available Rooms */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-extrabold uppercase tracking-wider">Vacant</span>
          <BedDouble className="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 leading-none">
            {availableUnits}
          </span>
          <span className="text-[10px] font-bold text-slate-400">Ready</span>
        </div>
      </div>

      {/* 3. Arrivals (Check-ins) */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-extrabold uppercase tracking-wider">Arrivals</span>
          <ArrowDownLeft className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-lg font-black text-blue-600 dark:text-blue-400 leading-none">
            5
          </span>
          <span className="text-[10px] font-bold text-blue-500">2 In-House</span>
        </div>
      </div>

      {/* 4. Departures (Check-outs) */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-extrabold uppercase tracking-wider">Departures</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-lg font-black text-amber-600 dark:text-amber-400 leading-none">
            3
          </span>
          <span className="text-[10px] font-bold text-amber-500">1 Pending</span>
        </div>
      </div>

      {/* 5. Housekeeping Pending */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-extrabold uppercase tracking-wider">Dirty Rooms</span>
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-lg font-black text-purple-600 dark:text-purple-400 leading-none">
            4
          </span>
          <span className="text-[10px] font-bold text-purple-500">Cleaning</span>
        </div>
      </div>

      {/* 6. Maintenance */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-extrabold uppercase tracking-wider">Out of Order</span>
          <Wrench className="w-3.5 h-3.5 text-rose-500" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-lg font-black text-slate-700 dark:text-slate-300 leading-none">
            1
          </span>
          <span className="text-[10px] font-bold text-slate-400">Blocked</span>
        </div>
      </div>

      {/* 7. Today Revenue */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between hidden lg:flex">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-extrabold uppercase tracking-wider">Est. Revenue</span>
          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 leading-none">
            ₹45,200
          </span>
          <span className="text-[10px] font-bold text-emerald-600">+12%</span>
        </div>
      </div>
    </div>
  );
}
