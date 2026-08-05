'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { AlertTriangle, Search } from 'lucide-react';

interface CalendarMetricsBarProps {
  summaryStats: {
    totalRooms: number;
    bookedToday: number;
    availableToday: number;
    oooToday: number;
    occupancyPct: number;
    conflicts: number;
  } | null;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export function CalendarMetricsBar({
  summaryStats,
  searchTerm,
  setSearchTerm,
  searchInputRef,
}: CalendarMetricsBarProps) {
  const { t } = useTranslation();

  if (!summaryStats) return null;

  return (
    <div className="px-4 sm:px-6 py-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap z-10">
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-black tabular-data text-emerald-900 dark:text-emerald-200">
            {summaryStats.availableToday}
          </span>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            {t('vacantAvailable')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
          <div className="w-2 h-2 rounded-full bg-rose-600" />
          <span className="text-xs font-black tabular-data text-rose-900 dark:text-rose-200">
            {summaryStats.bookedToday}
          </span>
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
            {t('occupiedBooked')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <span className="text-xs font-black tabular-data text-slate-900 dark:text-white">
            {summaryStats.occupancyPct}%
          </span>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {t('occupancyRate')}
          </span>
        </div>

        {summaryStats.conflicts > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-black text-rose-700 dark:text-rose-300">
              {summaryStats.conflicts} {t('conflictDetected')}
            </span>
          </div>
        )}
      </div>

      {/* Search Room Category / Unit & Keyboard Hint */}
      <div className="flex items-center gap-3">
        <span className="hidden xl:inline text-[10px] font-bold text-slate-400">
          {t('keyboardShortcutsHint')}
        </span>

        <div className="relative w-60 sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search category or room... (/)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
          />
        </div>
      </div>
    </div>
  );
}
