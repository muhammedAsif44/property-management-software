'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { useOccupancyQuery } from '@/features/bookings/api/use-bookings';
import { useTranslation, LanguageSwitcher } from '@/lib/i18n';
import { QuickHelpDrawer } from '@/components/quick-help-drawer';
import dynamic from 'next/dynamic';
const BookingPreviewPopover = dynamic(() => import('@/features/bookings/components/booking-preview-popover').then(m => m.BookingPreviewPopover), { ssr: false });
import { OccupancyCell, OccupancyCellBooking } from '@/features/bookings/types/booking.types';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Building2,
  Loader2,
  RefreshCw,
  CalendarDays,
  AlertTriangle,
  RotateCcw,
  Plus,
  Search,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Info,
  Calendar,
} from 'lucide-react';

/* ─── Helpers ─── */
const todayStr = () => new Date().toISOString().split('T')[0];

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const formatRangeLabel = (start: string, end: string) => {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  return `${s.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} — ${e.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
};

const VIEW_MODE = {
  FORTNIGHT: 14,
  MONTH: 30
} as const;

/* ─── Cell logic ─── */
function getCellStyle(cell: OccupancyCell | undefined, total: number) {
  if (!cell) return { bg: 'bg-transparent', text: 'text-slate-200', border: 'border-transparent', ring: '', opacity: 'opacity-20' };
  const booked = cell.booked || 0;
  if (booked === 0) return { bg: 'bg-transparent', text: 'text-slate-300', border: 'border-transparent', ring: '', opacity: 'opacity-25' };
  
  const pct = (booked / total) * 100;
  const hasConflict = cell.hasConflict;

  if (hasConflict) return { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700', ring: 'ring-2 ring-red-500 shadow-md shadow-red-500/30 z-10 animate-pulse', opacity: 'opacity-100' };
  if (booked >= total) return { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600', ring: 'shadow-sm shadow-rose-500/30 font-extrabold', opacity: 'opacity-100' };
  if (pct > 50) return { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600', ring: 'shadow-sm shadow-amber-500/30 font-extrabold', opacity: 'opacity-100' };
  if (pct > 0) return { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700', ring: 'shadow-sm shadow-emerald-600/30 font-extrabold', opacity: 'opacity-100' };
  return { bg: 'bg-transparent', text: 'text-slate-200', border: 'border-transparent', ring: '', opacity: 'opacity-20' };
}

import { Skeleton } from '@/components/ui/skeleton';

/* ─── Skeleton Rows ─── */
function CalendarSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-divider shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Header Row Skeleton */}
      <div className="flex bg-slate-50 dark:bg-slate-800/50 border-b border-divider p-3 gap-1">
        <div className="w-[180px] shrink-0" />
        <div className="flex flex-1 gap-1 overflow-hidden">
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton key={`h-${i}`} className="h-10 w-11 rounded-md shrink-0 opacity-50" />
          ))}
        </div>
      </div>
      
      {/* Body Rows */}
      <div className="p-3 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-[180px] h-11 rounded-lg shrink-0" />
            <div className="flex gap-1 flex-1 overflow-hidden">
              {Array.from({ length: 14 }).map((_, j) => (
                <Skeleton key={j} className="w-11 h-11 rounded-md shrink-0 opacity-40" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Memoized Calendar Cell ─── */
const CalendarCell = React.memo(({
  h,
  rt,
  cell,
  cellKey,
  isPopoverOpen,
  popover,
  bookingsMap,
  filteredRoomTypesLength,
  handleCellClick,
  setPopover,
  t
}: any) => {
  const style = getCellStyle(cell, rt.totalUnits);
  const booked = cell?.booked || 0;
  const total = cell?.total || rt.totalUnits;
  
  // Resolve bookings from normalized bookingIds map
  const cellBookings = React.useMemo(() => {
    if (!cell?.bookingIds || !bookingsMap) return [];
    return cell.bookingIds.map((id: string) => bookingsMap[id]).filter(Boolean);
  }, [cell?.bookingIds, bookingsMap]);

  const hasBookings = cellBookings.length > 0;
  
  const dateLabel = new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

  return (
    <td
      className={`p-1 text-center border-b border-r border-slate-100 relative ${
        filteredRoomTypesLength <= 2 ? 'h-[90px]' : filteredRoomTypesLength <= 4 ? 'h-[75px]' : 'h-[72px]'
      } ${
        h.isToday ? 'bg-emerald-50/40' : h.isWeekend ? 'bg-slate-50/50' : 'bg-white'
      }`}
    >
      <button
        onClick={() => handleCellClick(cellKey, cellBookings, `${rt.name} · ${dateLabel}`)}
        disabled={!hasBookings}
        className={`w-full h-full min-h-[56px] rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all duration-200 border ${style.bg} ${style.text} ${style.border} ${style.ring} ${style.opacity} ${
          hasBookings ? 'cursor-pointer hover:scale-[1.03] hover:shadow-lg hover:brightness-110' : 'cursor-default'
        }`}
        title={
          cell?.hasConflict
            ? t('conflictWarning')
            : cellBookings.map((b: any) => b.guestName).join(', ') || ''
        }
      >
        {booked > 0 ? (
          <span className="leading-none tracking-tight text-sm tabular-data">{booked}</span>
        ) : (
          <span className="w-1 h-1 rounded-full bg-slate-300 opacity-60"></span>
        )}
        {booked > 0 && <span className="text-[10px] font-bold opacity-90 leading-none mt-1">/{total}</span>}
      </button>

      {/* Popover */}
      {isPopoverOpen && (
        <BookingPreviewPopover
          bookings={popover?.bookings || []}
          dateLabel={popover?.label || ''}
          onClose={() => setPopover(null)}
        />
      )}
    </td>
  );
});
CalendarCell.displayName = 'CalendarCell';

export default function OccupancyPage() {
  const router = useRouter();
  const { t } = useTranslation();
  useActivePropertyQuery();
  const activeProperty = usePropertyStore((s) => s.activeProperty);

  // Date range state: 14-day or 30-day (Month) view
  const [spanDays, setSpanDays] = useState<typeof VIEW_MODE.FORTNIGHT | typeof VIEW_MODE.MONTH>(VIEW_MODE.FORTNIGHT);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(() => addDays(todayStr(), VIEW_MODE.FORTNIGHT));
  const [searchTerm, setSearchTerm] = useState('');

  // Popover state
  type PopoverState = { key: string; bookings: OccupancyCellBooking[]; label: string } | null;
  const [popover, setPopover] = useState<PopoverState>(null);

  const { data, isLoading, isError, refetch } = useOccupancyQuery(activeProperty?.id || '', startDate, endDate);

  const handleChangeSpan = useCallback((days: typeof VIEW_MODE.FORTNIGHT | typeof VIEW_MODE.MONTH) => {
    setSpanDays(days);
    setEndDate(addDays(startDate, days));
    setPopover(null);
  }, [startDate]);

  const handleShiftDays = useCallback((dir: number) => {
    const amount = spanDays === VIEW_MODE.FORTNIGHT ? 7 : 15;
    setStartDate((s) => addDays(s, dir * amount));
    setEndDate((e) => addDays(e, dir * amount));
    setPopover(null);
  }, [spanDays]);

  const handleGoToToday = useCallback(() => {
    setStartDate(todayStr());
    setEndDate(addDays(todayStr(), spanDays));
    setPopover(null);
  }, [spanDays]);

  const handleCellClick = useCallback((key: string, bookings: OccupancyCellBooking[], label: string) => {
    if (bookings.length === 0) return;
    if (popover?.key === key) {
      setPopover(null);
      return;
    }
    setPopover({ key, bookings, label });
  }, [popover?.key]);

  // Memoize formatted day headers (optimized date math)
  const dayHeaders = useMemo(() => {
    if (!data?.dates || data.dates.length === 0) return [];
    
    // Parse the first date once, then increment by 86,400,000ms (1 day)
    const baseTs = new Date(data.dates[0] + 'T00:00:00').getTime();
    const today = todayStr();
    
    return data.dates.map((d, index) => {
      const dt = new Date(baseTs + (index * 86400000));
      return {
        date: d,
        day: dt.getDate(),
        dayName: dt.toLocaleDateString('en-US', { weekday: 'short' }),
        monthShort: dt.toLocaleDateString('en-US', { month: 'short' }),
        isToday: d === today,
        isWeekend: dt.getDay() === 0 || dt.getDay() === 6,
      };
    });
  }, [data?.dates]);

  // Filtered Room Types (optimized search)
  const filteredRoomTypes = useMemo(() => {
    if (!data?.roomTypes) return [];
    if (!searchTerm.trim()) return data.roomTypes;
    
    const normalizedSearch = searchTerm.toLowerCase().trim();
    return data.roomTypes.filter((rt) =>
      rt.name.toLowerCase().includes(normalizedSearch)
    );
  }, [data?.roomTypes, searchTerm]);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (!data?.roomTypes || !data?.dates || !data?.occupancy) return null;
    const today = todayStr();
    let totalRooms = 0;
    let bookedToday = 0;
    let oooToday = 0;
    let conflicts = 0;

    for (const rt of data.roomTypes) {
      totalRooms += rt.totalUnits;
      const cell = data.occupancy?.[rt.id]?.[today];
      if (cell) {
        bookedToday += cell.booked;
        oooToday += cell.outOfOrder || 0;
        if (cell.hasConflict) conflicts++;
      }
    }
    const availableToday = Math.max(0, totalRooms - bookedToday - oooToday);
    const occupancyPct = totalRooms > 0 ? Math.round((bookedToday / totalRooms) * 100) : 0;
    return { totalRooms, bookedToday, availableToday, oooToday, occupancyPct, conflicts };
  }, [data]);

  return (
    <div className="min-h-screen text-slate-900 font-sans antialiased flex relative overflow-hidden">

      <DashboardSidebar />

      {/* Main Content */}
      <div className="flex-1 min-w-0 transition-all duration-300 relative z-10 flex flex-col min-h-screen overflow-y-auto">
        {/* ═══ Top Header Bar ═══ */}
        <header className="bg-white/90 backdrop-blur-xl border-b border-emerald-200/80 sticky top-0 z-30 flex flex-col shadow-xs">
          <div className="h-14 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push('/bookings')}
                className="p-2 rounded-xl hover:bg-slate-100 transition-all cursor-pointer shrink-0"
                title="Back to Bookings"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </button>
              <div className="p-2 rounded-xl bg-emerald-100/80 border border-emerald-200 text-emerald-800 shadow-xs shrink-0">
                <CalendarDays className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-black text-slate-900 tracking-tight truncate flex items-center gap-1.5">
                  <span>{activeProperty?.name || 'Property'}</span>
                </h1>
                <p className="text-[11px] font-bold text-slate-500 truncate">
                  {t('occupancyCalendar')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {/* Span Selector Pill */}
              <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/80 shrink-0">
                <button
                  onClick={() => handleChangeSpan(VIEW_MODE.FORTNIGHT)}
                  className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                    spanDays === VIEW_MODE.FORTNIGHT ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  14 Days
                </button>
                <button
                  onClick={() => handleChangeSpan(VIEW_MODE.MONTH)}
                  className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                    spanDays === VIEW_MODE.MONTH ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  30 Days (Month)
                </button>
              </div>

              {/* Date Navigation */}
              <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-xl px-1 py-1 shadow-2xs">
                <button
                  onClick={() => handleShiftDays(-1)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                  title={t('shiftWeekBack')}
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <span className="text-[11px] font-bold text-slate-700 px-2 whitespace-nowrap min-w-0 truncate">
                  {formatRangeLabel(startDate, endDate)}
                </span>
                <button
                  onClick={() => handleShiftDays(1)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                  title={t('shiftWeekForward')}
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <button
                onClick={handleGoToToday}
                className="px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200/80 text-slate-700 font-extrabold text-xs transition-all cursor-pointer active:scale-95 shadow-2xs"
              >
                {t('todayLabel')}
              </button>

              <QuickHelpDrawer />

              <button
                onClick={() => refetch()}
                className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 text-emerald-700" />
              </button>

              <button
                onClick={() => router.push('/bookings/new')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white font-black text-xs shadow-md shadow-emerald-700/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-emerald-200" />
                <span className="hidden sm:inline truncate">{t('newBooking')}</span>
              </button>
            </div>
          </div>
        </header>

        {/* ═══ Summary Stats Bar (SaaS Metrics Pills) ═══ */}
        {summaryStats && (
          <div className="px-6 py-2 bg-white/80 backdrop-blur-md border-b border-divider flex items-center justify-between gap-4 flex-wrap z-10 relative">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-divider">
                <div className="w-2 h-2 rounded-full bg-slate-300" />
                <span className="text-xs font-bold tabular-data text-slate-900">{summaryStats.availableToday}</span>
                <span className="text-[11px] font-semibold text-slate-500">{t('available')}</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-divider">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-xs font-bold tabular-data text-slate-900">{summaryStats.bookedToday}</span>
                <span className="text-[11px] font-semibold text-slate-500">{t('occupied')}</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-divider">
                <div className="w-2 h-2 rounded-full bg-slate-500" />
                <span className="text-xs font-bold tabular-data text-slate-900">{summaryStats.oooToday}</span>
                <span className="text-[11px] font-semibold text-slate-500">{t('outOfOrderUnits')}</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-divider">
                <span className="text-xs font-bold tabular-data text-slate-900">
                  {summaryStats.occupancyPct}%
                </span>
                <span className="text-[11px] font-semibold text-slate-500">{t('occupancyRate')}</span>
              </div>

              {summaryStats.conflicts > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-[11px] font-bold text-rose-700">{summaryStats.conflicts} {t('conflictDetected')}</span>
                </div>
              )}
            </div>

            {/* Search & Future Filter Slots */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative w-72 sm:w-80">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by room, category, guest, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
                />
              </div>

              {/* Future Filter Trigger Slot */}
              <button
                className="interactive px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-divider text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Filters"
              >
                <span>Filter</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══ Main Body: Calendar Grid & Operational Insights ═══ */}
        <div className="p-4 sm:p-6 space-y-6 flex flex-col">
          {isLoading ? (
            <CalendarSkeleton />
          ) : isError ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <AlertTriangle className="w-12 h-12 text-red-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Failed to load room calendar data</h3>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 inline mr-1.5" />
                Retry
              </button>
            </div>
          ) : !data || !data.roomTypes?.length ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <Building2 className="w-14 h-14 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-500">{t('noRoomTypesConfigured')}</h3>
              <p className="text-sm text-slate-400 mt-1">Add room types in Property Settings to start visualizing your room calendar.</p>
            </div>
          ) : (
            <>
              {/* Table Container */}
              <div className="bg-white rounded-xl border border-divider shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
                <div className="overflow-x-auto relative">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100/90 sticky top-0 z-20 shadow-xs border-b border-slate-200">
                        <th className="sticky left-0 bg-slate-100/95 z-30 px-5 py-3 text-left font-black text-xs uppercase tracking-wider text-slate-700 border-b border-r border-slate-200 min-w-[220px] shadow-[4px_0_12px_-4px_rgba(0,0,0,0.08)]">
                          {t('roomType')}
                        </th>
                        {dayHeaders.map((h) => (
                          <th
                            key={h.date}
                            className={`px-1 py-2 text-center border-b border-r border-slate-200/70 min-w-[64px] transition-colors ${
                              h.isToday ? 'bg-emerald-100/80 border-b-2 border-b-emerald-600' : h.isWeekend ? 'bg-slate-200/60' : 'bg-slate-100/90'
                            }`}
                          >
                            <span className="block text-[9.5px] text-slate-500 uppercase font-bold tracking-widest">{h.dayName}</span>
                            <span className={`inline-block mt-0.5 ${h.isToday ? 'bg-emerald-600 text-white font-black text-xs px-1.5 py-0.5 rounded-md shadow-2xs' : 'text-[15px] font-black text-slate-900'}`}>
                              {h.day}
                            </span>
                            {h.day === 1 && (
                              <span className="block text-[9px] text-slate-500 font-bold mt-0.5">{h.monthShort}</span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoomTypes.map((rt) => (
                        <tr key={rt.id} className="group hover:bg-slate-50/80 transition-colors">
                          <td className="sticky left-0 bg-white group-hover:bg-slate-50/90 z-10 px-5 py-5 border-b border-r border-slate-200/80 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.08)] transition-colors">
                            <p className="font-bold text-slate-900 text-sm tracking-tight truncate min-w-0">{rt.name}</p>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">{rt.totalUnits} {t('units')}</p>
                          </td>
                          {dayHeaders.map((h) => {
                            const cell = data.occupancy?.[rt.id]?.[h.date];
                            const cellKey = `${rt.id}-${h.date}`;
                            const isPopoverOpen = popover?.key === cellKey;
                            
                            return (
                              <CalendarCell
                                key={h.date}
                                h={h}
                                rt={rt}
                                cell={cell}
                                cellKey={cellKey}
                                isPopoverOpen={isPopoverOpen}
                                popover={popover}
                                bookingsMap={data.bookingsMap}
                                filteredRoomTypesLength={filteredRoomTypes.length}
                                handleCellClick={handleCellClick}
                                setPopover={setPopover}
                                t={t}
                              />
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Legend */}
                <div className="px-6 py-4 bg-white border-t border-slate-200/80 flex items-center gap-6 flex-wrap shadow-sm z-20 relative rounded-b-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200" />
                    <span className="text-xs font-semibold text-slate-600">{t('available')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                    <span className="text-xs font-semibold text-slate-600">{t('partiallyBooked')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
                    <span className="text-xs font-semibold text-slate-600">{t('mostlyBooked')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
                    <span className="text-xs font-semibold text-slate-600">{t('fullyBooked')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-600 ring-2 ring-red-500/50 shadow-sm animate-pulse" />
                    <span className="text-xs font-semibold text-red-600">{t('overbooked')}</span>
                  </div>
                </div>
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
}
