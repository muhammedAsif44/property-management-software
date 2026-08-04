import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { BookingHelperService } from './booking-helper.service';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { CancelBookingDto, RefundType } from '../dto/cancel-booking.dto';
import { BookingStatus, TacStatus, CleanlinessStatus, TaskStatus, Prisma } from '@prisma/client';

@Injectable()
export class BookingLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly helper: BookingHelperService,
  ) {}

  /**
   * Update Booking (SERIALIZABLE transaction for race condition prevention)
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

    // Verify property ownership/membership
    await this.helper.resolvePropertyId(userId, booking.propertyId);

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {};

      // If guest info changed, update guest record
      if (dto.guestName || dto.guestPhone || dto.guestEmail || dto.guestNationality) {
        await tx.guest.update({
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

        const roomType = await tx.roomType.findFirst({
          where: { id: newRoomTypeId, propertyId: booking.propertyId, isActive: true },
        });
        if (!roomType) throw new NotFoundException('Room type not found');

        const overlapping = await tx.booking.count({
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

      // Handle room assignment and validation
      if (dto.roomUnitId !== undefined) {
        if (dto.roomUnitId === null) {
          updateData.roomUnitId = null;
        } else {
          const unit = await tx.roomUnit.findFirst({
            where: { id: dto.roomUnitId, propertyId: booking.propertyId, roomTypeId: newRoomTypeId },
          });
          if (!unit) {
            throw new NotFoundException('Selected room unit not found or does not match room category');
          }
          if (unit.cleanlinessStatus === CleanlinessStatus.OUT_OF_ORDER) {
            throw new ConflictException(`Selected room unit ${unit.unitNumber} is currently Out of Order for maintenance`);
          }
          if (unit.cleanlinessStatus === CleanlinessStatus.DIRTY && booking.status === BookingStatus.CHECKED_IN) {
            throw new ConflictException(`Cannot assign a dirty room (${unit.unitNumber}) to a checked-in booking`);
          }

          const unitOverlap = await tx.booking.count({
            where: {
              propertyId: booking.propertyId,
              roomUnitId: dto.roomUnitId,
              id: { not: bookingId },
              status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
              deletedAt: null,
              checkInDate: { lt: newCheckOut },
              checkOutDate: { gt: newCheckIn },
            },
          });
          if (unitOverlap > 0) {
            throw new ConflictException(`Selected room unit ${unit.unitNumber} is already booked for these dates`);
          }
          updateData.roomUnitId = dto.roomUnitId;
        }
      }

      // Recalculate amounts if baseAmount changed
      if (dto.baseAmount !== undefined) {
        const settings = await tx.propertySettings.findUnique({
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

        // Aggregate all payments logged so far to preserve accurate balanceDue
        const paymentAggregate = await tx.payment.aggregate({
          where: { bookingId },
          _sum: { amount: true },
        });
        const totalPaidSoFar = paymentAggregate._sum.amount || advancePaid;
        const newTotalAmount = baseAmount.add(gstAmount);

        updateData.baseAmount = baseAmount;
        updateData.gstAmount = gstAmount;
        updateData.totalAmount = newTotalAmount;
        updateData.advancePaid = advancePaid;
        updateData.balanceDue = newTotalAmount.sub(totalPaidSoFar);
      } else if (dto.advancePaid !== undefined) {
        const advancePaid = new Prisma.Decimal(dto.advancePaid);
        const paymentAggregate = await tx.payment.aggregate({
          where: { bookingId },
          _sum: { amount: true },
        });
        const totalPaidSoFar = paymentAggregate._sum.amount || advancePaid;

        updateData.advancePaid = advancePaid;
        updateData.balanceDue = booking.totalAmount.sub(totalPaidSoFar);
      }

      // Update facilities if provided
      if (dto.facilityIds) {
        await tx.bookingFacility.deleteMany({ where: { bookingId } });

        if (dto.facilityIds.length > 0) {
          const amenities = await tx.amenity.findMany({
            where: { id: { in: dto.facilityIds }, propertyId: booking.propertyId, isActive: true },
          });
          await tx.bookingFacility.createMany({
            data: amenities.map((a) => ({
              bookingId,
              amenityId: a.id,
              quantity: 1,
              priceAtBooking: a.price,
            })),
          });
        }
      }

      // Update TAC accounting if baseAmount changed on pending agency booking
      if (dto.baseAmount !== undefined && booking.agencyId && booking.tacStatus === TacStatus.PENDING) {
        const agency = await tx.agency.findUnique({ where: { id: booking.agencyId } });
        if (agency?.defaultTacRate) {
          const newBase = new Prisma.Decimal(dto.baseAmount);
          const oldTac = booking.tacAmount || booking.baseAmount.mul(agency.defaultTacRate).div(100);
          const newTac = newBase.mul(agency.defaultTacRate).div(100);
          const diff = newTac.minus(oldTac);

          if (!diff.isZero()) {
            updateData.tacAmount = newTac;
            await tx.agency.update({
              where: { id: booking.agencyId },
              data: {
                totalTac: { increment: diff },
                pendingTac: { increment: diff },
              },
            });
          }
        }
      }

      return tx.booking.update({
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
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
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

    // Verify property ownership/membership
    await this.helper.resolvePropertyId(userId, booking.propertyId);

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
   * Update Status (CHECKED_IN / CHECKED_OUT / REVERT) with accurate stats & TAC accounting
   */
  async updateBookingStatus(userId: string, bookingId: string, newStatus: BookingStatus) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      include: { guest: true, agency: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Verify property ownership/membership
    await this.helper.resolvePropertyId(userId, booking.propertyId);

    // Validate status transitions
    const validTransitions: Record<string, BookingStatus[]> = {
      [BookingStatus.CONFIRMED]: [BookingStatus.CHECKED_IN, BookingStatus.CANCELLED],
      [BookingStatus.CHECKED_IN]: [BookingStatus.CHECKED_OUT, BookingStatus.CONFIRMED],
      [BookingStatus.CHECKED_OUT]: [BookingStatus.CHECKED_IN, BookingStatus.CONFIRMED],
      [BookingStatus.CANCELLED]: [BookingStatus.CONFIRMED],
      [BookingStatus.NO_SHOW]: [BookingStatus.CONFIRMED],
    };

    const allowed = validTransitions[booking.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${booking.status} to ${newStatus}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Validate check-in room assignment and status
      if (newStatus === BookingStatus.CHECKED_IN) {
        if (!booking.roomUnitId) {
          throw new BadRequestException('Guest must be assigned a room unit before check-in.');
        }

        const assignedUnit = await tx.roomUnit.findUnique({
          where: { id: booking.roomUnitId },
          select: { unitNumber: true, cleanlinessStatus: true },
        });

        if (assignedUnit) {
          if (assignedUnit.cleanlinessStatus === CleanlinessStatus.OUT_OF_ORDER) {
            throw new BadRequestException(
              `Cannot check in guest: Room "${assignedUnit.unitNumber}" is currently OUT OF ORDER for maintenance.`,
            );
          }
          if (assignedUnit.cleanlinessStatus === CleanlinessStatus.DIRTY) {
            throw new BadRequestException(
              `Cannot check in guest: Room "${assignedUnit.unitNumber}" is currently DIRTY and must be cleaned first.`,
            );
          }
        }
      }
      // 1. If transitioning TO CHECKED_OUT (and wasn't already checked out), increment guest total spend
      if (newStatus === BookingStatus.CHECKED_OUT && booking.status !== BookingStatus.CHECKED_OUT) {
        await tx.guest.update({
          where: { id: booking.guestId },
          data: {
            lastStayAt: new Date(),
            totalSpend: { increment: booking.totalAmount },
          },
        });
      }

      // 2. If REVERTING FROM CHECKED_OUT, decrement guest total spend to avoid duplicate inflation
      if (booking.status === BookingStatus.CHECKED_OUT && newStatus !== BookingStatus.CHECKED_OUT) {
        await tx.guest.update({
          where: { id: booking.guestId },
          data: {
            totalSpend: { decrement: booking.totalAmount },
          },
        });
      }

      // 3. If REVERTING FROM CANCELLED back to CONFIRMED (restore pending TAC for agency bookings)
      let restoredTacStatus = booking.tacStatus;
      if (booking.status === BookingStatus.CANCELLED && newStatus === BookingStatus.CONFIRMED && booking.agencyId) {
        const agency = await tx.agency.findUnique({ where: { id: booking.agencyId } });
        if (agency?.defaultTacRate) {
          const tacAmount = booking.baseAmount.mul(agency.defaultTacRate).div(100);
          await tx.agency.update({
            where: { id: booking.agencyId },
            data: {
              totalTac: { increment: tacAmount },
              pendingTac: { increment: tacAmount },
            },
          });
          restoredTacStatus = TacStatus.PENDING;
        }
      }

      // 4. If transitioning TO CHECKED_OUT, mark room unit as DIRTY & create housekeeping task
      if (newStatus === BookingStatus.CHECKED_OUT) {
        if (!booking.roomUnitId) {
          throw new BadRequestException('Cannot check-out a booking that has no room unit assigned.');
        }

        const targetUnitId = booking.roomUnitId;

        await tx.roomUnit.update({
          where: { id: targetUnitId },
          data: { cleanlinessStatus: CleanlinessStatus.DIRTY },
        });

        await tx.housekeepingTask.create({
          data: {
            propertyId: booking.propertyId,
            roomUnitId: targetUnitId,
            status: TaskStatus.PENDING,
            reportedIssue: `Auto-generated cleaning task on guest check-out (${booking.guest.fullName})`,
          },
        });
      }

      return tx.booking.update({
        where: { id: bookingId },
        data: {
          status: newStatus,
          tacStatus: restoredTacStatus,
        },
        include: {
          guest: true,
          roomType: true,
          agency: true,
          createdByUser: { select: { id: true, email: true, role: true } },
        },
      });
    });
  }
}
