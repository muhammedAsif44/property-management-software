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
   * Helper: Retrieve owner metadata for logged in user
   */
  private async getOwnerForUser(userId: string): Promise<OwnerSlim> {
    const owner = await this.prisma.owner.findUnique({
      where: { userId },
      select: {
        id: true,
        organizationId: true,
        defaultPropertyId: true,
      },
    });

    if (!owner) {
      throw new NotFoundException('Owner profile not found for this user');
    }

    return owner;
  }

  /**
   * 1. Get All Properties Owned by Logged-In Owner
   * Uses optimized Prisma projections & lean selection to minimize payload size.
   */
  async getMyProperties(userId: string) {
    const owner = await this.getOwnerForUser(userId);

    const properties = await this.prisma.property.findMany({
      where: {
        ownerId: owner.id,
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

    return {
      defaultPropertyId: owner.defaultPropertyId,
      properties: properties.map((prop) => ({
        ...prop,
        isActive: prop.id === owner.defaultPropertyId,
      })),
      total: properties.length,
    };
  }

  /**
   * 2. Atomic Property Creation
   * Creates property, initial settings, and updates default owner selection inside a single atomic transaction.
   */
  async createProperty(userId: string, dto: CreatePropertyDto) {
    const owner = await this.getOwnerForUser(userId);

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
   * Updates default_property_id on the Owner database record.
   */
  async switchActiveProperty(userId: string, propertyId: string) {
    const owner = await this.getOwnerForUser(userId);

    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId: owner.id,
        deletedAt: null,
      },
    });

    if (!property) {
      throw new ForbiddenException('Property not found or you do not own this property');
    }

    await this.prisma.owner.update({
      where: { id: owner.id },
      data: { defaultPropertyId: property.id },
    });

    return {
      message: `Switched active property to ${property.name}`,
      activeProperty: property,
    };
  }

  /**
   * 4. Get Current Active Property
   */
  async getActiveProperty(userId: string) {
    const owner = await this.getOwnerForUser(userId);

    if (!owner.defaultPropertyId) {
      const firstProperty = await this.prisma.property.findFirst({
        where: { ownerId: owner.id, deletedAt: null },
      });

      if (!firstProperty) {
        return { activeProperty: null };
      }

      await this.prisma.owner.update({
        where: { id: owner.id },
        data: { defaultPropertyId: firstProperty.id },
      });

      return { activeProperty: firstProperty };
    }

    const activeProperty = await this.prisma.property.findUnique({
      where: { id: owner.defaultPropertyId },
      include: {
        settings: true,
        roomTypes: { where: { isActive: true } },
        amenities: { where: { isActive: true } },
      },
    });

    return { activeProperty };
  }
}
