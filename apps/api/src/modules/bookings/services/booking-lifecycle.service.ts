import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { CancelBookingDto, RefundType } from '../dto/cancel-booking.dto';
import { BookingStatus, TacStatus, Prisma } from '@prisma/client';

@Injectable()
export class BookingLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update Booking
   */
  async updateBooking(userId: string, bookingId: string, dto: UpdateBookingDto) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot edit a cancelled booking');
    }
    if (booking.status === BookingStatus.CHECKED_OUT) {
      throw new BadRequestException('Cannot edit a checked-out booking');
    }

    const updateData: any = {};

    // If guest info changed, update guest record
    if (dto.guestName || dto.guestPhone || dto.guestEmail || dto.guestNationality) {
      await this.prisma.guest.update({
        where: { id: booking.guestId },
        data: {
          ...(dto.guestName && { fullName: dto.guestName }),
          ...(dto.guestPhone && { phone: dto.guestPhone }),
          ...(dto.guestEmail && { email: dto.guestEmail }),
          ...(dto.guestNationality && { nationality: dto.guestNationality }),
        },
      });
    }

    // If dates or room type changed, re-run conflict check
    const newCheckIn = dto.checkInDate ? new Date(dto.checkInDate) : booking.checkInDate;
    const newCheckOut = dto.checkOutDate ? new Date(dto.checkOutDate) : booking.checkOutDate;
    const newRoomTypeId = dto.roomTypeId || booking.roomTypeId;

    if (dto.checkInDate || dto.checkOutDate || dto.roomTypeId) {
      if (newCheckOut <= newCheckIn) {
        throw new BadRequestException('Check-out date must be after check-in date');
      }

      const roomType = await this.prisma.roomType.findFirst({
        where: { id: newRoomTypeId, propertyId: booking.propertyId, isActive: true },
      });
      if (!roomType) throw new NotFoundException('Room type not found');

      const overlapping = await this.prisma.booking.count({
        where: {
          propertyId: booking.propertyId,
          roomTypeId: newRoomTypeId,
          id: { not: bookingId },
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
          deletedAt: null,
          checkInDate: { lt: newCheckOut },
          checkOutDate: { gt: newCheckIn },
        },
      });

      if (overlapping >= roomType.totalUnits) {
        throw new ConflictException('No available units for the updated dates');
      }

      updateData.checkInDate = newCheckIn;
      updateData.checkOutDate = newCheckOut;
      updateData.roomTypeId = newRoomTypeId;
    }

    if (dto.adults !== undefined) updateData.adults = dto.adults;
    if (dto.children !== undefined) updateData.children = dto.children;
    if (dto.mealPlan !== undefined) updateData.mealPlan = dto.mealPlan;
    if (dto.channel !== undefined) updateData.channel = dto.channel;

    // Recalculate amounts if baseAmount changed
    if (dto.baseAmount !== undefined) {
      const settings = await this.prisma.propertySettings.findUnique({
        where: { propertyId: booking.propertyId },
      });

      const baseAmount = new Prisma.Decimal(dto.baseAmount);
      let gstAmount = new Prisma.Decimal(0);
      if (settings?.gstEnabled && settings.gstRate) {
        gstAmount = baseAmount.mul(settings.gstRate).div(100);
      }

      const advancePaid = dto.advancePaid !== undefined
        ? new Prisma.Decimal(dto.advancePaid)
        : booking.advancePaid;

      updateData.baseAmount = baseAmount;
      updateData.gstAmount = gstAmount;
      updateData.totalAmount = baseAmount.add(gstAmount);
      updateData.advancePaid = advancePaid;
      updateData.balanceDue = baseAmount.add(gstAmount).sub(advancePaid);
    } else if (dto.advancePaid !== undefined) {
      const advancePaid = new Prisma.Decimal(dto.advancePaid);
      updateData.advancePaid = advancePaid;
      updateData.balanceDue = booking.totalAmount.sub(advancePaid);
    }

    // Update facilities if provided
    if (dto.facilityIds) {
      await this.prisma.bookingFacility.deleteMany({ where: { bookingId } });

      if (dto.facilityIds.length > 0) {
        const amenities = await this.prisma.amenity.findMany({
          where: { id: { in: dto.facilityIds }, propertyId: booking.propertyId, isActive: true },
        });
        await this.prisma.bookingFacility.createMany({
          data: amenities.map((a) => ({
            bookingId,
            amenityId: a.id,
            quantity: 1,
            priceAtBooking: a.price,
          })),
        });
      }
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        guest: true,
        roomType: true,
        bookingFacilities: { include: { amenity: true } },
        agency: true,
        createdByUser: { select: { id: true, email: true, role: true } },
      },
    });
  }

  /**
   * Cancel Booking (Refund / Forfeit + TAC Reversal)
   */
  async cancelBooking(userId: string, bookingId: string, dto: CancelBookingDto) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }
    if (booking.status === BookingStatus.CHECKED_OUT) {
      throw new BadRequestException('Cannot cancel a checked-out booking');
    }

    const refundAmount = dto.refundType === RefundType.REFUND
      ? booking.advancePaid
      : new Prisma.Decimal(0);

    return this.prisma.$transaction(async (tx) => {
      // TAC Reversal: If agency booking with pending TAC
      if (booking.agencyId && booking.tacStatus === TacStatus.PENDING) {
        const agency = await tx.agency.findUnique({ where: { id: booking.agencyId } });
        if (agency?.defaultTacRate) {
          const tacAmount = booking.baseAmount.mul(agency.defaultTacRate).div(100);
          await tx.agency.update({
            where: { id: booking.agencyId },
            data: {
              totalTac: { decrement: tacAmount },
              pendingTac: { decrement: tacAmount },
            },
          });
        }
      }

      return tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancellationReason: dto.cancellationReason,
          refundAmount,
          tacStatus: booking.agencyId ? null : booking.tacStatus,
        },
        include: {
          guest: true,
          roomType: true,
          agency: true,
        },
      });
    });
  }

  /**
   * Update Status (CHECKED_IN / CHECKED_OUT)
   */
  async updateBookingStatus(userId: string, bookingId: string, newStatus: BookingStatus) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      include: { guest: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Validate transitions
    const validTransitions: Record<string, BookingStatus[]> = {
      [BookingStatus.CONFIRMED]: [BookingStatus.CHECKED_IN, BookingStatus.CANCELLED],
      [BookingStatus.CHECKED_IN]: [BookingStatus.CHECKED_OUT],
    };

    const allowed = validTransitions[booking.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${booking.status} to ${newStatus}`,
      );
    }

    const updateData: any = { status: newStatus };

    // On checkout, update guest stats
    if (newStatus === BookingStatus.CHECKED_OUT) {
      await this.prisma.guest.update({
        where: { id: booking.guestId },
        data: {
          lastStayAt: new Date(),
          totalSpend: { increment: booking.totalAmount },
        },
      });
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        guest: true,
        roomType: true,
        agency: true,
        createdByUser: { select: { id: true, email: true, role: true } },
      },
    });
  }
}
