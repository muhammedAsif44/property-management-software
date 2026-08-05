'use client';

import { QuickHelpDrawer } from '@/components/quick-help-drawer';
import { useTranslation } from '@/lib/i18n';
import {
    ArrowLeft,
    Building2,
    ChevronLeft,
    ChevronRight,
    Download,
    Plus,
    RefreshCw,
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
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 flex flex-col shadow-2xs">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Header Pill Matching Uploaded Screenshot */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/bookings')}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer shrink-0"
            title={t('backToBookings')}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 bg-slate-50/90 dark:bg-slate-850 px-4 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-800 shadow-2xs min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate">
                {propertyName || 'Azura Resorts & Spa'}
              </h1>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 leading-tight truncate">
                {t('occupancyCalendar')}
              </span>
            </div>
          </div>
        </div>

        {/* Top Toolbar Actions (App Psychology Grouping) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Span View Selector */}
          <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => onChangeSpan(7)}
              className={`px-3 py-1 text-xs font-black rounded-full transition-all cursor-pointer ${
                spanDays === 7
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('weekView7Days')}
            </button>
            <button
              onClick={() => onChangeSpan(14)}
              className={`px-3 py-1 text-xs font-black rounded-full transition-all cursor-pointer ${
                spanDays === 14
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              14 Days
            </button>
            <button
              onClick={() => onChangeSpan(30)}
              className={`px-3 py-1 text-xs font-black rounded-full transition-all cursor-pointer ${
                spanDays === 30
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('monthView')}
            </button>
          </div>

          {/* Date Navigation Strip */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-1 shadow-2xs">
            <button
              onClick={() => onShiftDays(-1)}
              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
              title={t('shiftWeekBack')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 px-2 whitespace-nowrap min-w-0 truncate">
              {formatRangeLabel(startDate, endDate)}
            </span>
            <button
              onClick={() => onShiftDays(1)}
              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
              title={t('shiftWeekForward')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onGoToToday}
            className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="Shortcut: T"
          >
            {t('todayLabel')}
          </button>

          <button
            onClick={onExportCSV}
            className="p-2 rounded-full bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs active:scale-95"
            title={t('exportCsvAction')}
          >
            <Download className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button>

          <QuickHelpDrawer />

          <button
            onClick={onRefetch}
            className="p-2 rounded-full bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Refresh Grid"
          >
            <RefreshCw className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </button>

          <button
            onClick={() => router.push('/bookings/new')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-md shadow-emerald-900/20 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('newBooking')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
