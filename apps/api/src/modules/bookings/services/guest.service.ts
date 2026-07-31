import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class GuestService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find or create a guest using phone-based deduplication within a property.
   * If phone is provided, match by (propertyId + phone). Otherwise match by (propertyId + fullName).
   * On returning guests, increment totalVisits.
   */
  async findOrCreateGuest(
    propertyId: string,
    data: { fullName: string; phone?: string; email?: string; nationality?: string },
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx || this.prisma;

    // Try phone-based dedup first
    if (data.phone) {
      const existing = await db.guest.findFirst({
        where: { propertyId, phone: data.phone },
      });

      if (existing) {
        // Update name/email if changed, increment visits
        return db.guest.update({
          where: { id: existing.id },
          data: {
            fullName: data.fullName || existing.fullName,
            email: data.email || existing.email,
            nationality: data.nationality || existing.nationality,
            totalVisits: { increment: 1 },
          },
        });
      }
    }

    // Try name-based dedup (fallback when no phone)
    if (!data.phone) {
      const existing = await db.guest.findFirst({
        where: { propertyId, fullName: data.fullName },
      });

      if (existing) {
        return db.guest.update({
          where: { id: existing.id },
          data: {
            phone: data.phone || existing.phone,
            email: data.email || existing.email,
            nationality: data.nationality || existing.nationality,
            totalVisits: { increment: 1 },
          },
        });
      }
    }

    // Create new guest
    return db.guest.create({
      data: {
        propertyId,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        nationality: data.nationality,
        totalVisits: 1,
        firstStayAt: new Date(),
      },
    });
  }
}
