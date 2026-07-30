import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve effective propertyId for the current user (Owner/Staff)
   */
  private async resolvePropertyId(userId: string, requestedPropertyId?: string): Promise<string> {
    if (requestedPropertyId) {
      return requestedPropertyId;
    }

    const owner = await this.prisma.owner.findUnique({
      where: { userId },
      select: { defaultPropertyId: true, id: true },
    });

    if (owner?.defaultPropertyId) {
      return owner.defaultPropertyId;
    }

    // Fallback to first available property owned by user or where user is staff
    const firstProp = await this.prisma.property.findFirst({
      where: {
        OR: [
          { owner: { userId } },
          { staffMembers: { some: { userId } } },
        ],
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!firstProp) {
      throw new NotFoundException('No active property found for user');
    }

    return firstProp.id;
  }

  /**
   * 1. Get Live Dashboard Aggregations
   * Runs queries concurrently via Promise.all / Prisma transaction for high performance.
   */
  async getDashboardAnalytics(userId: string, propertyId?: string) {
    const targetPropertyId = await this.resolvePropertyId(userId, propertyId);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      propertyInfo,
      todayPaymentsAgg,
      monthlyPaymentsAgg,
      todayCheckInsCount,
      todayCheckOutsCount,
      totalRoomsCount,
      occupiedRoomsCount,
      recentBookings,
      pendingTacAgencies,
      pendingTacBookings,
    ] = await Promise.all([
      // Property Info
      this.prisma.property.findUnique({
        where: { id: targetPropertyId },
        select: {
          id: true,
          name: true,
          currency: true,
          city: true,
          settings: {
            select: {
              checkInTime: true,
              checkOutTime: true,
            },
          },
        },
      }),

      // Today's Revenue Sum
      this.prisma.payment.aggregate({
        where: {
          booking: { propertyId: targetPropertyId },
          paidAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { amount: true },
      }),

      // Current Month Revenue Sum
      this.prisma.payment.aggregate({
        where: {
          booking: { propertyId: targetPropertyId },
          paidAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),

      // Today's Check-ins Count
      this.prisma.booking.count({
        where: {
          propertyId: targetPropertyId,
          checkInDate: todayDateOnly,
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          deletedAt: null,
        },
      }),

      // Today's Check-outs Count
      this.prisma.booking.count({
        where: {
          propertyId: targetPropertyId,
          checkOutDate: todayDateOnly,
          status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
          deletedAt: null,
        },
      }),

      // Total Configured Room Units
      this.prisma.roomType.aggregate({
        where: { propertyId: targetPropertyId, isActive: true },
        _sum: { totalUnits: true },
      }),

      // Currently Occupied Rooms
      this.prisma.booking.count({
        where: {
          propertyId: targetPropertyId,
          status: 'CHECKED_IN',
          deletedAt: null,
        },
      }),

      // Recent Bookings Feed (Top 6)
      this.prisma.booking.findMany({
        where: { propertyId: targetPropertyId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          channel: true,
          status: true,
          checkInDate: true,
          checkOutDate: true,
          totalAmount: true,
          balanceDue: true,
          createdAt: true,
          guest: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
          roomType: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      // Pending TAC Agencies Widget
      this.prisma.agency.findMany({
        where: {
          propertyId: targetPropertyId,
          pendingTac: { gt: 0 },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          contactPerson: true,
          pendingTac: true,
          totalTac: true,
          tacPaid: true,
        },
        take: 5,
      }),

      // Pending TAC Bookings
      this.prisma.booking.findMany({
        where: {
          propertyId: targetPropertyId,
          agencyId: { not: null },
          tacStatus: 'PENDING',
          deletedAt: null,
        },
        take: 5,
        select: {
          id: true,
          checkInDate: true,
          totalAmount: true,
          guest: { select: { fullName: true } },
          agency: { select: { name: true } },
        },
      }),
    ]);

    const totalRooms = totalRoomsCount._sum.totalUnits || 0;
    const occupancyRate = totalRooms > 0 ? Math.min(100, Math.round((occupiedRoomsCount / totalRooms) * 100)) : 0;

    return {
      property: propertyInfo,
      metrics: {
        todayRevenue: Number(todayPaymentsAgg._sum.amount || 0),
        monthlyRevenue: Number(monthlyPaymentsAgg._sum.amount || 0),
        todayCheckIns: todayCheckInsCount,
        todayCheckOuts: todayCheckOutsCount,
        totalRooms,
        occupiedRooms: occupiedRoomsCount,
        occupancyRate,
      },
      recentBookings,
      pendingTac: {
        agencies: pendingTacAgencies.map((a) => ({
          ...a,
          pendingTac: Number(a.pendingTac),
          totalTac: Number(a.totalTac),
          tacPaid: Number(a.tacPaid),
        })),
        pendingBookingsCount: pendingTacBookings.length,
      },
    };
  }

  /**
   * 2. Auto Checkout expired CHECKED_IN bookings
   * Updates status to CHECKED_OUT for stays where checkOutDate < current date
   */
  async autoCheckoutExpiredBookings(userId: string, propertyId?: string) {
    const targetPropertyId = await this.resolvePropertyId(userId, propertyId);
    const todayDateOnly = new Date();
    todayDateOnly.setHours(0, 0, 0, 0);

    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        propertyId: targetPropertyId,
        status: 'CHECKED_IN',
        checkOutDate: { lt: todayDateOnly },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (expiredBookings.length === 0) {
      return {
        message: 'No expired check-ins to update',
        updatedCount: 0,
      };
    }

    const result = await this.prisma.booking.updateMany({
      where: {
        id: { in: expiredBookings.map((b) => b.id) },
      },
      data: {
        status: 'CHECKED_OUT',
      },
    });

    return {
      message: `Successfully checked out ${result.count} expired booking(s)`,
      updatedCount: result.count,
    };
  }
}
