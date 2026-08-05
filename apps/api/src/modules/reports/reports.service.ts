import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReport(propertyId: string, query: { period?: string; from?: string; to?: string }) {
    const { period = 'monthly', from, to } = query;
    let startDate: Date;
    let endDate: Date;

    const now = new Date();

    if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (period === 'custom') {
      if (!from || !to) {
        throw new BadRequestException('Custom period requires "from" and "to" query parameters');
      }
      startDate = new Date(from);
      endDate = new Date(to);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid date format for custom period');
      }
      // Expand to end of day for 'to' date
      endDate.setHours(23, 59, 59, 999);
    } else {
      throw new BadRequestException('Invalid period. Must be "monthly", "yearly", or "custom"');
    }

    const [
      bookingsAgg,
      paymentsAgg,
      totalBookingsCount,
      cancelledBookingsCount,
      agenciesTacAgg,
    ] = await Promise.all([
      this.prisma.booking.aggregate({
        where: {
          propertyId,
          checkInDate: { gte: startDate, lte: endDate },
          deletedAt: null,
          status: { not: 'CANCELLED' }
        },
        _sum: {
          totalAmount: true,
          baseAmount: true,
          gstAmount: true,
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          booking: { propertyId },
          paidAt: { gte: startDate, lte: endDate },
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.booking.count({
        where: {
          propertyId,
          checkInDate: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
      }),
      this.prisma.booking.count({
        where: {
          propertyId,
          checkInDate: { gte: startDate, lte: endDate },
          deletedAt: null,
          status: 'CANCELLED'
        },
      }),
      this.prisma.booking.aggregate({
        where: {
          propertyId,
          checkInDate: { gte: startDate, lte: endDate },
          deletedAt: null,
          status: { not: 'CANCELLED' },
          agencyId: { not: null }
        },
        _sum: {
          tacAmount: true,
        },
      }),
    ]);

    const totalRevenue = bookingsAgg._sum.totalAmount || new Prisma.Decimal(0);
    const baseRevenue = bookingsAgg._sum.baseAmount || new Prisma.Decimal(0);
    const taxes = bookingsAgg._sum.gstAmount || new Prisma.Decimal(0);
    const totalPaymentsReceived = paymentsAgg._sum.amount || new Prisma.Decimal(0);
    const totalTac = agenciesTacAgg._sum.tacAmount || new Prisma.Decimal(0);
    
    // Additional insight: Unpaid balance for bookings in this period
    const outstandingBalance = totalRevenue.minus(totalPaymentsReceived);
    // ADR (Average Daily Rate) approximation for the period
    const validBookingsCount = totalBookingsCount - cancelledBookingsCount;
    const adr = validBookingsCount > 0 ? baseRevenue.div(validBookingsCount) : new Prisma.Decimal(0);

    return {
      period,
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      kpis: {
        totalRevenue: totalRevenue.toNumber(),
        baseRevenue: baseRevenue.toNumber(),
        taxes: taxes.toNumber(),
        totalPaymentsReceived: totalPaymentsReceived.toNumber(),
        outstandingBalance: (outstandingBalance.greaterThan(0) ? outstandingBalance : new Prisma.Decimal(0)).toNumber(),
        totalTac: totalTac.toNumber(),
        adr: adr.toNumber(),
        metrics: {
          totalBookings: totalBookingsCount,
          validBookings: validBookingsCount,
          cancelledBookings: cancelledBookingsCount,
          cancellationRate: totalBookingsCount > 0 ? (cancelledBookingsCount / totalBookingsCount) * 100 : 0
        }
      }
    };
  }
}
