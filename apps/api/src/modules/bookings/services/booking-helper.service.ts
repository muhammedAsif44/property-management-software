import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class BookingHelperService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve property ID for authenticated user context
   */
  async resolvePropertyId(userId: string, requestedPropertyId?: string): Promise<string> {
    if (
      requestedPropertyId &&
      requestedPropertyId !== 'undefined' &&
      requestedPropertyId !== 'null' &&
      requestedPropertyId.trim() !== ''
    ) {
      return requestedPropertyId;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        owner: { select: { defaultPropertyId: true } },
        staffMemberships: { select: { propertyId: true }, take: 1 },
      },
    });

    if (user?.owner?.defaultPropertyId) return user.owner.defaultPropertyId;
    if (user?.staffMemberships?.[0]?.propertyId) return user.staffMemberships[0].propertyId;

    const prop = await this.prisma.property.findFirst({
      where: { OR: [{ owner: { userId } }, { staffMembers: { some: { userId } } }], deletedAt: null },
      select: { id: true },
    });
    if (!prop) throw new NotFoundException('No active property found');
    return prop.id;
  }
}
