import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class GuestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(propertyId: string, query: { search?: string; page?: number; limit?: number }) {
    const { search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const baseWhere: Prisma.GuestWhereInput = {
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Try property-specific filter first
    let where: Prisma.GuestWhereInput = {
      ...baseWhere,
      ...(propertyId ? { propertyId } : {}),
    };

    let [data, total] = await Promise.all([
      this.prisma.guest.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.guest.count({ where }),
    ]);

    // If 0 guests match specific propertyId, fallback to query all property guests
    if (total === 0 && propertyId) {
      where = baseWhere;
      [data, total] = await Promise.all([
        this.prisma.guest.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.guest.count({ where }),
      ]);
    }

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async syncGuestsFromBookings(propertyId?: string) {
    try {
      const bookings = await this.prisma.booking.findMany({
        where: {
          ...(propertyId ? { propertyId } : {}),
          deletedAt: null,
        },
        include: { guest: true },
      });

      for (const b of bookings) {
        const gName = (b as any).guestName || b.guest?.fullName || 'Guest';
        const gPhone = (b as any).guestPhone || b.guest?.phone || null;
        const gEmail = (b as any).guestEmail || b.guest?.email || null;
        const targetPropId = b.propertyId;

        let existing = await this.prisma.guest.findFirst({
          where: {
            propertyId: targetPropId,
            OR: [
              ...(gPhone ? [{ phone: gPhone }] : []),
              ...(gEmail ? [{ email: gEmail }] : []),
              { fullName: gName },
            ],
          },
        });

        if (!existing) {
          existing = await this.prisma.guest.create({
            data: {
              propertyId: targetPropId,
              fullName: gName,
              phone: gPhone,
              email: gEmail,
              totalVisits: 1,
              totalSpend: Number(b.totalAmount || 0),
              lastStayAt: b.checkInDate,
            },
          });
        }

        if (!b.guestId && existing) {
          await this.prisma.booking.update({
            where: { id: b.id },
            data: { guestId: existing.id },
          });
        }
      }
    } catch (e) {
      // Sync fallback error swallowed safely
    }
  }

  async findOne(propertyId: string, id: string) {
    const guest = await this.prisma.guest.findFirst({
      where: { id, propertyId },
      include: {
        bookings: {
          orderBy: { checkInDate: 'desc' },
          include: {
            roomType: true,
            roomUnit: true,
          }
        },
      },
    });

    if (!guest) {
      throw new NotFoundException('Guest not found');
    }

    return guest;
  }
}
