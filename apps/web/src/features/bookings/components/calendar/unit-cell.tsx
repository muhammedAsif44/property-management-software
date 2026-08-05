'use client';

import { OccupancyCell, OccupancyCellBooking } from '@/features/bookings/types/booking.types';
import { useTranslation } from '@/lib/i18n';
import React from 'react';

interface UnitCellProps {
  h: { date: string; isToday: boolean; isWeekend: boolean };
  unitNumber: number;
  cell: OccupancyCell | undefined;
  bookingsMap: Record<string, OccupancyCellBooking> | undefined;
  handleContextMenuCell: (x: number, y: number, date: string) => void;
  rtId: string;
  selectedCheckIn: { roomTypeId: string; date: string } | null;
  onSelectDateCell: (roomTypeId: string, date: string) => void;
  spanDays?: number;
}

export const UnitCell = React.memo(
  ({
    h,
    unitNumber,
    cell,
    bookingsMap,
    handleContextMenuCell,
    rtId,
    selectedCheckIn,
    onSelectDateCell,
    spanDays = 14,
  }: UnitCellProps) => {
    const { t } = useTranslation();
    const isMonthView = spanDays === 30;

    const isOccupied = cell && cell.booked > 0;
    const isConflict = cell?.hasConflict;

    const isSelectedCheckIn = selectedCheckIn?.roomTypeId === rtId && selectedCheckIn.date === h.date;

    const unitBookings = React.useMemo(() => {
      if (!cell?.bookingIds || !bookingsMap) return [];
      return cell.bookingIds.map((id: string) => bookingsMap[id]).filter(Boolean);
    }, [cell?.bookingIds, bookingsMap]);

    const guestName = unitBookings[0]?.guestName || '';
    const guestInitials = guestName
      ? guestName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : '';

    const onRightClick = (e: React.MouseEvent) => {
      e.preventDefault();
      handleContextMenuCell(e.clientX, e.clientY, h.date);
    };

    const onClickUnit = () => {
      if (!isOccupied) {
        onSelectDateCell(rtId, h.date);
      }
    };

    return (
      <td
        onContextMenu={onRightClick}
        onClick={onClickUnit}
        className={`text-center border-b border-r border-slate-100 dark:border-slate-800/40 ${
          isMonthView ? 'w-9 h-9 p-0.5 min-w-[36px] max-w-[36px]' : 'h-[48px] p-1'
        } ${
          isSelectedCheckIn
            ? 'bg-emerald-100 dark:bg-emerald-950/80 ring-2 ring-emerald-500'
            : h.isToday
              ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
              : h.isWeekend
                ? 'bg-slate-50/30 dark:bg-slate-850/30'
                : 'bg-slate-50/10 dark:bg-slate-900'
        }`}
      >
        <div
          className={`${
            isMonthView ? 'w-8 h-8 aspect-square rounded-lg p-0 mx-auto' : 'w-full h-full rounded-lg px-1.5'
          } flex items-center justify-center text-[11px] font-bold transition-all border ${
            isSelectedCheckIn
              ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm ring-2 ring-emerald-400'
              : isConflict
                ? 'bg-red-700 text-white border-red-800 shadow-2xs animate-pulse'
                : isOccupied
                  ? 'bg-rose-600 dark:bg-rose-600 text-white border-rose-700 shadow-2xs'
                  : 'bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200/60 cursor-pointer hover:bg-emerald-100'
          }`}
          title={isSelectedCheckIn ? 'Check-in selected' : guestName || `Room ${unitNumber}`}
        >
          {isSelectedCheckIn ? (
            <span className={`${isMonthView ? 'text-[8px]' : 'text-[10px]'} text-white font-black`}>
              {isMonthView ? 'IN' : 'Check-In'}
            </span>
          ) : isOccupied ? (
            <div className="flex items-center justify-center gap-1 min-w-0 truncate">
              {isMonthView ? (
                <span className="text-[9px] font-black tracking-tighter text-white">
                  {guestInitials || '•'}
                </span>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  <span className="truncate">{guestName || t('occupiedBooked')}</span>
                </>
              )}
            </div>
          ) : (
            !isMonthView && (
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-extrabold">
                {t('vacantAvailable')}
              </span>
            )
          )}
        </div>
      </td>
    );
  }
);
UnitCell.displayName = 'UnitCell';
