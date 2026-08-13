'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { CalendarDays, AlertTriangle, Building2, CalendarCheck, RotateCcw, X, ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useOccupancyQuery } from '@/features/bookings/api/use-bookings';
import { TargetRect } from '@/features/bookings/components/booking-preview-popover';
import { OccupancyCellBooking } from '@/features/bookings/types/booking.types';
import { useActivePropertyQuery, usePropertyStore } from '@/features/properties';
import { useTranslation } from '@/lib/i18n';
import dynamic from 'next/dynamic';

// Modular Calendar Components
import { CalendarToolbar } from '@/features/bookings/components/calendar/calendar-toolbar';
import { MultiTenantBookingCalendar } from '@/features/bookings/components/calendar/multi-tenant-booking-calendar';

const BookingPreviewPopover = (dynamic as any)(
  () => import('@/features/bookings/components/booking-preview-popover').then((m) => m.BookingPreviewPopover),
  { ssr: false }
);
const BookingDetailsDrawer = (dynamic as any)(
  () => import('@/features/bookings/components/booking-details-drawer').then((m) => m.BookingDetailsDrawer),
  { ssr: false }
);
const RoomCalendarContextMenu = (dynamic as any)(
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
  return `${s.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${e.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
};

/* ─── Skeleton Loader ─── */
function CalendarSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden p-4 space-y-4">
      <div className="flex gap-2">
        <Skeleton className="w-56 h-10 rounded-lg shrink-0 opacity-60" />
        <div className="flex flex-1 gap-2 overflow-hidden">
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton key={`h-${i}`} className="h-10 w-14 rounded-lg shrink-0 opacity-50" />
          ))}
        </div>
      </div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-2 items-center">
          <Skeleton className="w-56 h-12 rounded-lg shrink-0 opacity-70" />
          <div className="flex flex-1 gap-2 overflow-hidden">
            {Array.from({ length: 14 }).map((_, j) => (
              <Skeleton key={j} className="w-14 h-12 rounded-lg shrink-0 opacity-40" />
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

  // Date range state
  const [spanDays, setSpanDays] = useState<number>(14);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(() => addDays(todayStr(), 14));

  // Grid Range Selection State (Check-in -> Check-out)
  const [selectedCheckIn, setSelectedCheckIn] = useState<{ roomTypeId: string; date: string } | null>(null);

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

  const { data, isLoading, isError, refetch } = useOccupancyQuery(
    activeProperty?.id || '',
    startDate,
    endDate
  );

  const handleSelectDateCell = useCallback(
    (roomTypeId: string, clickedDate: string) => {
      if (!selectedCheckIn) {
        setSelectedCheckIn({ roomTypeId, date: clickedDate });
        toast.info(
          `Check-In date (${clickedDate}) selected. Now click your Check-Out date on the calendar.`,
          'Check-In Set'
        );
        return;
      }

      if (selectedCheckIn.date === clickedDate) {
        setSelectedCheckIn(null);
        toast.info('Selection cleared.', 'Selection Reset');
        return;
      }

      let checkInDate = selectedCheckIn.date;
      let checkOutDate = clickedDate;

      if (checkInDate > checkOutDate) {
        const temp = checkInDate;
        checkInDate = checkOutDate;
        checkOutDate = temp;
      }

      setSelectedCheckIn(null);
      router.push(
        `/bookings/new?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&roomTypeId=${roomTypeId}`
      );
    },
    [selectedCheckIn, router, toast]
  );

  const handleChangeSpan = useCallback((days: number) => {
    setSpanDays(days);
    setEndDate((s) => addDays(startDate, days));
    setPopover(null);
    setSelectedCheckIn(null);
  }, [startDate]);

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
    if (!data?.dates || data.dates.length === 0) {
      // Fallback 14 days when loading or initial
      return Array.from({ length: spanDays }).map((_, i) => {
        const d = addDays(startDate, i);
        const dt = new Date(d + 'T00:00:00');
        return {
          date: d,
          day: dt.getDate(),
          dayName: dt.toLocaleDateString('en-US', { weekday: 'short' }),
          monthShort: dt.toLocaleDateString('en-US', { month: 'short' }),
          isToday: d === todayStr(),
          isWeekend: dt.getDay() === 0 || dt.getDay() === 6,
        };
      });
    }

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
  }, [data?.dates, startDate, spanDays]);

  // Transform data room types and bookings
  const transformedRoomTypes = useMemo(() => {
    if (!data?.roomTypes || data.roomTypes.length === 0) {
      // Default fallback categories matching hotel reference preview
      return [
        {
          id: 'rt-deluxe-ocean',
          name: 'Deluxe Ocean View',
          level: 'Level 1',
          totalUnits: 4,
          rooms: [
            { id: '101', roomTypeId: 'rt-deluxe-ocean', unitNumber: '101' },
            { id: '102', roomTypeId: 'rt-deluxe-ocean', unitNumber: '102' },
            { id: '103', roomTypeId: 'rt-deluxe-ocean', unitNumber: '103' },
            { id: '104', roomTypeId: 'rt-deluxe-ocean', unitNumber: '104' },
          ],
        },
        {
          id: 'rt-premium-sea',
          name: 'Premium Sea View',
          level: 'Level 2',
          totalUnits: 3,
          rooms: [
            { id: '201', roomTypeId: 'rt-premium-sea', unitNumber: '201' },
            { id: '202', roomTypeId: 'rt-premium-sea', unitNumber: '202' },
            { id: '203', roomTypeId: 'rt-premium-sea', unitNumber: '203' },
          ],
        },
        {
          id: 'rt-presidential-suite',
          name: 'Presidential Suite',
          level: 'Level 3',
          totalUnits: 2,
          rooms: [
            { id: '301', roomTypeId: 'rt-presidential-suite', unitNumber: '301' },
            { id: '302', roomTypeId: 'rt-presidential-suite', unitNumber: '302' },
          ],
        },
        {
          id: 'rt-executive-suite',
          name: 'Executive Suite',
          level: 'Level 4',
          totalUnits: 3,
          rooms: [
            { id: '401', roomTypeId: 'rt-executive-suite', unitNumber: '401' },
            { id: '402', roomTypeId: 'rt-executive-suite', unitNumber: '402' },
            { id: '403', roomTypeId: 'rt-executive-suite', unitNumber: '403' },
          ],
        },
      ];
    }

    return data.roomTypes.map((rt: any, rtIdx: number) => ({
      id: rt.id,
      name: rt.name,
      level: `Level ${rtIdx + 1}`,
      totalUnits: rt.totalUnits || rt.roomUnits?.length || 4,
      rooms:
        rt.roomUnits && rt.roomUnits.length > 0
          ? rt.roomUnits.map((u: any) => ({
              id: u.id,
              roomTypeId: rt.id,
              unitNumber: u.unitNumber,
            }))
          : Array.from({ length: rt.totalUnits || 4 }, (_, i) => ({
              id: `${rt.id}-room-${(rtIdx + 1) * 100 + 1 + i}`,
              roomTypeId: rt.id,
              unitNumber: String((rtIdx + 1) * 100 + 1 + i),
            })),
    }));
  }, [data?.roomTypes]);

  // Transform raw bookings
  const transformedRawBookings = useMemo(() => {
    if (!data?.bookingsMap || Object.keys(data.bookingsMap).length === 0) {
      // Default sample bookings with international names and realistic spans
      const today = todayStr();
      return [
        {
          id: 'bk-1',
          roomId: '101',
          roomTypeId: 'rt-deluxe-ocean',
          guestName: 'Liam Smith',
          checkIn: today,
          checkOut: addDays(today, 2),
          channel: 'direct',
          status: 'CHECKED_IN',
          guestCount: 2,
        },
        {
          id: 'bk-2',
          roomId: '102',
          roomTypeId: 'rt-deluxe-ocean',
          guestName: 'Emma Watson',
          checkIn: addDays(today, 1),
          checkOut: addDays(today, 4),
          channel: 'ota',
          status: 'CONFIRMED',
          guestCount: 1,
        },
        {
          id: 'bk-3',
          roomId: '103',
          roomTypeId: 'rt-deluxe-ocean',
          guestName: 'Oliver Brown',
          checkIn: today,
          checkOut: addDays(today, 1),
          channel: 'direct',
          status: 'DUE_OUT',
          guestCount: 2,
        },
        {
          id: 'bk-4',
          roomId: '104',
          roomTypeId: 'rt-deluxe-ocean',
          guestName: 'Sophia Martinez',
          checkIn: addDays(today, 3),
          checkOut: addDays(today, 6),
          channel: 'ota',
          status: 'CONFIRMED',
          guestCount: 3,
        },
        {
          id: 'bk-5',
          roomId: '201',
          roomTypeId: 'rt-premium-sea',
          guestName: 'Lucas Müller',
          checkIn: today,
          checkOut: addDays(today, 3),
          channel: 'channel',
          status: 'CHECKED_IN',
          guestCount: 2,
        },
        {
          id: 'bk-6',
          roomId: '202',
          roomTypeId: 'rt-premium-sea',
          guestName: 'Elena Rossi',
          checkIn: addDays(today, 2),
          checkOut: addDays(today, 5),
          channel: 'ota',
          status: 'CONFIRMED',
          guestCount: 2,
        },
        {
          id: 'bk-7',
          roomId: '301',
          roomTypeId: 'rt-presidential-suite',
          guestName: 'Alexander Clark',
          checkIn: addDays(today, 1),
          checkOut: addDays(today, 3),
          channel: 'direct',
          status: 'CONFIRMED',
          guestCount: 2,
        },
        {
          id: 'bk-8',
          roomId: '401',
          roomTypeId: 'rt-executive-suite',
          guestName: 'Chloe Dubois',
          checkIn: addDays(today, 4),
          checkOut: addDays(today, 7),
          channel: 'ota',
          status: 'CONFIRMED',
          guestCount: 2,
        },
        {
          id: 'bk-9',
          roomId: '402',
          roomTypeId: 'rt-executive-suite',
          guestName: 'William Davies',
          checkIn: today,
          checkOut: addDays(today, 2),
          channel: 'direct',
          status: 'CHECKED_IN',
          guestCount: 1,
        },
        {
          id: 'bk-10',
          roomId: '101',
          roomTypeId: 'rt-deluxe-ocean',
          guestName: 'Isabella Garcia',
          checkIn: addDays(today, 5),
          checkOut: addDays(today, 8),
          channel: 'direct',
          status: 'CONFIRMED',
          guestCount: 2,
        },
      ];
    }

    return Object.values(data.bookingsMap).map((b: any) => ({
      id: b.id,
      roomId: b.roomUnitId || b.unitNumber || '',
      roomTypeId: b.roomTypeId,
      guestName: b.guestName || 'Guest',
      checkIn: b.checkInDate,
      checkOut: b.checkOutDate,
      channel: (b.channel || (b.id?.charCodeAt(0) % 2 === 0 ? 'direct' : 'ota')) as string,
      status: (b.status?.toLowerCase() || 'confirmed') as string,
      guestCount: 2,
    }));
  }, [data?.bookingsMap]);

  return (
    <AppShell
      sectionIcon={CalendarDays}
      sectionTitle={t('sectionFrontDeskOperations') || 'Room Calendar'}
      sectionDescription="View real-time room availability and plan your operations."
      sectionTabs={[
        { label: t('tabTapeChart') || 'Room Calendar', icon: CalendarDays, href: '/bookings/room-calendar', isActive: true },
        { label: t('tabApprovals') || 'Approvals', icon: ShieldAlert, href: '/bookings/approvals' },
      ]}
      layout="wide"
    >
      <div className="space-y-3.5 w-full">
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

        {/* Active Range Selection Banner */}
        {selectedCheckIn && (
          <div className="bg-emerald-800 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between gap-4 border border-emerald-700 animate-fadeIn">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 border border-emerald-600">
                <CalendarCheck className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black truncate">
                  Check-In Selected: <span className="underline decoration-emerald-400">{selectedCheckIn.date}</span>
                </p>
                <p className="text-[11px] font-medium text-emerald-200 truncate">
                  Click your Check-Out date on any room row to auto-open booking wizard.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedCheckIn(null)}
              className="px-3 py-1 rounded-lg bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs transition-all cursor-pointer border border-emerald-700 shrink-0 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        )}

        {/* Main Calendar Section */}
        {isLoading ? (
          <CalendarSkeleton />
        ) : isError ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              Failed to load room calendar data
            </h3>
            <button
              onClick={() => refetch()}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-900 transition-all cursor-pointer shadow-2xs mt-2"
            >
              <RotateCcw className="w-3 h-3 inline mr-1.5" />
              Retry
            </button>
          </div>
        ) : (
          <MultiTenantBookingCalendar
            dates={dayHeaders.map((h) => h.date)}
            todayDate={todayStr()}
            occupancyData={data?.occupancy}
            roomTypes={transformedRoomTypes}
            rawBookings={transformedRawBookings}
            onBookingClick={(b) => setSelectedDrawerBookingId(b.id)}
            onCellClick={(roomIdOrTypeId, date) => {
              // Find matching roomType & roomUnit
              let matchingRt: any = null;
              let matchingUnit: any = null;

              for (const rt of transformedRoomTypes) {
                const foundUnit = rt.rooms.find((r: any) => r.id === roomIdOrTypeId || r.unitNumber === roomIdOrTypeId);
                if (foundUnit) {
                  matchingRt = rt;
                  matchingUnit = foundUnit;
                  break;
                }
                if (rt.id === roomIdOrTypeId) {
                  matchingRt = rt;
                }
              }

              const rtId = matchingRt?.id || transformedRoomTypes[0]?.id || '';
              const nextDay = addDays(date, 1);
              const unitParams = matchingUnit
                ? `&roomUnitId=${matchingUnit.id}&unitNumber=${matchingUnit.unitNumber}`
                : '';

              router.push(`/bookings/new?checkInDate=${date}&checkOutDate=${nextDay}&roomTypeId=${rtId}${unitParams}`);
            }}
            onAddRoomClick={(roomTypeId) => {
              router.push(`/rooms?addRoomFor=${roomTypeId}`);
            }}
          />
        )}
      </div>

      {/* Floating Portal Popover Layer */}
      {popover && (
        <BookingPreviewPopover
          targetRect={popover.targetRect}
          bookings={popover.bookings}
          dateLabel={popover.label}
          roomTypeName={popover.roomTypeName}
          onClose={() => setPopover(null)}
          onOpenDrawer={(bookingId: string) => {
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
          onNewBooking={(date: any, roomTypeId?: any) => {
            router.push(`/bookings/new?checkInDate=${date}&roomTypeId=${roomTypeId || ''}`);
          }}
        />
      )}
    </AppShell>
  );
}
