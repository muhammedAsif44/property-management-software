'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { SlidersHorizontal, X } from 'lucide-react';
import { StatusFilterType } from './calendar-cell';

interface CalendarStatusLegendProps {
  activeStatusFilter: StatusFilterType;
  setActiveStatusFilter: (filter: StatusFilterType) => void;
}

export function CalendarStatusLegend({
  activeStatusFilter,
  setActiveStatusFilter,
}: CalendarStatusLegendProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          {t('filterByStatus')}:
        </span>

        <button
          onClick={() => setActiveStatusFilter('ALL')}
          className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeStatusFilter === 'ALL'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          <span>{t('allStatusesLabel')}</span>
        </button>

        {/* Vacant / Available = LIGHT GREEN */}
        <button
          onClick={() =>
            setActiveStatusFilter(
              activeStatusFilter === 'AVAILABLE' ? 'ALL' : 'AVAILABLE'
            )
          }
          className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border ${
            activeStatusFilter === 'AVAILABLE'
              ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-400 text-emerald-900 dark:text-emerald-200 shadow-2xs ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>{t('vacantAvailable')}</span>
        </button>

        {/* Booked = SOLID ROSE RED */}
        <button
          onClick={() =>
            setActiveStatusFilter(activeStatusFilter === 'FULL' ? 'ALL' : 'FULL')
          }
          className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border ${
            activeStatusFilter === 'FULL'
              ? 'bg-rose-600 text-white border-rose-700 shadow-2xs ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
          <span>{t('occupiedBooked')} (100%)</span>
        </button>

        <button
          onClick={() =>
            setActiveStatusFilter(activeStatusFilter === 'PARTIAL' ? 'ALL' : 'PARTIAL')
          }
          className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border ${
            activeStatusFilter === 'PARTIAL'
              ? 'bg-amber-500 text-white border-amber-600 shadow-2xs ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>{t('partiallyBooked')} (&lt;50%)</span>
        </button>

        <button
          onClick={() =>
            setActiveStatusFilter(
              activeStatusFilter === 'OVERBOOKED' ? 'ALL' : 'OVERBOOKED'
            )
          }
          className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border ${
            activeStatusFilter === 'OVERBOOKED'
              ? 'bg-red-700 text-white border-red-800 shadow-2xs ring-2 ring-red-600/30'
              : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 text-red-600 dark:text-red-400 hover:border-slate-300'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-700 animate-pulse" />
          <span>{t('overbooked')}</span>
        </button>
      </div>

      {activeStatusFilter !== 'ALL' && (
        <button
          onClick={() => setActiveStatusFilter('ALL')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>{t('clearStatusFilter')}</span>
        </button>
      )}
    </div>
  );
}
