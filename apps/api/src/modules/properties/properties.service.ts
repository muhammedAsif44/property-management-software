import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';

export interface OwnerSlim {
  id: string;
  organizationId: string;
  defaultPropertyId: string | null;
}

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Retrieve owner metadata for logged in user (or null if staff)
   */
  private async getOwnerForUser(userId: string): Promise<OwnerSlim | null> {
    const owner = await this.prisma.owner.findUnique({
      where: { userId },
      select: {
        id: true,
        organizationId: true,
        defaultPropertyId: true,
      },
    });

    return owner;
  }

  /**
   * 1. Get All Properties Accessible by Logged-In User (Owner or Staff Member)
   */
  async getMyProperties(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        organizationId: true,
        owner: { select: { id: true, defaultPropertyId: true } },
        staffMemberships: {
          select: { propertyId: true },
        },
      },
    });

    if (!user) {
      return { defaultPropertyId: null, properties: [], total: 0 };
    }

    const staffPropertyIds = user.staffMemberships.map((s) => s.propertyId);

    const properties = await this.prisma.property.findMany({
      where: {
        OR: [
          { owner: { userId } },
          { id: { in: staffPropertyIds } },
          { staffMembers: { some: { OR: [{ userId: user.id }, { user: { email: user.email } }] } } },
          ...(user.organizationId ? [{ organizationId: user.organizationId }] : []),
        ],
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        organizationId: true,
        ownerId: true,
        name: true,
        slug: true,
        logoUrl: true,
        address: true,
        city: true,
        state: true,
        country: true,
        currency: true,
        timezone: true,
        status: true,
        onboardingStep: true,
        createdAt: true,
        settings: {
          select: {
            checkInTime: true,
            checkOutTime: true,
            termsAndConditions: true,
          },
        },
        _count: {
          select: {
            roomTypes: true,
            amenities: true,
          },
        },
      },
    });

    const activePropertyId =
      user.owner?.defaultPropertyId ||
      (user.staffMemberships.length > 0 ? user.staffMemberships[0].propertyId : properties[0]?.id || null);

    return {
      defaultPropertyId: activePropertyId,
      properties: properties.map((prop) => ({
        ...prop,
        isActive: prop.id === activePropertyId,
      })),
      total: properties.length,
    };
  }

  /**
   * 2. Atomic Property Creation (Owner Only)
   */
  async createProperty(userId: string, dto: CreatePropertyDto) {
    const owner = await this.getOwnerForUser(userId);

    if (!owner) {
      throw new ForbiddenException('Only Property Owners can create new properties');
    }

    const timestamp = Date.now();
    const cleanSlug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const slug = `${cleanSlug}-${timestamp}`;

    const property = await this.prisma.$transaction(async (tx) => {
      const createdProp = await tx.property.create({
        data: {
          organizationId: owner.organizationId,
          ownerId: owner.id,
          name: dto.name,
          slug,
          address: dto.address,
          city: dto.city,
          state: dto.state,
          country: dto.country || 'IN',
          currency: dto.currency || 'INR',
          timezone: dto.timezone || 'Asia/Kolkata',
          status: 'ONBOARDING',
          onboardingStep: 1,
        },
      });

      await tx.propertySettings.create({
        data: {
          propertyId: createdProp.id,
          checkInTime: '14:00',
          checkOutTime: '11:00',
          termsAndConditions: 'Standard guest check-in terms and cancellation policy apply.',
        },
      });

      if (!owner.defaultPropertyId) {
        await tx.owner.update({
          where: { id: owner.id },
          data: { defaultPropertyId: createdProp.id },
        });
      }

      return createdProp;
    });

    return {
      message: 'Property created successfully',
      property: {
        ...property,
        isActive: !owner.defaultPropertyId || owner.defaultPropertyId === property.id,
      },
    };
  }

  /**
   * 3. Switch Active Managed Property
   */
  async switchActiveProperty(userId: string, propertyId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        organizationId: true,
        owner: { select: { id: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [
          { owner: { userId } },
          { staffMembers: { some: { userId } } },
          { organizationId: user.organizationId },
        ],
        deletedAt: null,
      },
    });

    if (!property) {
      throw new ForbiddenException('Property not found or you do not have permission to access this property');
    }

    if (user.owner) {
      await this.prisma.owner.update({
        where: { id: user.owner.id },
        data: { defaultPropertyId: property.id },
      });
    }

    return {
      message: `Switched active property to ${property.name}`,
      activeProperty: property,
    };
  }

  /**
   * 4. Get Current Active Property (For Owner or Staff Member)
   */
  async getActiveProperty(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        organizationId: true,
        owner: { select: { id: true, defaultPropertyId: true } },
        staffMemberships: {
          select: { propertyId: true },
          take: 1,
        },
      },
    });

    if (!user) {
      return { activeProperty: null };
    }

    let targetPropertyId: string | null = user.owner?.defaultPropertyId || null;

    if (!targetPropertyId && user.staffMemberships.length > 0) {
      targetPropertyId = user.staffMemberships[0].propertyId;
    }

    if (!targetPropertyId) {
      const firstProperty = await this.prisma.property.findFirst({
        where: {
          OR: [
            { owner: { userId } },
            { staffMembers: { some: { OR: [{ userId: user.id }, { user: { email: user.email } }] } } },
            ...(user.organizationId ? [{ organizationId: user.organizationId }] : []),
          ],
          deletedAt: null,
        },
      });

      if (!firstProperty) {
        return { activeProperty: null };
      }

      targetPropertyId = firstProperty.id;

      if (user.owner) {
        await this.prisma.owner.update({
          where: { id: user.owner.id },
          data: { defaultPropertyId: firstProperty.id },
        });
      }
    }

    const activeProperty = await this.prisma.property.findUnique({
      where: { id: targetPropertyId },
      include: {
        settings: true,
        roomTypes: { where: { isActive: true } },
        amenities: { where: { isActive: true } },
      },
    });

    return { activeProperty };
  }
}
