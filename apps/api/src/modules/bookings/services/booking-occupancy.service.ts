import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { BookingHelperService } from './booking-helper.service';
import { BookingStatus, CleanlinessStatus } from '@prisma/client';

@Injectable()
export class BookingOccupancyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly helper: BookingHelperService,
  ) {}

  /**
   * High-Performance Occupancy Tape Chart Calculation
   * Optimized to O(B + R * D) using indexed Map buckets with timezone-safe UTC date boundaries.
   */
  async getOccupancy(userId: string, propertyId: string, fromDate: string, toDate: string) {
    const resolvedPropertyId = await this.helper.resolvePropertyId(userId, propertyId);

    if (!fromDate || !toDate) {
      throw new BadRequestException('fromDate and toDate are required query parameters');
    }

    // Normalize date strings to UTC midnight boundaries to prevent timezone offset shifts
    const fromStr = fromDate.includes('T') ? fromDate.split('T')[0] : fromDate;
    const toStr = toDate.includes('T') ? toDate.split('T')[0] : toDate;

    const from = new Date(`${fromStr}T00:00:00.000Z`);
    const to = new Date(`${toStr}T00:00:00.000Z`);

    // Get all active room types for property with physical units
    const roomTypes = await this.prisma.roomType.findMany({
      where: { propertyId: resolvedPropertyId, isActive: true },
      include: {
        roomUnits: {
          select: { id: true, unitNumber: true, cleanlinessStatus: true },
          orderBy: { unitNumber: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Fetch active bookings overlapping the date range
    const bookings = await this.prisma.booking.findMany({
      where: {
        propertyId: resolvedPropertyId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
        deletedAt: null,
        checkInDate: { lt: to },
        checkOutDate: { gt: from },
      },
      select: {
        id: true,
        roomTypeId: true,
        roomUnitId: true,
        roomUnit: { select: { id: true, unitNumber: true } },
        checkInDate: true,
        checkOutDate: true,
        status: true,
        guest: { select: { fullName: true, phone: true } },
      },
    });

    // Pre-bucket bookings by roomTypeId for O(1) retrieval
    const bookingsByRoomType = new Map<string, typeof bookings>();
    for (const b of bookings) {
      const list = bookingsByRoomType.get(b.roomTypeId) || [];
      list.push(b);
      bookingsByRoomType.set(b.roomTypeId, list);
    }

    // Build date strings and timestamp lookups
    const dates: string[] = [];
    const timestamps: number[] = [];
    const cursor = new Date(from);
    while (cursor < to) {
      const dateStr = cursor.toISOString().split('T')[0];
      dates.push(dateStr);
      timestamps.push(new Date(`${dateStr}T00:00:00.000Z`).getTime());
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    // Get Out of Order units count per room type
    const oooUnits = await this.prisma.roomUnit.groupBy({
      by: ['roomTypeId'],
      where: { propertyId: resolvedPropertyId, cleanlinessStatus: CleanlinessStatus.OUT_OF_ORDER },
      _count: { _all: true },
    });
    const oooMap = new Map<string, number>();
    for (const o of oooUnits) {
      oooMap.set(o.roomTypeId, o._count._all);
    }

    // Build bookings map (normalized payload)
    const bookingsMap: Record<string, any> = {};

    for (const b of bookings) {
      const inStr = b.checkInDate.toISOString().split('T')[0];
      const outStr = b.checkOutDate.toISOString().split('T')[0];
      bookingsMap[b.id] = {
        id: b.id,
        guestName: b.guest.fullName,
        guestPhone: b.guest.phone || null,
        status: b.status,
        roomUnitId: b.roomUnitId || null,
        unitNumber: b.roomUnit?.unitNumber || null,
        checkInDate: inStr,
        checkOutDate: outStr,
        checkInTs: new Date(`${inStr}T00:00:00.000Z`).getTime(),
        checkOutTs: new Date(`${outStr}T00:00:00.000Z`).getTime(),
      };
    }

    // Build occupancy map
    const occupancy: Record<string, Record<string, { booked: number; total: number; outOfOrder: number; available: number; hasConflict: boolean; bookingIds: string[] }>> = {};

    for (const rt of roomTypes) {
      occupancy[rt.id] = {};
      const roomBookings = bookingsByRoomType.get(rt.id) || [];
      const oooCount = oooMap.get(rt.id) || 0;

      // Initialize all dates to 0
      for (const dateStr of dates) {
        occupancy[rt.id][dateStr] = {
          booked: 0,
          total: rt.totalUnits,
          outOfOrder: oooCount,
          available: Math.max(0, rt.totalUnits - oooCount),
          hasConflict: false,
          bookingIds: [],
        };
      }

      // Iterate over room bookings using strict UTC night boundaries (check-out day is NOT counted as an occupied night)
      for (const b of roomBookings) {
        const inDate = new Date(b.checkInDate);
        const outDate = new Date(b.checkOutDate);

        const inUtc = Date.UTC(inDate.getUTCFullYear(), inDate.getUTCMonth(), inDate.getUTCDate());
        const outUtc = Date.UTC(outDate.getUTCFullYear(), outDate.getUTCMonth(), outDate.getUTCDate());

        let currentTs = inUtc;
        while (currentTs < outUtc) {
          const dateStr = new Date(currentTs).toISOString().split('T')[0];
          const cell = occupancy[rt.id]?.[dateStr];
          
          if (cell) {
            cell.booked++;
            cell.available = Math.max(0, cell.total - cell.booked - cell.outOfOrder);
            cell.hasConflict = cell.booked > cell.total;
            cell.bookingIds.push(b.id);
          }
          currentTs += 86400000; // +1 UTC Day
        }
      }
    }

    // Remove internal timestamps before sending to client to keep JSON clean
    for (const key in bookingsMap) {
      delete bookingsMap[key].checkInTs;
      delete bookingsMap[key].checkOutTs;
    }

    return { roomTypes, dates, occupancy, bookingsMap };
  }
}
