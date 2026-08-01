import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class BookingHelperService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve property ID for authenticated user context with multi-tenant security verification
   */
  async resolvePropertyId(userId: string, requestedPropertyId?: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        owner: { select: { id: true, defaultPropertyId: true } },
        staffMemberships: { select: { propertyId: true, status: true } },
      },
    });

    if (!user) throw new ForbiddenException('Authenticated user not found');

    if (
      requestedPropertyId &&
      requestedPropertyId !== 'undefined' &&
      requestedPropertyId !== 'null' &&
      requestedPropertyId.trim() !== ''
    ) {
      if (user.role === 'SUPER_ADMIN') {
        return requestedPropertyId;
      }

      const authorizedProp = await this.prisma.property.findFirst({
        where: {
          id: requestedPropertyId,
          deletedAt: null,
          OR: [
            { owner: { userId } },
            { staffMembers: { some: { OR: [{ userId: user.id }, { user: { email: user.email } }] } } },
            ...(user.organizationId ? [{ organizationId: user.organizationId }] : []),
          ],
        },
        select: { id: true },
      });

      if (!authorizedProp) {
        throw new ForbiddenException('Access denied: You are not authorized for the requested property');
      }

      return requestedPropertyId;
    }

    if (user.owner?.defaultPropertyId) return user.owner.defaultPropertyId;

    if (user.staffMemberships && user.staffMemberships.length > 0) {
      return user.staffMemberships[0].propertyId;
    }

    const prop = await this.prisma.property.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { owner: { userId } },
          { staffMembers: { some: { OR: [{ userId: user.id }, { user: { email: user.email } }] } } },
          ...(user.organizationId ? [{ organizationId: user.organizationId }] : []),
        ],
      },
      select: { id: true },
    });

    if (!prop) throw new NotFoundException('No active property workspace found for user');
    return prop.id;
  }
}
