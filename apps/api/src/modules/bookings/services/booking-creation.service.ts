import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { GuestService } from './guest.service';
import { BookingHelperService } from './booking-helper.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { BookingStatus, TacStatus, CleanlinessStatus, Prisma } from '@prisma/client';

@Injectable()
export class BookingCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly guestService: GuestService,
    private readonly helper: BookingHelperService,
  ) {}

  /**
   * Create Booking (SERIALIZABLE transaction + Idempotency + Row-level availability check)
   */
  async createBooking(userId: string, dto: CreateBookingDto, idempotencyKey?: string) {
    const propertyId = await this.helper.resolvePropertyId(userId, dto.propertyId);

    // Idempotency check
    if (idempotencyKey) {
      const existing = await this.prisma.booking.findUnique({
        where: { idempotencyKey },
        include: { guest: true, roomType: true, bookingFacilities: { include: { amenity: true } }, agency: true },
      });
      if (existing) return existing;
    }

    // Validate room type exists and belongs to property
    const roomType = await this.prisma.roomType.findFirst({
      where: { id: dto.roomTypeId, propertyId, isActive: true },
    });
    if (!roomType) throw new NotFoundException('Room type not found or inactive');

    // Validate agency if channel is AGENCY or agencyId provided
    if (dto.channel === 'AGENCY' && !dto.agencyId) {
      throw new BadRequestException('Agency ID is required for agency channel bookings');
    }

    if (dto.agencyId) {
      const agency = await this.prisma.agency.findFirst({
        where: { id: dto.agencyId, propertyId, isActive: true },
      });
      if (!agency) {
        throw new BadRequestException('Selected agency is not valid or active for this property');
      }
    }

    const checkIn = new Date(dto.checkInDate);
    const checkOut = new Date(dto.checkOutDate);

    if (checkOut <= checkIn) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    // Fetch property settings for GST
    const settings = await this.prisma.propertySettings.findUnique({
      where: { propertyId },
    });

    // Run inside SERIALIZABLE transaction for conflict detection to prevent Phantom Reads
    return this.prisma.$transaction(async (tx) => {
      // Count overlapping bookings for same room type (excluding cancelled/deleted)
      const overlappingCount = await tx.booking.count({
        where: {
          propertyId,
          roomTypeId: dto.roomTypeId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
          deletedAt: null,
          checkInDate: { lt: checkOut },
          checkOutDate: { gt: checkIn },
        },
      });

      if (overlappingCount >= roomType.totalUnits) {
        throw new ConflictException(
          `No available ${roomType.name} units for the selected dates. All ${roomType.totalUnits} unit(s) are booked.`,
        );
      }

      // Guest deduplication
      const guest = await this.guestService.findOrCreateGuest(
        propertyId,
        {
          fullName: dto.guestName,
          phone: dto.guestPhone,
          email: dto.guestEmail,
          nationality: dto.guestNationality,
        },
        tx,
      );

      // Calculate amounts
      const baseAmount = new Prisma.Decimal(dto.baseAmount);
      let gstAmount = new Prisma.Decimal(0);

      if (settings?.gstEnabled && settings.gstRate) {
        gstAmount = baseAmount.mul(settings.gstRate).div(100);
      }

      // Snapshot facility prices
      let facilityTotal = new Prisma.Decimal(0);
      const facilitySnapshots: { amenityId: string; quantity: number; priceAtBooking: Prisma.Decimal }[] = [];

      if (dto.facilityIds && dto.facilityIds.length > 0) {
        const amenities = await tx.amenity.findMany({
          where: { id: { in: dto.facilityIds }, propertyId, isActive: true },
        });

        for (const amenity of amenities) {
          facilitySnapshots.push({
            amenityId: amenity.id,
            quantity: 1,
            priceAtBooking: amenity.price,
          });
          facilityTotal = facilityTotal.add(amenity.price);
        }
      }

      const totalAmount = baseAmount.add(gstAmount).add(facilityTotal);
      const advancePaid = new Prisma.Decimal(dto.advancePaid || 0);
      const balanceDue = totalAmount.sub(advancePaid);

      // TAC status for agency bookings
      const tacStatus = dto.channel === 'AGENCY' ? TacStatus.PENDING : null;

      // Physical Room Unit Validation if roomUnitId is specified
      if (dto.roomUnitId) {
        const unit = await tx.roomUnit.findFirst({
          where: { id: dto.roomUnitId, propertyId, roomTypeId: dto.roomTypeId },
        });
        if (!unit) {
          throw new NotFoundException('Selected room unit not found or does not match room category');
        }
        if (unit.cleanlinessStatus === CleanlinessStatus.OUT_OF_ORDER) {
          throw new ConflictException(`Selected room unit ${unit.unitNumber} is currently Out of Order for maintenance`);
        }
        const unitOverlap = await tx.booking.count({
          where: {
            propertyId,
            roomUnitId: dto.roomUnitId,
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
            deletedAt: null,
            checkInDate: { lt: checkOut },
            checkOutDate: { gt: checkIn },
          },
        });
        if (unitOverlap > 0) {
          throw new ConflictException(`Selected room unit ${unit.unitNumber} is already booked for these dates`);
        }
      }

      // Create booking
      const booking = await tx.booking.create({
        data: {
          propertyId,
          guestId: guest.id,
          roomTypeId: dto.roomTypeId,
          roomUnitId: dto.roomUnitId || null,
          agencyId: dto.agencyId || null,
          channel: dto.channel,
          status: BookingStatus.CONFIRMED,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          adults: dto.adults,
          children: dto.children || 0,
          mealPlan: dto.mealPlan || null,
          baseAmount,
          gstAmount,
          totalAmount,
          advancePaid,
          balanceDue,
          tacStatus,
          idempotencyKey: idempotencyKey || null,
          createdByUserId: userId,
          bookingFacilities: {
            createMany: { data: facilitySnapshots },
          },
        },
        include: {
          guest: true,
          roomType: true,
          bookingFacilities: { include: { amenity: true } },
          agency: true,
          createdByUser: { select: { id: true, email: true, role: true } },
        },
      });

      // If agency booking, increment pending TAC
      if (dto.agencyId && tacStatus === TacStatus.PENDING) {
        const agency = await tx.agency.findUnique({ where: { id: dto.agencyId } });
        if (agency?.defaultTacRate) {
          const tacAmount = baseAmount.mul(agency.defaultTacRate).div(100);
          await tx.agency.update({
            where: { id: dto.agencyId },
            data: {
              totalTac: { increment: tacAmount },
              pendingTac: { increment: tacAmount },
            },
          });
        }
      }

      return booking;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
