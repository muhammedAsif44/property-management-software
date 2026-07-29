import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UpdateOnboardingDto } from '../dto/update-onboarding.dto';

export interface OwnerSlim {
  id: string;
  organizationId: string;
  defaultPropertyId: string | null;
}

@Injectable()
export class PropertyOnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Retrieve owner metadata for logged in user
   */
  private async getOwnerForUser(userId: string): Promise<OwnerSlim> {
    const owner = await this.prisma.owner.findUnique({
      where: { userId },
      select: { id: true, organizationId: true, defaultPropertyId: true },
    });

    if (!owner) {
      throw new NotFoundException('Owner profile not found for this user');
    }

    return owner;
  }

  /**
   * 1. Fetch Onboarding & Configuration Details for a Property
   * Runs property and template queries in parallel using Promise.all.
   */
  async getOnboardingData(userId: string, propertyId: string) {
    const owner = await this.getOwnerForUser(userId);

    const [property, invoiceTemplates] = await Promise.all([
      this.prisma.property.findFirst({
        where: { id: propertyId, ownerId: owner.id, deletedAt: null },
        include: {
          settings: {
            include: {
              activeInvoiceTemplate: {
                select: { id: true, name: true, htmlContent: true, isDefault: true },
              },
            },
          },
          roomTypes: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
          amenities: {
            where: { isActive: true },
          },
        },
      }),
      this.prisma.invoiceTemplate.findMany({
        where: { isActive: true },
        select: { id: true, name: true, htmlContent: true, isDefault: true },
      }),
    ]);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return {
      property,
      invoiceTemplates,
    };
  }

  /**
   * 2. Save Progress for Onboarding Steps 1-6
   * Encapsulates all updates inside an atomic database transaction (prisma.$transaction).
   */
  async saveOnboardingStep(userId: string, propertyId: string, dto: UpdateOnboardingDto) {
    const owner = await this.getOwnerForUser(userId);

    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, ownerId: owner.id, deletedAt: null },
      select: { id: true, onboardingStep: true, status: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Execute updates inside an atomic transaction
    await this.prisma.$transaction(async (tx) => {
      // Step 1: Property Identity
      if (dto.step === 1 && dto.step1) {
        await tx.property.update({
          where: { id: propertyId },
          data: {
            name: dto.step1.name,
            logoUrl: dto.step1.logoUrl,
            address: dto.step1.address,
            city: dto.step1.city,
            state: dto.step1.state,
            country: dto.step1.country,
            timezone: dto.step1.timezone,
            currency: dto.step1.currency,
          },
        });
      }

      // Step 2: Check-in/out & Terms
      if (dto.step === 2 && dto.step2) {
        await tx.propertySettings.upsert({
          where: { propertyId },
          update: {
            checkInTime: dto.step2.checkInTime || '14:00',
            checkOutTime: dto.step2.checkOutTime || '11:00',
            termsAndConditions: dto.step2.termsAndConditions,
          },
          create: {
            propertyId,
            checkInTime: dto.step2.checkInTime || '14:00',
            checkOutTime: dto.step2.checkOutTime || '11:00',
            termsAndConditions: dto.step2.termsAndConditions,
          },
        });
      }

      // Step 3: Room Types Configuration
      if (dto.step === 3 && dto.step3?.roomTypes) {
        for (const rt of dto.step3.roomTypes) {
          if (rt.id) {
            await tx.roomType.update({
              where: { id: rt.id },
              data: {
                name: rt.name,
                totalUnits: rt.totalUnits,
                basePrice: rt.basePrice,
                maxOccupancy: rt.maxOccupancy || 2,
              },
            });
          } else {
            await tx.roomType.create({
              data: {
                propertyId,
                name: rt.name,
                totalUnits: rt.totalUnits,
                basePrice: rt.basePrice,
                maxOccupancy: rt.maxOccupancy || 2,
              },
            });
          }
        }
      }

      // Step 4: Amenities Setup
      if (dto.step === 4 && dto.step4?.amenities) {
        for (const am of dto.step4.amenities) {
          if (am.id) {
            await tx.amenity.update({
              where: { id: am.id },
              data: {
                name: am.name,
                price: am.price,
                icon: am.icon,
              },
            });
          } else {
            await tx.amenity.create({
              data: {
                propertyId,
                name: am.name,
                price: am.price,
                icon: am.icon,
              },
            });
          }
        }
      }

      // Step 5: Invoice Theme Selection
      if (dto.step === 5 && dto.step5?.activeInvoiceTemplateId) {
        await tx.propertySettings.upsert({
          where: { propertyId },
          update: {
            activeInvoiceTemplateId: dto.step5.activeInvoiceTemplateId,
          },
          create: {
            propertyId,
            activeInvoiceTemplateId: dto.step5.activeInvoiceTemplateId,
          },
        });
      }

      // Step 6: Bank & Payment Details
      if (dto.step === 6 && dto.step6) {
        await tx.propertySettings.upsert({
          where: { propertyId },
          update: {
            bankAccountDetails: dto.step6.bankAccountDetails as any,
            upiId: dto.step6.upiId,
            qrCodeUrl: dto.step6.qrCodeUrl,
          },
          create: {
            propertyId,
            bankAccountDetails: dto.step6.bankAccountDetails as any,
            upiId: dto.step6.upiId,
            qrCodeUrl: dto.step6.qrCodeUrl,
          },
        });
      }

      // Progress counter update
      const nextStep = Math.max(property.onboardingStep, dto.step + 1 > 6 ? 6 : dto.step + 1);
      const newStatus = dto.step >= 6 || nextStep >= 6 ? 'ACTIVE' : property.status;

      await tx.property.update({
        where: { id: propertyId },
        data: {
          onboardingStep: nextStep,
          status: newStatus,
        },
      });
    });

    const updatedProperty = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        settings: { include: { activeInvoiceTemplate: true } },
        roomTypes: true,
        amenities: true,
      },
    });

    return {
      message: `Onboarding Step ${dto.step} saved successfully!`,
      property: updatedProperty,
    };
  }
}
