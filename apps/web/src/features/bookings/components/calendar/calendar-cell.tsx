'use client';

import { OccupancyCell, OccupancyCellBooking } from '@/features/bookings/types/booking.types';
import { useTranslation } from '@/lib/i18n';
import { ArrowRight, CalendarCheck, PlusCircle } from 'lucide-react';
import React from 'react';
import { TargetRect } from '../booking-preview-popover';

export type StatusFilterType = 'ALL' | 'AVAILABLE' | 'PARTIAL' | 'MOSTLY' | 'FULL' | 'OVERBOOKED';

export function getCellStatusType(cell: OccupancyCell | undefined, total: number): StatusFilterType {
  if (!cell || cell.booked === 0) return 'AVAILABLE';
  if (cell.hasConflict) return 'OVERBOOKED';
  if (cell.booked >= total) return 'FULL';
  const pct = (cell.booked / total) * 100;
  if (pct >= 50) return 'MOSTLY';
  return 'PARTIAL';
}

export function getCellStyle(cell: OccupancyCell | undefined, total: number) {
  if (!cell || cell.booked === 0) {
    return {
      bg: 'bg-emerald-50/70 hover:bg-emerald-100/90 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 border-dashed',
      text: 'text-emerald-800 dark:text-emerald-300 font-bold',
      border: 'border-emerald-200/90 dark:border-emerald-800/70',
      barBg: 'bg-transparent',
      barWidth: 0,
      isAvailable: true,
    };
  }

  const booked = cell.booked || 0;
  const pct = Math.min(100, Math.round((booked / total) * 100));

  if (cell.hasConflict) {
    return {
      bg: 'bg-gradient-to-r from-red-700 via-rose-800 to-red-900 text-white font-black shadow-md shadow-red-900/30 animate-pulse',
      text: 'text-white',
      border: 'border-red-900',
      barBg: 'bg-red-950',
      barWidth: 100,
      isAvailable: false,
    };
  }

  // All booked guest stays are uniform Rose-Red!
  return {
    bg: 'bg-gradient-to-r from-rose-600 via-rose-600 to-rose-700 text-white font-black shadow-2xs hover:shadow-md hover:scale-[1.01] transition-all',
    text: 'text-white',
    border: 'border-rose-700',
    barBg: 'bg-rose-800',
    barWidth: pct,
    isAvailable: false,
  };
}

interface CalendarCellProps {
  h: { date: string; isToday: boolean; isWeekend: boolean };
  rt: { id: string; name: string; totalUnits: number };
  cell: OccupancyCell | undefined;
  cellKey: string;
  bookingsMap: Record<string, OccupancyCellBooking> | undefined;
  handleCellClick: (
    key: string,
    bookings: OccupancyCellBooking[],
    label: string,
    targetRect: TargetRect,
    roomTypeName?: string
  ) => void;
  handleContextMenuCell: (x: number, y: number, date: string, roomTypeId?: string, roomTypeName?: string) => void;
  activeStatusFilter: StatusFilterType;
  hoveredDate: string | null;
  hoveredRoomId: string | null;
  setHoveredDate: (date: string | null) => void;
  setHoveredRoomId: (id: string | null) => void;
  selectedCheckIn: { roomTypeId: string; date: string } | null;
  onSelectDateCell: (roomTypeId: string, date: string) => void;
  spanDays?: number;
}

export const CalendarCell = React.memo(
  ({
    h,
    rt,
    cell,
    cellKey,
    bookingsMap,
    handleCellClick,
    handleContextMenuCell,
    activeStatusFilter,
    hoveredDate,
    hoveredRoomId,
    setHoveredDate,
    setHoveredRoomId,
    selectedCheckIn,
    onSelectDateCell,
    spanDays = 14,
  }: CalendarCellProps) => {
    const { t } = useTranslation();
    const isMonthView = spanDays === 30;

    const total = cell?.total || rt.totalUnits;
    const booked = cell?.booked || 0;
    const cellStatusType = getCellStatusType(cell, total);
    const style = getCellStyle(cell, total);

    const isCrosshairHovered = hoveredDate === h.date || hoveredRoomId === rt.id;

    const cellBookings = React.useMemo(() => {
      if (!cell?.bookingIds || !bookingsMap) return [];
      return cell.bookingIds.map((id: string) => bookingsMap[id]).filter(Boolean);
    }, [cell?.bookingIds, bookingsMap]);

    const hasBookings = cellBookings.length > 0;
    const isFilteredOut = activeStatusFilter !== 'ALL' && activeStatusFilter !== cellStatusType;

    const dateLabel = new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });

    // Check-in & Range Highlight calculations
    const isSelectedCheckIn = selectedCheckIn?.roomTypeId === rt.id && selectedCheckIn.date === h.date;
    const isInRangePreview =
      selectedCheckIn?.roomTypeId === rt.id &&
      h.date > selectedCheckIn.date &&
      hoveredDate &&
      h.date <= hoveredDate;

    const onClickButton = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!hasBookings) {
        onSelectDateCell(rt.id, h.date);
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      handleCellClick(
        cellKey,
        cellBookings,
        `${rt.name} · ${dateLabel}`,
        {
          top: rect.top,
          left: rect.left,
          bottom: rect.bottom,
          right: rect.right,
          width: rect.width,
          height: rect.height,
        },
        rt.name
      );
    };

    const onRightClick = (e: React.MouseEvent) => {
      e.preventDefault();
      handleContextMenuCell(e.clientX, e.clientY, h.date, rt.id, rt.name);
    };

    const firstGuestName = cellBookings[0]?.guestName || '';
    const firstGuestInitials = firstGuestName
      ? firstGuestName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : '';

    return (
      <td
        onMouseEnter={() => {
          setHoveredDate(h.date);
          setHoveredRoomId(rt.id);
        }}
        onMouseLeave={() => {
          setHoveredDate(null);
          setHoveredRoomId(null);
        }}
        onContextMenu={onRightClick}
        className={`text-center border-b border-r border-slate-100 dark:border-slate-800/60 relative transition-all ${
          isMonthView ? 'w-9 h-9 p-0.5 min-w-[36px] max-w-[36px]' : 'h-[68px] p-1'
        } ${
          isSelectedCheckIn
            ? 'bg-emerald-100 dark:bg-emerald-950/80 ring-2 ring-emerald-500 z-20'
            : isInRangePreview
              ? 'bg-emerald-100/70 dark:bg-emerald-900/60 border-emerald-300'
              : isCrosshairHovered
                ? 'bg-slate-100/70 dark:bg-slate-800/50'
                : h.isToday
                  ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-x border-indigo-200/50'
                  : h.isWeekend
                    ? 'bg-slate-50/40 dark:bg-slate-850/40'
                    : 'bg-white dark:bg-slate-900'
        } ${isFilteredOut ? 'opacity-20 grayscale' : 'opacity-100'}`}
      >
        <button
          onClick={onClickButton}
          className={`${
            isMonthView ? 'w-8 h-8 aspect-square rounded-lg p-0 mx-auto' : 'w-full h-full rounded-xl p-1.5'
          } flex flex-col items-center justify-center transition-all duration-200 border relative overflow-hidden group ${
            isSelectedCheckIn
              ? 'bg-emerald-700 text-white font-black border-emerald-800 shadow-md ring-2 ring-emerald-400'
              : isInRangePreview
                ? 'bg-emerald-600 text-white font-black border-emerald-700 shadow-xs'
                : style.bg
          } ${style.border} cursor-pointer hover:scale-[1.04] hover:shadow-md hover:z-20 active:scale-95`}
          title={
            isSelectedCheckIn
              ? 'Check-In Date Selected! Click Check-Out date on calendar.'
              : cell?.hasConflict
                ? t('conflictWarning')
                : hasBookings
                  ? cellBookings.map((b: any) => b.guestName).join(', ')
                  : 'Click for Check-in / Range booking'
          }
        >
          <div className="flex items-center justify-center flex-1 w-full min-w-0">
            {isSelectedCheckIn ? (
              <div className="flex flex-col items-center justify-center text-white leading-none px-1">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  <CalendarCheck className="w-3 h-3" /> Check-In
                </span>
                <span className="text-[9px] font-extrabold mt-1">Select Check-Out</span>
              </div>
            ) : isInRangePreview ? (
              <div className="flex flex-col items-center justify-center text-white leading-none px-1">
                <span className="text-[10px] font-black flex items-center gap-1">
                  Check-Out <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            ) : booked > 0 ? (
              <div className="flex flex-col items-center justify-center leading-tight min-w-0 w-full px-1 py-0.5">
                <span className={`${isMonthView ? 'text-[9px] font-black' : 'text-xs font-black'} tracking-tight truncate max-w-full text-white drop-shadow-2xs`}>
                  {isMonthView
                    ? (firstGuestInitials || `${booked}`)
                    : (booked >= total ? `${booked}/${total} ${t('kpiSold')}` : `${booked}/${total} ${t('occupiedBooked')}`)}
                </span>
                {!isMonthView && (
                  <span className="text-[9px] font-extrabold text-white/90 tracking-wide truncate max-w-full mt-0.5">
                    {cellBookings.length > 1
                      ? `(${cellBookings.length} Guests)`
                      : (firstGuestName || `${booked}/${total} ${t('units')}`)}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity min-w-0 px-1">
                <span className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 truncate">
                  {t('vacantAvailable')}
                </span>
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              </div>
            )}
          </div>
        </button>
      </td>
    );
  }
);
CalendarCell.displayName = 'CalendarCell';
