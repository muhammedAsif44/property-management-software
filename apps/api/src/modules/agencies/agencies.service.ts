import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { SettleAgencyDto } from './dto/settle-agency.dto';
import { Prisma, TacStatus } from '@prisma/client';

@Injectable()
export class AgenciesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Create Travel Agency
   */
  async createAgency(userId: string, propertyId: string, dto: CreateAgencyDto) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const defaultTacRate = dto.defaultTacRate !== undefined
      ? new Prisma.Decimal(dto.defaultTacRate)
      : null;

    const agency = await this.prisma.agency.create({
      data: {
        propertyId,
        name: dto.name,
        contactPerson: dto.contactPerson,
        phone: dto.phone,
        email: dto.email,
        defaultTacRate,
      },
    });

    return {
      message: 'Travel agency registered successfully',
      agency: {
        ...agency,
        defaultTacRate: agency.defaultTacRate?.toNumber() || 0,
        totalTac: agency.totalTac.toNumber(),
        tacPaid: agency.tacPaid.toNumber(),
        pendingTac: agency.pendingTac.toNumber(),
      },
    };
  }

  /**
   * 2. List Property Agencies & TAC Ledger Summaries
   */
  async getAgencies(userId: string, propertyId: string) {
    const agencies = await this.prisma.agency.findMany({
      where: { propertyId, isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    return {
      agencies: agencies.map((a) => ({
        id: a.id,
        name: a.name,
        contactPerson: a.contactPerson,
        phone: a.phone,
        email: a.email,
        defaultTacRate: a.defaultTacRate?.toNumber() || 0,
        totalTac: a.totalTac.toNumber(),
        tacPaid: a.tacPaid.toNumber(),
        pendingTac: a.pendingTac.toNumber(),
        totalBookings: a._count.bookings,
        isActive: a.isActive,
      })),
    };
  }

  /**
   * 2b. Get Agency Details with Bookings & Settlement Ledger
   */
  async getAgencyDetails(userId: string, agencyId: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      include: {
        bookings: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            guest: true,
            roomType: true,
          },
        },
        settlements: {
          orderBy: { createdAt: 'desc' },
          include: {
            processedBy: {
              select: { email: true },
            },
          },
        },
      },
    });

    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    const aAny = agency as any;

    return {
      agency: {
        ...agency,
        defaultTacRate: agency.defaultTacRate?.toNumber() || 0,
        totalTac: agency.totalTac.toNumber(),
        tacPaid: agency.tacPaid.toNumber(),
        pendingTac: agency.pendingTac.toNumber(),
      },
      bookings: (aAny.bookings || []).map((b: any) => ({
        ...b,
        baseAmount: b.baseAmount ? b.baseAmount.toNumber() : 0,
        totalAmount: b.totalAmount ? b.totalAmount.toNumber() : 0,
        tacAmount: b.tacAmount?.toNumber() || 0,
        tacRateAtBooking: b.tacRateAtBooking?.toNumber() || 0,
      })),
      settlements: (aAny.settlements || []).map((s: any) => ({
        ...s,
        amount: s.amount ? s.amount.toNumber() : 0,
        createdByUser: s.processedBy,
      })),
    };
  }

  /**
   * 3. Commission Settlement (Atomic Single Transaction)
   */
  async settleCommission(userId: string, agencyId: string, dto: SettleAgencyDto, idempotencyKey?: string) {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required for financial transactions');
    }

    // Idempotency Check: Return existing successful settlement if it matches
    const existingSettlement = await this.prisma.agencySettlement.findUnique({
      where: { idempotencyKey },
      include: { agency: true }
    });

    if (existingSettlement) {
      return {
        message: 'Commission settled successfully (Idempotent Cached Response)',
        agency: {
          id: existingSettlement.agency.id,
          name: existingSettlement.agency.name,
          totalTac: existingSettlement.agency.totalTac.toNumber(),
          tacPaid: existingSettlement.agency.tacPaid.toNumber(),
          pendingTac: existingSettlement.agency.pendingTac.toNumber(),
        },
      };
    }

    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    const settleAmount = new Prisma.Decimal(dto.amount);
    if (settleAmount.greaterThan(agency.pendingTac)) {
      throw new BadRequestException(
        `Settlement amount (₹${settleAmount}) exceeds pending commission (₹${agency.pendingTac})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create immutable AgencySettlement transaction
      const settlement = await tx.agencySettlement.create({
        data: {
          agencyId,
          amount: settleAmount,
          idempotencyKey,
          processedById: userId,
        }
      });

      // 2. Update Agency running totals
      const updatedAgency = await tx.agency.update({
        where: { id: agencyId },
        data: {
          pendingTac: agency.pendingTac.minus(settleAmount),
          tacPaid: agency.tacPaid.plus(settleAmount),
        },
      });

      // 3. Selectively update pending bookings for this agency
      const pendingBookings = await tx.booking.findMany({
        where: {
          agencyId,
          tacStatus: TacStatus.PENDING,
          deletedAt: null,
        },
        orderBy: { createdAt: 'asc' },
      });

      let remainingToSettle = settleAmount;
      const settledBookingIds: string[] = [];

      for (const b of pendingBookings) {
        const bTac = b.tacAmount ?? (agency.defaultTacRate ? b.baseAmount.mul(agency.defaultTacRate).div(100) : new Prisma.Decimal(0));
        if (bTac.equals(0)) {
          settledBookingIds.push(b.id);
        } else if (bTac.greaterThan(0) && remainingToSettle.greaterThanOrEqualTo(bTac)) {
          settledBookingIds.push(b.id);
          remainingToSettle = remainingToSettle.minus(bTac);
        }
      }

      if (settledBookingIds.length > 0) {
        await tx.booking.updateMany({
          where: { id: { in: settledBookingIds } },
          data: { 
            tacStatus: TacStatus.SETTLED,
            settlementId: settlement.id
          },
        });
      }

      return {
        message: 'Commission settled successfully',
        agency: {
          id: updatedAgency.id,
          name: updatedAgency.name,
          totalTac: updatedAgency.totalTac.toNumber(),
          tacPaid: updatedAgency.tacPaid.toNumber(),
          pendingTac: updatedAgency.pendingTac.toNumber(),
        },
      };
    });
  }
}
