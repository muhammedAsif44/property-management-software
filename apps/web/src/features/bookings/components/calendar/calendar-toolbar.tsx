'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import {
  ArrowLeft,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Download,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CalendarToolbarProps {
  propertyName?: string;
  spanDays: number;
  startDate: string;
  endDate: string;
  onChangeSpan: (days: number) => void;
  onShiftDays: (dir: number) => void;
  onGoToToday: () => void;
  onExportCSV: () => void;
  onRefetch: () => void;
  formatRangeLabel: (start: string, end: string) => string;
}

export function CalendarToolbar({
  propertyName,
  spanDays,
  startDate,
  endDate,
  onChangeSpan,
  onShiftDays,
  onGoToToday,
  onExportCSV,
  onRefetch,
  formatRangeLabel,
}: CalendarToolbarProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 flex-wrap">
      {/* Left: Back & Property Context */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => router.push('/bookings')}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shrink-0"
          title={t('backToBookings') || 'Back to Reservations'}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate">
              {propertyName || 'Property'}
            </h2>
            <span className="text-[10px] font-bold text-slate-400 leading-tight truncate block">
              Room Calendar
            </span>
          </div>
        </div>
      </div>

      {/* Middle & Right: Range View Selector + Date Navigator + New Booking CTA */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Span View Selector (7 Days / 14 Days / Month View) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => onChangeSpan(7)}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
              spanDays === 7
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => onChangeSpan(14)}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
              spanDays === 14
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            14 Days
          </button>
          <button
            onClick={() => onChangeSpan(30)}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
              spanDays === 30
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Month View
          </button>
        </div>

        {/* Date Range Navigation Navigator */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 shadow-2xs">
          <button
            onClick={() => onShiftDays(-1)}
            className="p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            title="Previous period"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 px-2 whitespace-nowrap min-w-0 truncate">
            {formatRangeLabel(startDate, endDate)}
          </span>
          <button
            onClick={() => onShiftDays(1)}
            className="p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            title="Next period"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Today Jump Button */}
        <button
          onClick={onGoToToday}
          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer shadow-2xs"
          title="Jump to Today"
        >
          Today
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefetch}
          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
          title="Refresh Grid"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
        </button>

        {/* New Booking CTA */}
        <button
          onClick={() => router.push('/bookings/new')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md shadow-emerald-900/20 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Booking</span>
        </button>
      </div>
    </div>
  );
}
