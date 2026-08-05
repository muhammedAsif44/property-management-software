'use client';

import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useOccupancyQuery } from '@/features/bookings/api/use-bookings';
import { TargetRect } from '@/features/bookings/components/booking-preview-popover';
import { OccupancyCellBooking } from '@/features/bookings/types/booking.types';
import { useActivePropertyQuery, usePropertyStore } from '@/features/properties';
import { useTranslation } from '@/lib/i18n';
import { AlertTriangle, BedDouble, Building2, CalendarCheck, ChevronDown, RotateCcw, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Modular Calendar Components
import { CalendarCell, StatusFilterType } from '@/features/bookings/components/calendar/calendar-cell';
import { CalendarMetricsBar } from '@/features/bookings/components/calendar/calendar-metrics-bar';
import { CalendarStatusLegend } from '@/features/bookings/components/calendar/calendar-status-legend';
import { CalendarToolbar } from '@/features/bookings/components/calendar/calendar-toolbar';
import { UnitCell } from '@/features/bookings/components/calendar/unit-cell';
import { CalendarKpiHeader } from '@/features/bookings/components/calendar/calendar-kpi-header';

const BookingPreviewPopover = dynamic(
  () => import('@/features/bookings/components/booking-preview-popover').then((m) => m.BookingPreviewPopover),
  { ssr: false }
);
const BookingDetailsDrawer = dynamic(
  () => import('@/features/bookings/components/booking-details-drawer').then((m) => m.BookingDetailsDrawer),
  { ssr: false }
);
const RoomCalendarContextMenu = dynamic(
  () => import('@/features/bookings/components/room-calendar-context-menu').then((m) => m.RoomCalendarContextMenu),
  { ssr: false }
);

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

/* ─── Skeleton Loader ─── */
function CalendarSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-4 space-y-4">
      <div className="flex gap-2">
        <Skeleton className="w-56 h-12 rounded-xl shrink-0 opacity-60" />
        <div className="flex flex-1 gap-2 overflow-hidden">
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton key={`h-${i}`} className="h-12 w-14 rounded-xl shrink-0 opacity-50" />
          ))}
        </div>
      </div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-2 items-center">
          <Skeleton className="w-56 h-14 rounded-xl shrink-0 opacity-70" />
          <div className="flex flex-1 gap-2 overflow-hidden">
            {Array.from({ length: 14 }).map((_, j) => (
              <Skeleton key={j} className="w-14 h-14 rounded-xl shrink-0 opacity-40" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OccupancyPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useToast();
  useActivePropertyQuery();
  const activeProperty = usePropertyStore((s) => s.activeProperty);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Drag to scroll refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDraggedRef = useRef(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Date range state
  const [spanDays, setSpanDays] = useState<number>(14);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(() => addDays(todayStr(), 14));
  const [searchTerm, setSearchTerm] = useState('');

  // Crosshair hover coordinates
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

  // Grid Range Selection State (Check-in -> Check-out)
  const [selectedCheckIn, setSelectedCheckIn] = useState<{ roomTypeId: string; date: string } | null>(null);

  // Status Filter State
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilterType>('ALL');

  // Expandable category rows state
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Right-Side Booking Details Drawer state
  const [selectedDrawerBookingId, setSelectedDrawerBookingId] = useState<string | null>(null);

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    date: string;
    roomTypeId?: string;
    roomTypeName?: string;
  } | null>(null);

  // Popover state
  type PopoverState = {
    key: string;
    bookings: OccupancyCellBooking[];
    label: string;
    targetRect: TargetRect;
    roomTypeName?: string;
  } | null;
  const [popover, setPopover] = useState<PopoverState>(null);

  const toggleCategoryExpand = (rtId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [rtId]: !prev[rtId] }));
  };

  const { data, isLoading, isError, refetch } = useOccupancyQuery(
    activeProperty?.id || '',
    startDate,
    endDate
  );

  const handleSelectDateCell = useCallback(
    (roomTypeId: string, clickedDate: string) => {
      if (hasDraggedRef.current) return;
      
      if (!selectedCheckIn) {
        // First Click -> Set Check-In
        setSelectedCheckIn({ roomTypeId, date: clickedDate });
        toast.info(
          `Check-In date (${clickedDate}) selected. Now click your Check-Out date on the calendar.`,
          'Check-In Set'
        );
        return;
      }

      // If clicking same check-in date again, toggle it off
      if (selectedCheckIn?.roomTypeId === roomTypeId && selectedCheckIn.date === clickedDate) {
        setSelectedCheckIn(null);
        return;
      }

      // Second Click on same room category -> If clickedDate > checkInDate -> Complete Range!
      if (selectedCheckIn.roomTypeId === roomTypeId && clickedDate > selectedCheckIn.date) {
        const checkInDate = selectedCheckIn.date;
        const checkOutDate = clickedDate;
        setSelectedCheckIn(null);
        router.push(
          `/bookings/new?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&roomTypeId=${roomTypeId}`
        );
        return;
      }

      // If clicked on different room category or date <= checkIn -> Update Check-In selection
      setSelectedCheckIn({ roomTypeId, date: clickedDate });
      toast.info(
        `Check-In date updated (${clickedDate}). Click your Check-Out date on the calendar.`,
        'Check-In Updated'
      );
    },
    [selectedCheckIn, router, toast]
  );

  // Global Keyboard Shortcuts (T for Today, / for Search, Esc for Close/Cancel Range)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 't' || e.key === 'T') {
        handleGoToToday();
      } else if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (selectedCheckIn) {
          setSelectedCheckIn(null);
          toast.info('Check-In range selection cancelled', 'Cancelled');
        } else {
          setPopover(null);
          setSelectedDrawerBookingId(null);
          setContextMenu(null);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedCheckIn, toast]);

  // Drag-to-scroll handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleChangeSpan = useCallback(
    (days: number) => {
      setSpanDays(days);
      setEndDate(addDays(startDate, days));
      setPopover(null);
      setSelectedCheckIn(null);
    },
    [startDate]
  );

  const handleShiftDays = useCallback(
    (dir: number) => {
      const amount = spanDays === 14 ? 7 : spanDays === 7 ? 4 : 15;
      setStartDate((s) => addDays(s, dir * amount));
      setEndDate((e) => addDays(e, dir * amount));
      setPopover(null);
      setSelectedCheckIn(null);
    },
    [spanDays]
  );

  const handleGoToToday = useCallback(() => {
    setStartDate(todayStr());
    setEndDate(addDays(todayStr(), spanDays));
    setPopover(null);
    setSelectedCheckIn(null);
  }, [spanDays]);

  const handleCellClick = useCallback(
    (
      key: string,
      bookings: OccupancyCellBooking[],
      label: string,
      targetRect: TargetRect,
      roomTypeName?: string
    ) => {
      if (hasDraggedRef.current) return;
      if (bookings.length === 0) return;
      if (popover?.key === key) {
        setPopover(null);
        return;
      }
      setPopover({ key, bookings, label, targetRect, roomTypeName });
    },
    [popover?.key]
  );

  const handleContextMenuCell = useCallback(
    (x: number, y: number, date: string, roomTypeId?: string, roomTypeName?: string) => {
      setContextMenu({ x, y, date, roomTypeId, roomTypeName });
    },
    []
  );

  const exportCSV = useCallback(() => {
    if (!data?.roomTypes || !data?.dates) return;
    let csvContent = 'data:text/csv;charset=utf-8,Room Type,' + data.dates.join(',') + '\n';
    for (const rt of data.roomTypes) {
      const row = [rt.name];
      for (const d of data.dates) {
        const booked = data.occupancy?.[rt.id]?.[d]?.booked || 0;
        row.push(`${booked}/${rt.totalUnits}`);
      }
      csvContent += row.join(',') + '\n';
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `occupancy-${startDate}-to-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Occupancy grid exported to CSV', 'Export Success');
  }, [data, startDate, endDate, toast]);

  // Memoize formatted day headers
  const dayHeaders = useMemo(() => {
    if (!data?.dates || data.dates.length === 0) return [];

    const baseTs = new Date(data.dates[0] + 'T00:00:00').getTime();
    const today = todayStr();

    return data.dates.map((d, index) => {
      const dt = new Date(baseTs + index * 86400000);
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

  // Filtered Room Types
  const filteredRoomTypes = useMemo(() => {
    if (!data?.roomTypes) return [];
    if (!searchTerm.trim()) return data.roomTypes;

    const normalizedSearch = searchTerm.toLowerCase().trim();
    return data.roomTypes.filter((rt) => rt.name.toLowerCase().includes(normalizedSearch));
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
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative overflow-hidden bg-slate-50/70 dark:bg-slate-950">
      <DashboardSidebar />

      {/* Main Content */}
      <div className="flex-1 min-w-0 transition-all duration-300 relative z-10 flex flex-col min-h-screen overflow-y-auto">
        {/* Modular Header Toolbar */}
        <CalendarToolbar
          propertyName={activeProperty?.name}
          spanDays={spanDays}
          startDate={startDate}
          endDate={endDate}
          onChangeSpan={handleChangeSpan}
          onShiftDays={handleShiftDays}
          onGoToToday={handleGoToToday}
          onExportCSV={exportCSV}
          onRefetch={refetch}
          formatRangeLabel={formatRangeLabel}
        />

        {/* Modular Summary Metrics Bar */}
        <CalendarMetricsBar
          summaryStats={summaryStats}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchInputRef={searchInputRef}
        />

        {/* Main Body: Grid & Interactive Status Filter */}
        <div className="p-4 sm:p-6 space-y-4 flex flex-col">
          {/* Active Range Selection Banner */}
          {selectedCheckIn && (
            <div className="bg-emerald-800 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between gap-4 border border-emerald-700 animate-fadeIn">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 border border-emerald-600">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black truncate">
                    Check-In Selected: <span className="underline decoration-emerald-400">{selectedCheckIn.date}</span>
                  </p>
                  <p className="text-[11px] font-medium text-emerald-200 truncate">
                    Click your Check-Out date on the calendar row to auto-open booking wizard with pre-filled dates.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCheckIn(null)}
                className="px-3.5 py-1.5 rounded-full bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs transition-all cursor-pointer border border-emerald-700 shrink-0 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Cancel (Esc)
              </button>
            </div>
          )}

          {isLoading ? (
            <CalendarSkeleton />
          ) : isError ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-2">
                Failed to load room calendar data
              </h3>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 rounded-full bg-emerald-800 text-white font-extrabold text-xs hover:bg-emerald-900 transition-all cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1.5" />
                Retry
              </button>
            </div>
          ) : !data || !data.roomTypes?.length ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-base font-bold text-slate-600 dark:text-slate-400">
                {t('noRoomTypesConfigured')}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure room categories in Property Settings to populate the Tape Chart.
              </p>
            </div>
          ) : (
            <>
              {/* KPI Analytics Header Bar */}
              <CalendarKpiHeader
                totalUnits={summaryStats?.totalRooms}
                bookedUnits={summaryStats?.bookedToday}
                availableUnits={summaryStats?.availableToday}
                occupancyRate={summaryStats?.occupancyPct}
              />

              {/* Modular Status Legend Filter Bar */}
              <CalendarStatusLegend
                activeStatusFilter={activeStatusFilter}
                setActiveStatusFilter={setActiveStatusFilter}
              />

              {/* Calendar Grid Matrix */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
                <div 
                  ref={scrollContainerRef}
                  onMouseDown={onMouseDown}
                  onMouseLeave={onMouseLeave}
                  onMouseUp={onMouseUp}
                  onMouseMove={onMouseMove}
                  className={`overflow-x-auto relative scrollbar-none select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                >
                  <table className="w-full text-sm border-collapse pointer-events-auto">
                    <thead>
                      <tr className="bg-slate-100/90 dark:bg-slate-800/90 sticky top-0 z-20 shadow-2xs border-b border-slate-200 dark:border-slate-750">
                        {/* Left Sticky Room Category Header */}
                        <th className="sticky left-0 bg-slate-100/95 dark:bg-slate-800/95 z-30 px-4 py-3 text-left font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-750 min-w-[240px] shadow-[4px_0_12px_-4px_rgba(0,0,0,0.06)]">
                          {t('roomType')}
                        </th>

                        {/* Date Columns */}
                        {dayHeaders.map((h) => {
                          const isColumnHovered = hoveredDate === h.date;

                          return (
                            <th
                              key={h.date}
                              className={`text-center border-b border-r border-slate-200/70 dark:border-slate-800 transition-colors ${
                                spanDays === 30 ? 'w-9 min-w-[36px] max-w-[36px] p-0.5' : 'min-w-[64px] px-1 py-2'
                              } ${
                                isColumnHovered
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-black'
                                  : h.isToday
                                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-b-2 border-b-emerald-600 shadow-2xs'
                                    : h.isWeekend
                                      ? 'bg-slate-200/60 dark:bg-slate-800/60'
                                      : 'bg-slate-100/90 dark:bg-slate-800/90'
                              }`}
                            >
                              <span
                                className={`block text-[9.5px] uppercase font-bold tracking-widest ${
                                  h.isToday
                                    ? 'text-emerald-800 dark:text-emerald-300 font-black'
                                    : 'text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {h.dayName}
                              </span>
                              <span
                                className={`inline-block mt-0.5 ${
                                  h.isToday
                                    ? 'bg-emerald-700 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-2xs'
                                    : 'text-sm font-black text-slate-900 dark:text-slate-100'
                                }`}
                              >
                                {h.day}
                              </span>
                              {h.day === 1 && (
                                <span
                                  className={`block text-[9px] font-bold mt-0.5 ${
                                    h.isToday
                                      ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                                      : 'text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  {h.monthShort}
                                </span>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoomTypes.map((rt) => {
                        const isExpanded = !!expandedCategories[rt.id];
                        const unitNumbers = Array.from(
                          { length: rt.totalUnits },
                          (_, i) => 101 + i
                        );
                        const isRowHovered = hoveredRoomId === rt.id;

                        return (
                          <React.Fragment key={rt.id}>
                            {/* Category Summary Row */}
                            <tr
                              className={`group transition-colors ${
                                isRowHovered ? 'bg-slate-100/80 dark:bg-slate-850/60' : 'hover:bg-slate-50/80 dark:hover:bg-slate-850/50'
                              }`}
                            >
                              <td className="sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-850 z-10 px-4 py-3 border-b border-r border-slate-200/80 dark:border-slate-800 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.06)] transition-colors">
                                <div className="flex items-center justify-between gap-2 min-w-0">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                                      <BedDouble className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-900 dark:text-white text-xs tracking-tight truncate">
                                        {rt.name}
                                      </p>
                                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                                        {rt.totalUnits} {t('units')}
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => toggleCategoryExpand(rt.id)}
                                    className="p-1 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer shrink-0"
                                    title={isExpanded ? t('collapseUnits') : t('expandUnits')}
                                  >
                                    <ChevronDown
                                      className={`w-4 h-4 transition-transform duration-200 ${
                                        isExpanded ? 'rotate-180 text-emerald-600' : ''
                                      }`}
                                    />
                                  </button>
                                </div>
                              </td>

                              {/* Category Level Cells */}
                              {dayHeaders.map((h) => {
                                const cell = data.occupancy?.[rt.id]?.[h.date];
                                const cellKey = `${rt.id}-${h.date}`;

                                return (
                                  <CalendarCell
                                    key={h.date}
                                    h={h}
                                    rt={rt}
                                    cell={cell}
                                    cellKey={cellKey}
                                    bookingsMap={data.bookingsMap}
                                    handleCellClick={handleCellClick}
                                    handleContextMenuCell={handleContextMenuCell}
                                    activeStatusFilter={activeStatusFilter}
                                    hoveredDate={hoveredDate}
                                    hoveredRoomId={hoveredRoomId}
                                    setHoveredDate={setHoveredDate}
                                    setHoveredRoomId={setHoveredRoomId}
                                    selectedCheckIn={selectedCheckIn}
                                    onSelectDateCell={handleSelectDateCell}
                                  />
                                );
                              })}
                            </tr>

                            {/* Expanded Room Unit Rows */}
                            {isExpanded &&
                              unitNumbers.map((unitNum) => (
                                <tr
                                  key={`${rt.id}-unit-${unitNum}`}
                                  className="bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-100/80 transition-colors"
                                >
                                  <td className="sticky left-0 bg-slate-100/90 dark:bg-slate-950 z-10 pl-8 pr-4 py-2.5 border-b border-r border-slate-200/80 dark:border-slate-800/80 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.04)]">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                      <span className="truncate">
                                        Room {unitNum}
                                      </span>
                                    </div>
                                  </td>

                                  {dayHeaders.map((h) => {
                                    const cell = data.occupancy?.[rt.id]?.[h.date];
                                    return (
                                      <UnitCell
                                        key={`unit-${unitNum}-${h.date}`}
                                        h={h}
                                        unitNumber={unitNum}
                                        cell={cell}
                                        bookingsMap={data.bookingsMap}
                                        handleContextMenuCell={handleContextMenuCell}
                                        rtId={rt.id}
                                        selectedCheckIn={selectedCheckIn}
                                        onSelectDateCell={handleSelectDateCell}
                                      />
                                    );
                                  })}
                                </tr>
                              ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Portal Popover Layer */}
      {popover && (
        <BookingPreviewPopover
          targetRect={popover.targetRect}
          bookings={popover.bookings}
          dateLabel={popover.label}
          roomTypeName={popover.roomTypeName}
          onClose={() => setPopover(null)}
          onOpenDrawer={(bookingId) => {
            setSelectedDrawerBookingId(bookingId);
          }}
        />
      )}

      {/* Right-Side Booking Details Drawer */}
      {selectedDrawerBookingId && (
        <BookingDetailsDrawer
          bookingId={selectedDrawerBookingId}
          onClose={() => setSelectedDrawerBookingId(null)}
        />
      )}

      {/* Right-Click Context Menu Layer */}
      {contextMenu && (
        <RoomCalendarContextMenu
          menuState={contextMenu}
          onClose={() => setContextMenu(null)}
          onNewBooking={(date, roomTypeId) => {
            router.push(`/bookings/new?checkInDate=${date}&roomTypeId=${roomTypeId || ''}`);
          }}
        />
      )}
    </div>
  );
}
