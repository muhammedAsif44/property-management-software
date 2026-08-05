import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class GuestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(propertyId: string, query: { search?: string; page?: number; limit?: number }) {
    const { search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.GuestWhereInput = {
      propertyId,
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.guest.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { lastStayAt: 'desc' },
      }),
      this.prisma.guest.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
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
