'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import {
  ChevronDown,
  BedDouble,
  Calendar as CalendarIcon,
  PlusCircle,
  Search,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════════
   1. UTILITY HELPERS
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Auto-format guest names to Title Case on render
 * (e.g. "niyaf" -> "Niyaf", "sophia martinez & family" -> "Sophia Martinez & Family")
 */
export function formatGuestName(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ''))
    .join(' ');
}

/**
 * Format raw backend status enums into clean human-readable sentence case
 * (e.g. "CHECKED_IN" -> "Checked in", "CONFIRMED" -> "Confirmed", "PENDING" -> "Pending")
 */
export function formatStatusLabel(status: string): string {
  if (!status) return '';
  const cleaned = status.trim().toLowerCase().replace(/_/g, ' ');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/* ══════════════════════════════════════════════════════════════════════════
   2. TYPED DATA INTERFACES
   ══════════════════════════════════════════════════════════════════════════ */
export interface RawBooking {
  id: string;
  roomId: string;
  roomTypeId: string;
  guestName: string;
  checkIn: string;  // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  channel: 'direct' | 'ota';
  status: 'confirmed' | 'checked_in' | 'pending' | string;
  guestCount?: number;
}

export interface RoomUnit {
  id: string;
  roomTypeId: string;
  unitNumber: string;
  name?: string;
}

export interface RoomType {
  id: string;
  name: string;
  totalUnits: number;
  rooms: RoomUnit[];
}

export interface MultiTenantBookingCalendarProps {
  dates: string[];     // Array of ISO date strings YYYY-MM-DD
  todayDate: string;  // Today's date YYYY-MM-DD
  roomTypes: RoomType[];
  rawBookings: RawBooking[];
  occupancyData?: Record<string, Record<string, { booked: number; total: number; outOfOrder: number; available: number; hasConflict: boolean }>>;
  onBookingClick?: (booking: RawBooking) => void;
  onCellClick?: (roomId: string, date: string) => void;
  themeConfig?: Record<string, string>; // Custom CSS custom properties per-tenant
}

/* ══════════════════════════════════════════════════════════════════════════
   3. REUSABLE COMPONENT IMPLEMENTATION
   ══════════════════════════════════════════════════════════════════════════ */
export function MultiTenantBookingCalendar({
  dates,
  todayDate,
  roomTypes,
  rawBookings,
  occupancyData,
  onBookingClick,
  onCellClick,
  themeConfig,
}: MultiTenantBookingCalendarProps) {
  const { t } = useTranslation();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    [roomTypes[0]?.id || '']: true,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /* ── Pre-process Date Lookups & Day Headers ────────────────────────── */
  const dayHeaders = useMemo(() => {
    return dates.map((dateStr) => {
      const d = new Date(`${dateStr}T00:00:00.000Z`);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getUTCDate();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
      const isToday = dateStr === todayDate;
      const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
      return { date: dateStr, dayName, dayNum, monthShort, isToday, isWeekend };
    });
  }, [dates, todayDate]);

  const cleanDate = (d: string) => (d ? String(d).split('T')[0] : '');

  /* ── Compute Aggregate Occupancy Map per (roomTypeId, date) ────────── */
  const aggregateOccupancy = useMemo(() => {
    const map: Record<string, Record<string, { bookedCount: number; guests: number; bookings: RawBooking[] }>> = {};

    for (const rt of roomTypes) {
      map[rt.id] = {};
      for (const dStr of dates) {
        const backendCell = occupancyData?.[rt.id]?.[dStr];
        const initialBooked = backendCell ? backendCell.booked : 0;
        map[rt.id][dStr] = { bookedCount: initialBooked, guests: initialBooked, bookings: [] };
      }
    }

    for (const b of rawBookings) {
      const inStr = cleanDate(b.checkIn);
      const outStr = cleanDate(b.checkOut);

      if (!inStr || !outStr) continue;

      const inDate = new Date(`${inStr}T00:00:00.000Z`);
      const outDate = new Date(`${outStr}T00:00:00.000Z`);
      
      let cursor = inDate.getTime();
      const endTs = outDate.getTime();

      while (cursor < endTs) {
        const dStr = new Date(cursor).toISOString().split('T')[0];
        if (map[b.roomTypeId]?.[dStr]) {
          if (!occupancyData) {
            map[b.roomTypeId][dStr].bookedCount += 1;
          }
          map[b.roomTypeId][dStr].guests += b.guestCount || 1;
          map[b.roomTypeId][dStr].bookings.push(b);
        }
        cursor += 86400000;
      }
    }

    return map;
  }, [roomTypes, dates, rawBookings, occupancyData]);

  /* ── Compute Summary Metrics for Consolidated Header Bar ───────────── */
  const summaryMetrics = useMemo(() => {
    const activeDate = todayDate || dates[0] || '';
    let totalRooms = 0;
    let totalBookedToday = 0;
    let soldOutCategoryCount = 0;

    for (const rt of roomTypes) {
      totalRooms += rt.totalUnits;
      const cellOcc = aggregateOccupancy[rt.id]?.[activeDate]?.bookedCount || 0;
      totalBookedToday += cellOcc;
      if (cellOcc >= rt.totalUnits && rt.totalUnits > 0) {
        soldOutCategoryCount += 1;
      }
    }

    const availableToday = Math.max(0, totalRooms - totalBookedToday);
    const bookedRatePct = totalRooms > 0 ? Math.round((totalBookedToday / totalRooms) * 100) : 0;

    return {
      totalRooms,
      bookedToday: totalBookedToday,
      availableToday,
      soldOutCategoryCount,
      bookedRatePct,
    };
  }, [roomTypes, dates, todayDate, aggregateOccupancy]);

  /* ── Compute Continuous Multi-Night Booking Spans per Room ─────────── */
  const roomBookingSpans = useMemo(() => {
    const map: Record<string, Record<string, { booking: RawBooking; spanDays: number; isStart: boolean } | { covered: boolean }>> = {};

    for (const rt of roomTypes) {
      // Strictly match bookings belonging to this roomType
      const categoryBookings = rawBookings.filter(
        (b) => b.roomTypeId === rt.id || (!b.roomTypeId && rt.id === roomTypes[0]?.id)
      );

      rt.rooms.forEach((room, roomIdx) => {
        map[room.id] = {};
        
        // 1. Direct match by roomId or unitNumber
        let roomBookings = categoryBookings.filter((b) => {
          return (
            b.roomId === room.id ||
            b.roomId === room.unitNumber ||
            String(b.roomId) === String(room.unitNumber)
          );
        });

        // 2. Fallback for unassigned bookings within this roomType ONLY: distribute deterministically by roomIdx
        if (roomBookings.length === 0) {
          const unassigned = categoryBookings.filter(
            (b) => !b.roomId || !rt.rooms.some((r) => r.id === b.roomId || r.unitNumber === b.roomId)
          );
          if (unassigned[roomIdx]) {
            roomBookings = [unassigned[roomIdx]];
          }
        }

        for (const b of roomBookings) {
          const inStr = cleanDate(b.checkIn);
          const outStr = cleanDate(b.checkOut);

          let startIndex = dates.indexOf(inStr);
          let endIndex = dates.indexOf(outStr);

          // If checked in prior to current grid view, but stay overlaps current grid
          if (startIndex === -1 && dates[0] && inStr < dates[0] && outStr > dates[0]) {
            startIndex = 0;
          }

          if (startIndex !== -1) {
            // How many columns in our current view does this booking span?
            const actualEnd = endIndex !== -1 ? endIndex : dates.length;
            const spanDays = Math.max(1, actualEnd - startIndex);

            // Mark check-in / view start cell
            map[room.id][dates[startIndex]] = { booking: b, spanDays, isStart: true };

            // Mark covered intermediate dates
            for (let i = startIndex + 1; i < actualEnd; i++) {
              if (dates[i]) {
                map[room.id][dates[i]] = { covered: true };
              }
            }
          }
        }
      });
    }

    return map;
  }, [roomTypes, dates, rawBookings]);

  /* ── Filtered Room Types via Search Query ──────────────────────────── */
  const filteredRoomTypes = useMemo(() => {
    if (!searchQuery.trim()) return roomTypes;
    const q = searchQuery.toLowerCase().trim();
    return roomTypes.filter(
      (rt) =>
        rt.name.toLowerCase().includes(q) ||
        rt.rooms.some((r) => r.unitNumber.toLowerCase().includes(q))
    );
  }, [roomTypes, searchQuery]);

  return (
    <div
      style={themeConfig as React.CSSProperties}
      className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-xs"
    >
      {/* ══════════════════════════════════════════════════════════════════
         4. CONSOLIDATED SINGLE HORIZONTAL CONTROL BAR
         (Summary Stats + Swatch Legend + Channel Origin + Search Input)
         ══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 py-3 bg-[var(--bg-app)] border-b border-[var(--border-subtle)] flex items-center justify-between gap-4 flex-wrap text-xs">
        {/* Left Side: Summary Metrics & Color Legend */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Summary Stat Badges */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-available)] border border-[var(--border-available)] text-[var(--text-available)] font-bold">
            <span className="w-2 h-2 rounded-full bg-[var(--text-available)] shrink-0" />
            <span>{summaryMetrics.availableToday} Available</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-[var(--fill-accent)] shrink-0" />
            <span>{summaryMetrics.bookedToday} Booked</span>
          </div>

          {summaryMetrics.soldOutCategoryCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 font-extrabold">
              <span className="w-2 h-2 rounded-full bg-[var(--fill-danger)] shrink-0" />
              <span>{summaryMetrics.soldOutCategoryCount} Sold Out</span>
            </div>
          )}

          <div className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
            <span>{summaryMetrics.bookedRatePct}% Booked Rate</span>
          </div>

          <div className="h-4 w-px bg-[var(--border-subtle)] hidden lg:block" />

          {/* Swatch Status Legend */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] font-medium">
              <span className="w-2 h-2 rounded-full bg-[var(--text-available)]" />
              <span>Available</span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] font-medium">
              <span className="w-2 h-2 rounded-full bg-[var(--fill-accent)]" />
              <span>Confirmed Booking (Partial)</span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] font-medium">
              <span className="w-2 h-2 rounded-full bg-[var(--fill-danger)]" />
              <span>Sold Out (100% Occupied)</span>
            </div>
          </div>

          <div className="h-4 w-px bg-[var(--border-subtle)] hidden xl:block" />

          {/* Channel Origin Legend (Differentiated with Rounded Square Shapes) */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-[11px] text-[var(--text-secondary)] font-bold">Channel Origin:</span>
            <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] font-medium">
              {/* Channel origin indicator uses rounded-square shape to distinguish from circular status dots */}
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--channel-direct)] shrink-0" title="Direct Booking" />
              <span>Direct Booking</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] font-medium">
              {/* Channel origin indicator uses rounded-square shape to distinguish from circular status dots */}
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--channel-ota)] shrink-0" title="OTA Channel" />
              <span>OTA (Agoda/Booking.com)</span>
            </div>
          </div>
        </div>

        {/* Right Side: Integrated Search Filter */}
        <div className="relative min-w-[200px] sm:min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search category or room..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--fill-accent)] transition-all"
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
         5. STICKY TAPE CHART GRID
         ══════════════════════════════════════════════════════════════════ */}
      <div className="overflow-x-auto relative max-h-[700px]">
        <table className="w-full border-collapse text-left border-spacing-0">
          {/* Sticky Header Row */}
          <thead className="sticky top-0 z-30 bg-[var(--bg-app)] border-b border-[var(--border-subtle)]">
            <tr>
              {/* Sticky First Column: Room Type / Room Number */}
              <th className="sticky left-0 bg-[var(--bg-app)] z-40 px-4 py-3 min-w-[220px] max-w-[220px] border-r border-[var(--border-subtle)] font-bold text-xs text-[var(--text-secondary)] uppercase tracking-wider shadow-[2px_0_6px_-2px_rgba(0,0,0,0.05)]">
                Room Category / Unit
              </th>

              {dayHeaders.map((h) => (
                <th
                  key={h.date}
                  className={`px-2 py-2 text-center min-w-[90px] border-r border-[var(--border-subtle)] transition-colors ${
                    h.isToday ? 'bg-blue-50/70 dark:bg-blue-950/30' : h.isWeekend ? 'bg-black/5 dark:bg-white/5' : ''
                  }`}
                >
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                      {h.dayName}
                    </span>

                    {/* Today Accent Circle */}
                    <span
                      className={`text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                        h.isToday
                          ? 'bg-[var(--fill-accent)] text-white shadow-xs'
                          : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {h.dayNum}
                    </span>

                    <span className="text-[9px] text-[var(--text-muted)] font-semibold">
                      {h.monthShort}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredRoomTypes.map((rt) => {
              const isExpanded = !!expandedCategories[rt.id];

              return (
                <React.Fragment key={rt.id}>
                  {/* ── AGGREGATE ROOM-TYPE ROW ───────────────────────── */}
                  <tr className="bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] transition-colors group">
                    <td className="sticky left-0 bg-[var(--bg-surface)] group-hover:bg-[var(--bg-hover)] z-20 px-4 py-3 border-b border-r border-[var(--border-subtle)] shadow-[2px_0_6px_-2px_rgba(0,0,0,0.05)] transition-colors">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <BedDouble className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-xs truncate block text-[var(--text-primary)]">
                              {rt.name}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] block truncate">
                              {rt.totalUnits} {t('units')}
                            </span>
                          </div>
                        </div>

                        {/* Visually Identical Expand/Collapse Button in Both States */}
                        <button
                          onClick={() => toggleCategory(rt.id)}
                          className="w-6 h-6 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer flex items-center justify-center shrink-0 focus:outline-none focus:ring-2 focus:ring-[var(--fill-accent)]"
                          aria-label={isExpanded ? 'Collapse room units' : 'Expand room units'}
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-[var(--fill-accent)]' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </td>

                    {/* Aggregate Cells per Date */}
                    {dayHeaders.map((h) => {
                      const occ = aggregateOccupancy[rt.id]?.[h.date] || { bookedCount: 0, guests: 0 };
                      const booked = occ.bookedCount;
                      const total = rt.totalUnits;
                      const isSoldOut = booked >= total && total > 0;
                      const isPartial = booked > 0 && booked < total;

                      return (
                        <td
                          key={h.date}
                          className="p-1 border-b border-r border-[var(--border-subtle)] text-center align-middle"
                        >
                          <div
                            className={`w-full h-11 rounded-lg p-1 flex flex-col items-center justify-center transition-all border ${
                              isSoldOut
                                ? 'bg-[var(--fill-danger)] text-[var(--text-danger)] border-[var(--border-danger)] font-black shadow-xs'
                                : isPartial
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800 font-bold'
                                  : 'bg-[var(--bg-available)] text-[var(--text-available)] border-[var(--border-available)] font-bold'
                            }`}
                          >
                            <span className="text-[11px] leading-tight truncate max-w-full">
                              {isSoldOut ? 'Sold out' : isPartial ? `${booked}/${total} booked` : 'Available'}
                            </span>
                            <span className="text-[9px] opacity-90 truncate max-w-full">
                              {isSoldOut ? `${booked}/${total} booked` : isPartial ? `${occ.guests} guests` : `0/${total}`}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* ── INDIVIDUAL ROOM UNIT ROWS ─────────────────────── */}
                  {isExpanded &&
                    rt.rooms.map((room) => (
                      <tr
                        key={room.id}
                        className="bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] transition-colors"
                      >
                        <td className="sticky left-0 bg-[var(--bg-app)] z-20 pl-8 pr-4 py-2 border-b border-r border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] shadow-[2px_0_6px_-2px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-available)] shrink-0" />
                            <span className="truncate">Room {room.unitNumber}</span>
                          </div>
                        </td>

                        {dayHeaders.map((h) => {
                          const spanInfo = roomBookingSpans[room.id]?.[h.date];

                          // If this cell is covered by an earlier check-in span, skip rendering <td>
                          if (spanInfo && 'covered' in spanInfo && spanInfo.covered) {
                            return null;
                          }

                          // If this cell is the start of a multi-night reservation
                          if (spanInfo && 'isStart' in spanInfo && spanInfo.isStart) {
                            const { booking, spanDays } = spanInfo;
                            const isDirect = booking.channel === 'direct';
                            const formattedGuestName = formatGuestName(booking.guestName);
                            const formattedStatus = formatStatusLabel(booking.status);

                            return (
                              <td
                                key={h.date}
                                colSpan={spanDays}
                                className="p-1 border-b border-r border-[var(--border-subtle)] align-middle z-10"
                              >
                                <button
                                  onClick={() => onBookingClick?.(booking)}
                                  className="w-full h-10 rounded-full px-3 bg-[var(--fill-accent)] hover:bg-[var(--fill-accent-hover)] text-[var(--text-accent)] text-xs font-bold flex items-center justify-between gap-2 border border-blue-600 cursor-pointer shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 group"
                                  title={`${formattedGuestName} (${booking.channel.toUpperCase()}) | ${booking.checkIn} to ${booking.checkOut}`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                                    {/* Channel Origin Indicator: Rounded Square shape to distinguish from circular status dots */}
                                    <span
                                      className={`w-2.5 h-2.5 rounded-[2px] shrink-0 ${
                                        isDirect ? 'bg-[var(--channel-direct)]' : 'bg-[var(--channel-ota)]'
                                      }`}
                                      title={`Source Channel: ${booking.channel.toUpperCase()}`}
                                    />
                                    <span className="truncate font-extrabold">{formattedGuestName}</span>
                                  </div>

                                  {/* Normalized Status Badge (Sentence Case, e.g. "Checked in", "Confirmed") */}
                                  <span className="text-[10px] font-semibold opacity-90 shrink-0 bg-white/20 px-2 py-0.5 rounded-full">
                                    {formattedStatus}
                                  </span>
                                </button>
                              </td>
                            );
                          }

                          // Unbooked / Available Cell
                          return (
                            <td
                              key={h.date}
                              className="p-1 border-b border-r border-[var(--border-subtle)] text-center align-middle"
                            >
                              <button
                                onClick={() => onCellClick?.(room.id, h.date)}
                                className="w-full h-10 rounded-lg bg-[var(--bg-available)] hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-[var(--text-available)] text-[11px] font-bold flex items-center justify-center gap-1 border border-[var(--border-available)] cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[var(--text-available)] group"
                                title="Click to create a new reservation"
                              >
                                <span>Available</span>
                                <PlusCircle className="w-3 h-3 text-[var(--text-available)] opacity-70 group-hover:scale-110 transition-transform" />
                              </button>
                            </td>
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
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   6. MOCK DATASET FOR DEMO & INTEGRATION TESTING
   ══════════════════════════════════════════════════════════════════════════ */
export const mockDates = [
  '2026-08-06',
  '2026-08-07',
  '2026-08-08',
  '2026-08-09',
  '2026-08-10',
  '2026-08-11',
  '2026-08-12',
  '2026-08-13',
  '2026-08-14',
  '2026-08-15',
  '2026-08-16',
  '2026-08-17',
  '2026-08-18',
  '2026-08-19',
];

export const mockRoomTypes: RoomType[] = [
  {
    id: 'rt-exec-suite',
    name: 'Executive Suite',
    totalUnits: 3,
    rooms: [
      { id: 'room-101', roomTypeId: 'rt-exec-suite', unitNumber: '101' },
      { id: 'room-102', roomTypeId: 'rt-exec-suite', unitNumber: '102' },
      { id: 'room-103', roomTypeId: 'rt-exec-suite', unitNumber: '103' },
    ],
  },
  {
    id: 'rt-deluxe-ocean',
    name: 'Deluxe Ocean View',
    totalUnits: 3,
    rooms: [
      { id: 'room-201', roomTypeId: 'rt-deluxe-ocean', unitNumber: '201' },
      { id: 'room-202', roomTypeId: 'rt-deluxe-ocean', unitNumber: '202' },
      { id: 'room-203', roomTypeId: 'rt-deluxe-ocean', unitNumber: '203' },
    ],
  },
];

export const mockRawBookings: RawBooking[] = [
  {
    id: 'b-1',
    roomId: 'room-101',
    roomTypeId: 'rt-exec-suite',
    guestName: 'asif mohamed',
    checkIn: '2026-08-06',
    checkOut: '2026-08-08',
    channel: 'direct',
    status: 'CHECKED_IN',
    guestCount: 2,
  },
  {
    id: 'b-2',
    roomId: 'room-102',
    roomTypeId: 'rt-exec-suite',
    guestName: 'sophia martinez & family',
    checkIn: '2026-08-06',
    checkOut: '2026-08-10',
    channel: 'ota',
    status: 'CONFIRMED',
    guestCount: 4,
  },
  {
    id: 'b-3',
    roomId: 'room-103',
    roomTypeId: 'rt-exec-suite',
    guestName: 'niyaf',
    checkIn: '2026-08-06',
    checkOut: '2026-08-09',
    channel: 'direct',
    status: 'CONFIRMED',
    guestCount: 1,
  },
  {
    id: 'b-4',
    roomId: 'room-201',
    roomTypeId: 'rt-deluxe-ocean',
    guestName: 'niyaf ahmed',
    checkIn: '2026-08-06',
    checkOut: '2026-08-08',
    channel: 'direct',
    status: 'CONFIRMED',
    guestCount: 2,
  },
];
