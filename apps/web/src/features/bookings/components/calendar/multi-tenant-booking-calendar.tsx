'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import {
  ChevronDown,
  BedDouble,
  Calendar as CalendarIcon,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  SlidersHorizontal,
  X,
  CalendarDays,
  Wrench,
  Ban,
  FileText,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════════
   1. UTILITY HELPERS
   ══════════════════════════════════════════════════════════════════════════ */

export function formatGuestName(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ''))
    .join(' ');
}

export function formatStatusLabel(status: string): string {
  if (!status) return '';
  const cleaned = status.trim().toLowerCase().replace(/_/g, ' ');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

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
  channel: 'direct' | 'ota' | string;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'pending' | 'due_out' | 'maintenance' | 'blocked' | string;
  guestCount?: number;
  unitNumber?: string;
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
  level?: string;
}

export interface AvailabilityActionMenuState {
  type: 'category' | 'room';
  title: string;
  subtitle?: string;
  date: string;
  formattedDate: string;
  roomTypeId: string;
  roomUnitId?: string;
  unitNumber?: string;
  available: number;
  booked: number;
  total: number;
  bookingId?: string;
  bookingStatus?: string;
  targetRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface MultiTenantBookingCalendarProps {
  dates: string[];     // Array of ISO date strings YYYY-MM-DD
  todayDate: string;  // Today's date YYYY-MM-DD
  roomTypes: RoomType[];
  rawBookings: RawBooking[];
  occupancyData?: Record<string, Record<string, { booked: number; total: number; outOfOrder: number; available: number; hasConflict: boolean }>>;
  onBookingClick?: (booking: RawBooking) => void;
  onCellClick?: (roomIdOrTypeId: string, date: string) => void;
  onAddRoomClick?: (roomTypeId: string) => void;
  themeConfig?: Record<string, string>;
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
  onAddRoomClick,
  themeConfig,
}: MultiTenantBookingCalendarProps) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation();

  // Local dynamic bookings state (allows dynamic real-time Hold / Maintenance / Unblock changes)
  const [localBookings, setLocalBookings] = useState<RawBooking[]>(rawBookings);

  useEffect(() => {
    setLocalBookings(rawBookings);
  }, [rawBookings]);
  
  // Initially expand all categories so user sees all rooms immediately
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    roomTypes.forEach((rt) => {
      initial[rt.id] = true;
    });
    return initial;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50); // 25, 50, 100

  // Unified contextual availability action menu state
  const [actionMenu, setActionMenu] = useState<AvailabilityActionMenuState | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Close action menu on escape or outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActionMenu(null);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setActionMenu(null);
      }
    };

    if (actionMenu) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionMenu]);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllCategories = () => {
    const allExpanded = roomTypes.every((rt) => expandedCategories[rt.id]);
    const nextState: Record<string, boolean> = {};
    roomTypes.forEach((rt) => {
      nextState[rt.id] = !allExpanded;
    });
    setExpandedCategories(nextState);
  };

  /* ── Pre-process Date Lookups & Day Headers ────────────────────────── */
  const dayHeaders = useMemo(() => {
    return dates.map((dateStr) => {
      const d = new Date(`${dateStr}T00:00:00.000Z`);
      const dayName = d.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' });
      const dayNum = d.getUTCDate();
      const monthShort = d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short' });
      const isToday = dateStr === todayDate;
      const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
      return { date: dateStr, dayName, dayNum, monthShort, isToday, isWeekend };
    });
  }, [dates, todayDate]);

  const cleanDate = (d: string) => (d ? String(d).split('T')[0] : '');

  /* ── Compute Aggregate Occupancy Map per (roomTypeId, date) from localBookings ── */
  const aggregateOccupancy = useMemo(() => {
    const map: Record<string, Record<string, { bookedCount: number; guests: number; bookings: RawBooking[] }>> = {};

    for (const rt of roomTypes) {
      map[rt.id] = {};
      for (const dStr of dates) {
        // Find all bookings/holds/maintenance active on this specific date for this category
        const matchingBookingsForDate = localBookings.filter((b) => {
          const inStr = cleanDate(b.checkIn);
          const outStr = cleanDate(b.checkOut);
          if (!inStr) return false;

          const isDateActive = outStr && inStr !== outStr
            ? dStr >= inStr && dStr < outStr
            : dStr === inStr;

          if (!isDateActive) return false;

          const belongsToCategory = b.roomTypeId === rt.id;
          const belongsToRoom = rt.rooms.some(
            (r) =>
              r.id === b.roomId ||
              r.unitNumber === b.roomId ||
              String(r.unitNumber) === String(b.unitNumber) ||
              String(r.id) === String(b.unitNumber)
          );

          return belongsToCategory || belongsToRoom;
        });

        // Count unique physical rooms occupied on this date
        const occupiedRoomIds = new Set<string>();
        let guestCount = 0;

        matchingBookingsForDate.forEach((b) => {
          const matchedRoom = rt.rooms.find(
            (r) =>
              r.id === b.roomId ||
              r.unitNumber === b.roomId ||
              String(r.unitNumber) === String(b.unitNumber)
          );
          if (matchedRoom) {
            occupiedRoomIds.add(matchedRoom.id);
          } else {
            occupiedRoomIds.add(b.id);
          }
          guestCount += b.guestCount || 1;
        });

        map[rt.id][dStr] = {
          bookedCount: occupiedRoomIds.size,
          guests: guestCount,
          bookings: matchingBookingsForDate,
        };
      }
    }

    return map;
  }, [roomTypes, dates, localBookings]);

  /* ── Compute Continuous Multi-Night Booking Spans per Room ─────────── */
  const roomBookingSpans = useMemo(() => {
    const map: Record<string, Record<string, { booking: RawBooking; spanDays: number; isStart: boolean } | { covered: boolean }>> = {};

    for (const rt of roomTypes) {
      const categoryBookings = localBookings.filter(
        (b) => b.roomTypeId === rt.id || (!b.roomTypeId && rt.id === roomTypes[0]?.id)
      );

      rt.rooms.forEach((room, roomIdx) => {
        map[room.id] = {};
        
        let roomBookings = categoryBookings.filter((b) => {
          return (
            b.roomId === room.id ||
            b.roomId === room.unitNumber ||
            String(b.roomId) === String(room.unitNumber)
          );
        });

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

          if (startIndex === -1 && dates[0] && inStr < dates[0] && outStr > dates[0]) {
            startIndex = 0;
          }

          if (startIndex !== -1) {
            const actualEnd = endIndex !== -1 ? endIndex : dates.length;
            const spanDays = Math.max(1, actualEnd - startIndex);

            map[room.id][dates[startIndex]] = { booking: b, spanDays, isStart: true };

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
  }, [roomTypes, dates, localBookings]);

  /* ── Filtered Room Types via Search Query ──────────────────────────── */
  const filteredRoomTypes = useMemo(() => {
    if (!searchQuery.trim()) return roomTypes;
    const q = searchQuery.toLowerCase().trim();
    return roomTypes
      .map((rt) => {
        const matchesCategory = rt.name.toLowerCase().includes(q);
        const matchingRooms = rt.rooms.filter((r) => r.unitNumber.toLowerCase().includes(q));

        if (matchesCategory) return rt;
        if (matchingRooms.length > 0) {
          return { ...rt, rooms: matchingRooms };
        }
        return null;
      })
      .filter((rt): rt is RoomType => rt !== null);
  }, [roomTypes, searchQuery]);

  /* ── Total Room Count & Flattened Pagination ───────────────────────── */
  const totalPhysicalRooms = useMemo(() => {
    return filteredRoomTypes.reduce((acc, rt) => acc + (rt.rooms.length || rt.totalUnits || 0), 0);
  }, [filteredRoomTypes]);

  const paginatedRoomTypes = useMemo(() => {
    if (pageSize >= 999 || totalPhysicalRooms <= pageSize) {
      return filteredRoomTypes;
    }

    let roomCounter = 0;
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;

    const result: RoomType[] = [];

    for (const rt of filteredRoomTypes) {
      const rtRoomCount = rt.rooms.length || 1;
      const rtStart = roomCounter;
      const rtEnd = roomCounter + rtRoomCount;
      roomCounter += rtRoomCount;

      if (rtEnd > startIdx && rtStart < endIdx) {
        const sliceStart = Math.max(0, startIdx - rtStart);
        const sliceEnd = Math.min(rt.rooms.length, endIdx - rtStart);
        const pagedRooms = rt.rooms.slice(sliceStart, sliceEnd);

        result.push({
          ...rt,
          rooms: pagedRooms,
        });
      }
    }

    return result;
  }, [filteredRoomTypes, currentPage, pageSize, totalPhysicalRooms]);

  const totalPages = Math.max(1, Math.ceil(totalPhysicalRooms / pageSize));

  /* ── Helper for Booking Pill Styling Matching Reference ───────────── */
  const getBookingTileStyle = (booking: RawBooking) => {
    const st = (booking.status || '').toUpperCase();
    const ch = (booking.channel || '').toUpperCase();

    if (st === 'CHECKED_IN') {
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200',
        dot: 'bg-blue-600',
        label: 'Checked-in',
      };
    }
    if (st === 'DUE_OUT') {
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200',
        dot: 'bg-rose-600',
        label: 'Due Out',
      };
    }
    if (st === 'MAINTENANCE' || st === 'OUT_OF_ORDER') {
      return {
        bg: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300',
        dot: 'bg-slate-500',
        label: 'Maintenance',
      };
    }
    if (st === 'BLOCKED' || st === 'HOLD' || st === 'ROOM_HOLD') {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200',
        dot: 'bg-amber-500',
        label: 'On Hold / Blocked',
      };
    }
    if (ch.includes('OTA') || ch.includes('BOOKING') || ch.includes('AGODA')) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200',
        dot: 'bg-amber-500',
        label: 'OTA Booking',
      };
    }
    if (ch.includes('CHANNEL')) {
      return {
        bg: 'bg-purple-50 dark:bg-purple-950/80 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200',
        dot: 'bg-purple-600',
        label: 'Channel Booking',
      };
    }
    // Default confirmed pre-stay
    return {
      bg: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
      dot: 'bg-emerald-600',
      label: 'Confirmed',
    };
  };

  /* ── Open Contextual Action Menu for Category Availability ────────── */
  const handleCategorySummaryClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    rt: RoomType,
    dateStr: string,
    avail: number,
    booked: number,
    total: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    const formattedDate = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

    setActionMenu({
      type: 'category',
      title: rt.name,
      subtitle: rt.level || 'Category',
      date: dateStr,
      formattedDate,
      roomTypeId: rt.id,
      available: avail,
      booked,
      total,
      targetRect: {
        top: rect.bottom + 6,
        left: Math.max(16, Math.min(window.innerWidth - 270, rect.left - 60)),
        width: rect.width,
        height: rect.height,
      },
    });
  };

  /* ── Open Contextual Action Menu for Room Unit Availability ───────── */
  const handleRoomUnitClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    rt: RoomType,
    room: RoomUnit,
    dateStr: string
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    const formattedDate = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

    setActionMenu({
      type: 'room',
      title: `Room ${room.unitNumber}`,
      subtitle: rt.name,
      date: dateStr,
      formattedDate,
      roomTypeId: rt.id,
      roomUnitId: room.id,
      unitNumber: room.unitNumber,
      available: 1,
      booked: 0,
      total: 1,
      targetRect: {
        top: rect.bottom + 6,
        left: Math.max(16, Math.min(window.innerWidth - 270, rect.left - 60)),
        width: rect.width,
        height: rect.height,
      },
    });
  };

  /* ── Click Handler on Booking Tile (Opens Action Menu for Hold/Maintenance, or Details Drawer) ── */
  const handleBookingTileClick = (e: React.MouseEvent<HTMLButtonElement>, booking: RawBooking) => {
    const st = (booking.status || '').toUpperCase();
    if (st === 'BLOCKED' || st === 'HOLD' || st === 'MAINTENANCE' || st === 'OUT_OF_ORDER') {
      const rect = e.currentTarget.getBoundingClientRect();
      const d = new Date(`${booking.checkIn}T00:00:00.000Z`);
      const formattedDate = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
      const rt = roomTypes.find((r) => r.id === booking.roomTypeId);

      setActionMenu({
        type: 'room',
        title: booking.guestName || `Room ${booking.unitNumber || booking.roomId}`,
        subtitle: st === 'BLOCKED' || st === 'HOLD' ? 'On Hold / Blocked' : 'Maintenance / Out of Order',
        date: booking.checkIn,
        formattedDate,
        roomTypeId: booking.roomTypeId,
        roomUnitId: booking.roomId,
        unitNumber: booking.unitNumber || booking.roomId,
        available: 0,
        booked: 1,
        total: 1,
        bookingId: booking.id,
        bookingStatus: st,
        targetRect: {
          top: rect.bottom + 6,
          left: Math.max(16, Math.min(window.innerWidth - 270, rect.left - 60)),
          width: rect.width,
          height: rect.height,
        },
      });
      return;
    }

    onBookingClick?.(booking);
  };

  /* ── Actions: Block Room / Hold ── */
  const handleBlockRoomAction = () => {
    if (!actionMenu) return;

    // Determine target room unit
    let targetRoomId = actionMenu.roomUnitId;
    let targetUnitNumber = actionMenu.unitNumber;

    if (!targetRoomId) {
      // Pick first available room unit for category hold
      const rt = roomTypes.find((r) => r.id === actionMenu.roomTypeId);
      if (rt && rt.rooms.length > 0) {
        const bookedRoomIds = localBookings
          .filter((b) => b.roomTypeId === rt.id && b.checkIn === actionMenu.date)
          .map((b) => b.roomId);
        const availRoom = rt.rooms.find((r) => !bookedRoomIds.includes(r.id) && !bookedRoomIds.includes(r.unitNumber));
        if (availRoom) {
          targetRoomId = availRoom.id;
          targetUnitNumber = availRoom.unitNumber;
        } else {
          toast.error(`All rooms in ${rt.name} are already booked for this date.`, 'Cannot Place on Hold');
          setActionMenu(null);
          return;
        }
      }
    }

    if (!targetRoomId) {
      toast.error('No room units configured to block.', 'Block Failed');
      setActionMenu(null);
      return;
    }

    const newHold: RawBooking = {
      id: `hold-${targetRoomId}-${actionMenu.date}-${Date.now()}`,
      roomId: targetRoomId,
      unitNumber: targetUnitNumber,
      roomTypeId: actionMenu.roomTypeId,
      guestName: `Room ${targetUnitNumber || ''} (Hold)`,
      checkIn: actionMenu.date,
      checkOut: addDays(actionMenu.date, 1),
      channel: 'direct',
      status: 'BLOCKED',
    };

    setLocalBookings((prev) => [
      ...prev.filter((b) => !(b.roomId === targetRoomId && b.checkIn === actionMenu.date)),
      newHold,
    ]);

    const targetName = targetUnitNumber ? `Room ${targetUnitNumber}` : actionMenu.title;
    toast.success(`${targetName} is now placed on hold for ${actionMenu.formattedDate}.`, 'Room Blocked / Held');
    setActionMenu(null);
  };

  /* ── Actions: Mark for Maintenance ── */
  const handleMaintenanceAction = () => {
    if (!actionMenu) return;

    let targetRoomId = actionMenu.roomUnitId;
    let targetUnitNumber = actionMenu.unitNumber;

    if (!targetRoomId) {
      const rt = roomTypes.find((r) => r.id === actionMenu.roomTypeId);
      if (rt && rt.rooms.length > 0) {
        const bookedRoomIds = localBookings
          .filter((b) => b.roomTypeId === rt.id && b.checkIn === actionMenu.date)
          .map((b) => b.roomId);
        const availRoom = rt.rooms.find((r) => !bookedRoomIds.includes(r.id) && !bookedRoomIds.includes(r.unitNumber));
        if (availRoom) {
          targetRoomId = availRoom.id;
          targetUnitNumber = availRoom.unitNumber;
        } else {
          toast.error(`All rooms in ${rt.name} are already booked for this date.`, 'Cannot Mark for Maintenance');
          setActionMenu(null);
          return;
        }
      }
    }

    if (!targetRoomId) {
      toast.error('No room units configured for maintenance.', 'Action Failed');
      setActionMenu(null);
      return;
    }

    const newMaint: RawBooking = {
      id: `maint-${targetRoomId}-${actionMenu.date}-${Date.now()}`,
      roomId: targetRoomId,
      unitNumber: targetUnitNumber,
      roomTypeId: actionMenu.roomTypeId,
      guestName: `Room ${targetUnitNumber || ''} (Maintenance)`,
      checkIn: actionMenu.date,
      checkOut: addDays(actionMenu.date, 1),
      channel: 'direct',
      status: 'MAINTENANCE',
    };

    setLocalBookings((prev) => [
      ...prev.filter((b) => !(b.roomId === targetRoomId && b.checkIn === actionMenu.date)),
      newMaint,
    ]);

    const targetName = targetUnitNumber ? `Room ${targetUnitNumber}` : actionMenu.title;
    toast.success(`${targetName} is now marked for maintenance on ${actionMenu.formattedDate}.`, 'Maintenance Flagged');
    setActionMenu(null);
  };

  /* ── Actions: Release Hold / Make Available ── */
  const handleReleaseHoldAction = () => {
    if (!actionMenu?.bookingId) return;
    setLocalBookings((prev) => prev.filter((b) => b.id !== actionMenu.bookingId));
    toast.success(`Hold released for ${actionMenu.title}. Room is now available.`, 'Hold Released');
    setActionMenu(null);
  };

  /* ── Actions: Complete Maintenance / Make Available ── */
  const handleCompleteMaintenanceAction = () => {
    if (!actionMenu?.bookingId) return;
    setLocalBookings((prev) => prev.filter((b) => b.id !== actionMenu.bookingId));
    toast.success(`Maintenance complete for ${actionMenu.title}. Room is now clean and available.`, 'Room Available');
    setActionMenu(null);
  };

  return (
    <div
      style={themeConfig as React.CSSProperties}
      className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col relative"
    >
      {/* ══════════════════════════════════════════════════════════════════
         4. TOP STATUS SWATCH LEGEND & SEARCH STRIP (Matching Reference)
         ══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-850/90 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap text-xs">
        {/* Left Side: Status Dot Legend */}
        <div className="flex items-center gap-3.5 flex-wrap text-[11px] font-medium text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
            <span>Available</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
            <span>Checked-in</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-800 dark:bg-slate-300 shrink-0" />
            <span>Confirmed</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>Due Out (100% Occupied)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>On Hold / Blocked</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
            <span>Maintenance</span>
          </div>
        </div>

        {/* Right Side: Search + Filter Controls */}
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room or category..."
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <button
            onClick={toggleAllCategories}
            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Filters & Toggle All"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
         5. DEDICATED SCROLLABLE TAPE CHART CONTAINER
         (Fixed height, smooth 2D scrolling, sticky room col & date header)
         ══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-auto max-h-[calc(100vh-320px)] min-h-[460px] scrollbar-thin">
        <table className="w-full border-collapse text-left border-spacing-0">
          {/* Sticky Header Row */}
          <thead className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800">
            <tr>
              {/* Sticky Top-Left Corner Cell: Room Category / Unit */}
              <th className="sticky left-0 top-0 z-40 bg-slate-50 dark:bg-slate-850 px-4 py-3 min-w-[220px] max-w-[220px] border-r border-b border-slate-200 dark:border-slate-800 font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                ROOM CATEGORY / UNIT
              </th>

              {/* Day Header Cells */}
              {dayHeaders.map((h) => (
                <th
                  key={h.date}
                  className={`px-2 py-2 text-center min-w-[85px] border-r border-slate-200/90 dark:border-slate-800 transition-colors ${
                    h.isToday
                      ? 'bg-emerald-50 dark:bg-emerald-950/60'
                      : h.isWeekend
                      ? 'bg-slate-100/50 dark:bg-slate-800/40'
                      : ''
                  }`}
                >
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {h.dayName}
                    </span>

                    {/* Today Accent Highlight */}
                    <span
                      className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                        h.isToday
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {h.dayNum}
                    </span>

                    <span className="text-[9px] text-slate-400 font-medium">
                      {h.monthShort}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedRoomTypes.length === 0 ? (
              <tr>
                <td
                  colSpan={dayHeaders.length + 1}
                  className="py-16 text-center text-slate-400 font-semibold text-xs"
                >
                  No room categories or rooms match your filter.
                </td>
              </tr>
            ) : (
              paginatedRoomTypes.map((rt) => {
                const isExpanded = !!expandedCategories[rt.id];

                return (
                  <React.Fragment key={rt.id}>
                    {/* ── 1. AGGREGATE ROOM CATEGORY SUMMARY ROW (3/3 Available Format) ── */}
                    <tr className="bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors group">
                      <td className="sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/80 dark:group-hover:bg-slate-850/60 z-20 px-4 py-3 border-b border-r border-slate-200/90 dark:border-slate-800 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] transition-colors">
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <BedDouble className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-bold text-xs truncate block text-slate-900 dark:text-white">
                                {rt.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium block truncate">
                                {rt.level || 'Level 1'} • {rt.totalUnits || rt.rooms.length} Rooms
                              </span>
                            </div>
                          </div>

                          {/* Expand/Collapse Chevron Button */}
                          <button
                            onClick={() => toggleCategory(rt.id)}
                            className="w-5 h-5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 transition-all cursor-pointer flex items-center justify-center shrink-0"
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180 text-emerald-600' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </td>

                      {/* ── Category Availability Summary Cells (Opens Action Popover) ── */}
                      {dayHeaders.map((h) => {
                        const occ = aggregateOccupancy[rt.id]?.[h.date] || { bookedCount: 0, guests: 0 };
                        const booked = occ.bookedCount;
                        const total = rt.totalUnits || rt.rooms.length || 1;
                        const avail = Math.max(0, total - booked);

                        // Visual styling based on availability ratio
                        let cellStyle = {
                          container: 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100/50 hover:border-emerald-200',
                          countColor: 'text-[#0B6E4F] dark:text-emerald-400',
                          labelColor: 'text-[#0B6E4F]/80 dark:text-emerald-400/80',
                          label: 'Available',
                        };

                        if (avail === 0) {
                          cellStyle = {
                            container: 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-900/30 hover:bg-rose-100/50 hover:border-rose-300',
                            countColor: 'text-rose-700 dark:text-rose-400',
                            labelColor: 'text-rose-700/80 dark:text-rose-400/80',
                            label: 'Available',
                          };
                        } else if (avail === 1 && total > 1) {
                          cellStyle = {
                            container: 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/30 hover:bg-amber-100/50 hover:border-amber-300',
                            countColor: 'text-amber-800 dark:text-amber-400',
                            labelColor: 'text-amber-800/80 dark:text-amber-400/80',
                            label: 'Available',
                          };
                        } else if (avail < total) {
                          cellStyle = {
                            container: 'bg-emerald-50/60 dark:bg-emerald-950/25 border-emerald-200/60 dark:border-emerald-900/40 hover:bg-emerald-100/60 hover:border-emerald-300',
                            countColor: 'text-[#0B6E4F] dark:text-emerald-400',
                            labelColor: 'text-[#0B6E4F]/80 dark:text-emerald-400/80',
                            label: 'Available',
                          };
                        }

                        return (
                          <td
                            key={h.date}
                            className="p-1 border-b border-r border-slate-100 dark:border-slate-800 text-center align-middle"
                          >
                            <button
                              type="button"
                              onClick={(e) =>
                                handleCategorySummaryClick(e, rt, h.date, avail, booked, total)
                              }
                              className={`w-full h-10 rounded-lg p-1 flex flex-col items-center justify-center transition-all border cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500/30 ${cellStyle.container}`}
                              title={`Click for availability options: ${rt.name} on ${h.date}`}
                            >
                              {/* Line 1: Available / Total (e.g. 3/3, 2/3, 1/3, 0/3) */}
                              <span className={`text-[12px] font-black leading-tight tracking-tight ${cellStyle.countColor}`}>
                                {avail}/{total}
                              </span>

                              {/* Line 2: Available label */}
                              <span className={`text-[10px] font-medium leading-none mt-0.5 ${cellStyle.labelColor}`}>
                                {cellStyle.label}
                              </span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>

                    {/* ── 2. INDIVIDUAL ROOM UNIT ROWS (When Expanded) ── */}
                    {isExpanded && (
                      <>
                        {rt.rooms.map((room) => (
                          <tr
                            key={room.id}
                            className="bg-slate-50/40 dark:bg-slate-850/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            {/* Sticky Room Number Column with Bullet Dot */}
                            <td className="sticky left-0 bg-slate-50 dark:bg-slate-850 z-20 pl-7 pr-4 py-2 border-b border-r border-slate-200/90 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                              <div className="flex items-center gap-2 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                                <span className="truncate">{room.unitNumber}</span>
                              </div>
                            </td>

                            {dayHeaders.map((h) => {
                              const spanInfo = roomBookingSpans[room.id]?.[h.date];

                              // Skip rendering if covered by a multi-night span
                              if (spanInfo && 'covered' in spanInfo && spanInfo.covered) {
                                return null;
                              }

                              // If this cell is the start of a reservation (Confirmed, Checked-in, Due Out, Maintenance, Blocked, etc.)
                              if (spanInfo && 'isStart' in spanInfo && spanInfo.isStart) {
                                const { booking, spanDays } = spanInfo;
                                const formattedGuestName = formatGuestName(booking.guestName);
                                const tileStyle = getBookingTileStyle(booking);

                                return (
                                  <td
                                    key={h.date}
                                    colSpan={spanDays}
                                    className="p-1 border-b border-r border-slate-100 dark:border-slate-800 align-middle z-10"
                                  >
                                    <button
                                      onClick={(e) => handleBookingTileClick(e, booking)}
                                      className={`w-full h-9 rounded-lg px-2 border text-xs font-bold flex items-center justify-between gap-1.5 cursor-pointer shadow-2xs transition-all hover:brightness-95 ${tileStyle.bg}`}
                                      title={`${formattedGuestName} | ${booking.checkIn} to ${booking.checkOut}`}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tileStyle.dot}`} />
                                        <div className="text-left min-w-0">
                                          <div className="text-[9px] font-bold opacity-80 leading-none">
                                            {tileStyle.label}
                                          </div>
                                          <div className="truncate font-bold text-[11px] leading-tight">
                                            {formattedGuestName}
                                          </div>
                                        </div>
                                      </div>
                                    </button>
                                  </td>
                                );
                              }

                              // Available Room Cell (Opens Contextual Action Popover)
                              return (
                                <td
                                  key={h.date}
                                  className="p-1 border-b border-r border-slate-100 dark:border-slate-800 text-center align-middle"
                                >
                                  <button
                                    onClick={(e) => handleRoomUnitClick(e, rt, room, h.date)}
                                    className="w-full h-9 rounded-lg px-2 flex items-center justify-between bg-emerald-50/50 hover:bg-emerald-100/90 dark:bg-emerald-950/25 dark:hover:bg-emerald-900/50 text-[#0B6E4F] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 hover:border-emerald-300 text-xs font-semibold cursor-pointer transition-all group shadow-2xs hover:shadow-xs active:scale-98"
                                    title={`Click for options: Room ${room.unitNumber} on ${h.date}`}
                                  >
                                    <span className="text-[11px] font-bold text-[#0B6E4F] dark:text-emerald-400">
                                      Available
                                    </span>
                                    <div className="w-4 h-4 rounded-md bg-emerald-100/70 dark:bg-emerald-900/50 group-hover:bg-emerald-600 group-hover:text-white text-[#0B6E4F] dark:text-emerald-300 flex items-center justify-center transition-all shrink-0">
                                      <Plus className="w-2.5 h-2.5 transition-transform group-hover:scale-110" />
                                    </div>
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}

                        {/* + Add Room Row under Category */}
                        <tr className="bg-slate-50/20 dark:bg-slate-850/20 border-b border-slate-100 dark:border-slate-800">
                          <td className="sticky left-0 bg-white dark:bg-slate-900 z-20 pl-7 pr-4 py-2 border-r border-slate-200/90 dark:border-slate-800">
                            <button
                              onClick={() => onAddRoomClick?.(rt.id)}
                              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Room</span>
                            </button>
                          </td>
                          <td colSpan={dayHeaders.length} className="border-r border-slate-100 dark:border-slate-800" />
                        </tr>
                      </>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
         6. BOTTOM FOOTER PAGINATION & PROPERTY TIME BAR
         ══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 py-2.5 bg-slate-50/90 dark:bg-slate-850/90 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap text-xs text-slate-500 dark:text-slate-400 font-medium">
        {/* Left: Property timezone indicator */}
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>All times are in local property time</span>
        </div>

        {/* Right: Room Pagination & Page Size Selector */}
        <div className="flex items-center gap-3">
          <span>
            Showing{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min((currentPage - 1) * pageSize + 1, totalPhysicalRooms)} to{' '}
              {Math.min(currentPage * pageSize, totalPhysicalRooms)}
            </strong>{' '}
            of <strong className="text-slate-800 dark:text-slate-200">{totalPhysicalRooms}</strong> rooms
          </span>

          {/* Page Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return (
                  <span key={pageNum} className="text-slate-400 px-0.5">
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
              aria-label="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Page Size Selector */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none"
          >
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
            <option value={999}>All rooms</option>
          </select>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
         7. CONTEXTUAL AVAILABILITY INFORMATION & DYNAMIC ACTION POPOVER
         ══════════════════════════════════════════════════════════════════ */}
      {actionMenu && (
        <div
          ref={actionMenuRef}
          style={{
            position: 'fixed',
            top: `${Math.min(window.innerHeight - 340, Math.max(16, actionMenu.targetRect.top))}px`,
            left: `${Math.min(window.innerWidth - 270, Math.max(16, actionMenu.targetRect.left))}px`,
            zIndex: 9999,
          }}
          className="w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 flex flex-col"
        >
          {/* Header */}
          <div className="p-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-850/90">
            <div className="min-w-0 pr-2">
              <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate">
                {actionMenu.title}
              </h4>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
                {actionMenu.formattedDate} {actionMenu.subtitle ? `• ${actionMenu.subtitle}` : ''}
              </p>
            </div>
            <button
              onClick={() => setActionMenu(null)}
              className="w-5 h-5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Availability Breakdown Information */}
          <div className="p-3 bg-emerald-50/30 dark:bg-emerald-950/15 border-b border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#0B6E4F] dark:text-emerald-400 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span>Status</span>
              </div>
              <span className="font-extrabold text-[#0B6E4F] dark:text-emerald-300 tabular-nums">
                {actionMenu.bookingStatus
                  ? formatStatusLabel(actionMenu.bookingStatus)
                  : `${actionMenu.available} Available`}
              </span>
            </div>

            {actionMenu.type === 'category' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-semibold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  <span>Booked / Blocked</span>
                </div>
                <span className="font-bold text-blue-800 dark:text-blue-300 tabular-nums">
                  {actionMenu.booked}
                </span>
              </div>
            )}

            {actionMenu.type === 'category' && (
              <div className="pt-1.5 border-t border-emerald-100/60 dark:border-emerald-900/30 flex items-center justify-between font-bold text-slate-600 dark:text-slate-400 text-[11px]">
                <span>Total Capacity</span>
                <span className="font-black text-slate-900 dark:text-white tabular-nums">
                  {actionMenu.total}
                </span>
              </div>
            )}
          </div>

          {/* Action Menu List */}
          <div className="p-2 space-y-1 bg-white dark:bg-slate-900">
            <p className="px-2 pt-1 pb-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Actions
            </p>

            {/* If currently on Hold / Blocked -> Show Release Hold button */}
            {actionMenu.bookingStatus === 'BLOCKED' || actionMenu.bookingStatus === 'HOLD' ? (
              <button
                onClick={handleReleaseHoldAction}
                className="w-full px-2.5 py-2 rounded-lg text-left text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center gap-2 transition-all cursor-pointer group"
              >
                <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <span>Release Hold (Make Available)</span>
              </button>
            ) : null}

            {/* If currently on Maintenance -> Show Complete Maintenance button */}
            {actionMenu.bookingStatus === 'MAINTENANCE' || actionMenu.bookingStatus === 'OUT_OF_ORDER' ? (
              <button
                onClick={handleCompleteMaintenanceAction}
                className="w-full px-2.5 py-2 rounded-lg text-left text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center gap-2 transition-all cursor-pointer group"
              >
                <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <span>Mark Ready (Make Available)</span>
              </button>
            ) : null}

            {/* 1. Create Booking (Explicit Action) */}
            <button
              onClick={() => {
                const nextDay = addDays(actionMenu.date, 1);
                const unitParams = actionMenu.unitNumber
                  ? `&roomUnitId=${actionMenu.roomUnitId}&unitNumber=${actionMenu.unitNumber}`
                  : '';
                setActionMenu(null);
                router.push(
                  `/bookings/new?checkInDate=${actionMenu.date}&checkOutDate=${nextDay}&roomTypeId=${actionMenu.roomTypeId}${unitParams}`
                );
              }}
              className="w-full px-2.5 py-2 rounded-lg text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-2 transition-all cursor-pointer group"
            >
              <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Plus className="w-3 h-3" />
              </div>
              <span>Create Booking</span>
            </button>

            {/* 2. View Bookings */}
            <button
              onClick={() => {
                setActionMenu(null);
                router.push(`/bookings?date=${actionMenu.date}`);
              }}
              className="w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-all cursor-pointer"
            >
              <CalendarDays className="w-4 h-4 text-slate-400" />
              <span>View Bookings</span>
            </button>

            {/* 3. Block Room / Hold (Only if not already blocked) */}
            {!actionMenu.bookingStatus && (
              <button
                onClick={handleBlockRoomAction}
                className="w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Ban className="w-4 h-4 text-amber-500" />
                <span>Block Room / Hold</span>
              </button>
            )}

            {/* 4. Mark for Maintenance (Only if not already maintenance) */}
            {!actionMenu.bookingStatus && (
              <button
                onClick={handleMaintenanceAction}
                className="w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-slate-400" />
                <span>Mark for Maintenance</span>
              </button>
            )}

            {/* 5. View Room Details */}
            <button
              onClick={() => {
                setActionMenu(null);
                router.push('/rooms');
              }}
              className="w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-all cursor-pointer"
            >
              <BedDouble className="w-4 h-4 text-slate-400" />
              <span>View Room Details</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
