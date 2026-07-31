import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { BookingHelperService } from './booking-helper.service';
import { RequestDeletionDto } from '../dto/request-deletion.dto';
import { DeletionRequestStatus } from '@prisma/client';

@Injectable()
export class BookingDeletionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly helper: BookingHelperService,
  ) {}

  /**
   * Soft Delete Booking (Owner / Manager / SuperAdmin)
   */
  async softDeleteBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Request Deletion (Reception Staff)
   */
  async requestDeletion(userId: string, bookingId: string, dto: RequestDeletionDto) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Check for existing pending request
    const existingRequest = await this.prisma.bookingDeletionRequest.findFirst({
      where: { bookingId, status: DeletionRequestStatus.PENDING },
    });
    if (existingRequest) {
      throw new ConflictException('A deletion request for this booking is already pending');
    }

    return this.prisma.bookingDeletionRequest.create({
      data: {
        bookingId,
        requestedById: userId,
        reason: dto.reason,
        status: DeletionRequestStatus.PENDING,
      },
      include: {
        booking: { include: { guest: true, roomType: true } },
        requestedBy: { select: { id: true, email: true, role: true } },
      },
    });
  }

  /**
   * Approve Deletion (Owner / Manager)
   */
  async approveDeletion(userId: string, requestId: string) {
    const request = await this.prisma.bookingDeletionRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Deletion request not found');
    if (request.status !== DeletionRequestStatus.PENDING) {
      throw new BadRequestException('This request has already been decided');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.bookingDeletionRequest.update({
        where: { id: requestId },
        data: {
          status: DeletionRequestStatus.APPROVED,
          decidedById: userId,
          decidedAt: new Date(),
        },
        include: {
          booking: { include: { guest: true } },
          requestedBy: { select: { id: true, email: true } },
        },
      });

      await tx.booking.update({
        where: { id: request.bookingId },
        data: { deletedAt: new Date() },
      });

      return updated;
    });
  }

  /**
   * Reject Deletion (Owner / Manager)
   */
  async rejectDeletion(userId: string, requestId: string) {
    const request = await this.prisma.bookingDeletionRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Deletion request not found');
    if (request.status !== DeletionRequestStatus.PENDING) {
      throw new BadRequestException('This request has already been decided');
    }

    return this.prisma.bookingDeletionRequest.update({
      where: { id: requestId },
      data: {
        status: DeletionRequestStatus.REJECTED,
        decidedById: userId,
        decidedAt: new Date(),
      },
      include: {
        booking: { include: { guest: true } },
        requestedBy: { select: { id: true, email: true } },
      },
    });
  }

  /**
   * Get Deletion Requests Queue for Manager / Owner
   */
  async getDeletionRequests(userId: string, propertyId?: string) {
    const resolvedPropertyId = await this.helper.resolvePropertyId(userId, propertyId);

    return this.prisma.bookingDeletionRequest.findMany({
      where: {
        status: DeletionRequestStatus.PENDING,
        booking: { propertyId: resolvedPropertyId, deletedAt: null },
      },
      include: {
        booking: {
          include: {
            guest: true,
            roomType: true,
          },
        },
        requestedBy: { select: { id: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
