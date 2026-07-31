import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { BookingHelperService } from './booking-helper.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingOccupancyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly helper: BookingHelperService,
  ) {}

  /**
   * High-Performance Occupancy Tape Chart Calculation
   * Optimized to O(B + R * D) using indexed Map buckets instead of O(R * D * B) nested filtering.
   */
  async getOccupancy(userId: string, propertyId: string, fromDate: string, toDate: string) {
    const resolvedPropertyId = await this.helper.resolvePropertyId(userId, propertyId);
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Get all active room types for property
    const roomTypes = await this.prisma.roomType.findMany({
      where: { propertyId: resolvedPropertyId, isActive: true },
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
      dates.push(cursor.toISOString().split('T')[0]);
      timestamps.push(cursor.getTime());
      cursor.setDate(cursor.getDate() + 1);
    }

    // Build occupancy map
    const occupancy: Record<string, Record<string, { booked: number; total: number; bookings: any[] }>> = {};

    for (const rt of roomTypes) {
      occupancy[rt.id] = {};
      const roomBookings = bookingsByRoomType.get(rt.id) || [];

      // Pre-convert booking dates to timestamps for fast numeric comparisons
      const parsedBookings = roomBookings.map((b) => ({
        id: b.id,
        guestName: b.guest.fullName,
        status: b.status,
        checkInTs: new Date(b.checkInDate).getTime(),
        checkOutTs: new Date(b.checkOutDate).getTime(),
      }));

      for (let i = 0; i < dates.length; i++) {
        const dateStr = dates[i];
        const dayTs = timestamps[i];

        const dayBookings = parsedBookings.filter(
          (b) => b.checkInTs <= dayTs && b.checkOutTs > dayTs,
        );

        occupancy[rt.id][dateStr] = {
          booked: dayBookings.length,
          total: rt.totalUnits,
          bookings: dayBookings.map((b) => ({
            id: b.id,
            guestName: b.guestName,
            status: b.status,
          })),
        };
      }
    }

    return { roomTypes, dates, occupancy };
  }
}
