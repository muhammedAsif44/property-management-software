import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BookingHelperService } from './services/booking-helper.service';
import { BookingCreationService } from './services/booking-creation.service';
import { BookingLifecycleService } from './services/booking-lifecycle.service';
import { BookingDeletionService } from './services/booking-deletion.service';
import { BookingOccupancyService } from './services/booking-occupancy.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { RequestDeletionDto } from './dto/request-deletion.dto';
import { BookingFiltersDto } from './dto/booking-filters.dto';
import { BookingStatus, Prisma } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly helper: BookingHelperService,
    private readonly creationService: BookingCreationService,
    private readonly lifecycleService: BookingLifecycleService,
    private readonly deletionService: BookingDeletionService,
    private readonly occupancyService: BookingOccupancyService,
  ) {}

  // 1. Create Booking
  async createBooking(userId: string, dto: CreateBookingDto, idempotencyKey?: string) {
    return this.creationService.createBooking(userId, dto, idempotencyKey);
  }

  // 2. Update Booking
  async updateBooking(userId: string, bookingId: string, dto: UpdateBookingDto) {
    return this.lifecycleService.updateBooking(userId, bookingId, dto);
  }

  // 3. Cancel Booking
  async cancelBooking(userId: string, bookingId: string, dto: CancelBookingDto) {
    return this.lifecycleService.cancelBooking(userId, bookingId, dto);
  }

  // 4. Update Booking Status (Check-in / Check-out)
  async updateBookingStatus(userId: string, bookingId: string, newStatus: BookingStatus) {
    return this.lifecycleService.updateBookingStatus(userId, bookingId, newStatus);
  }

  // 5. Soft Delete Booking
  async softDeleteBooking(userId: string, bookingId: string) {
    return this.deletionService.softDeleteBooking(userId, bookingId);
  }

  // 6. Request Deletion
  async requestDeletion(userId: string, bookingId: string, dto: RequestDeletionDto) {
    return this.deletionService.requestDeletion(userId, bookingId, dto);
  }

  // 7. Approve Deletion
  async approveDeletion(userId: string, requestId: string) {
    return this.deletionService.approveDeletion(userId, requestId);
  }

  // 8. Reject Deletion
  async rejectDeletion(userId: string, requestId: string) {
    return this.deletionService.rejectDeletion(userId, requestId);
  }

  // 9. Get Deletion Requests
  async getDeletionRequests(userId: string, propertyId?: string) {
    return this.deletionService.getDeletionRequests(userId, propertyId);
  }

  // 10. Occupancy Calendar
  async getOccupancy(userId: string, propertyId: string, fromDate: string, toDate: string) {
    return this.occupancyService.getOccupancy(userId, propertyId, fromDate, toDate);
  }

  // 11. Get Bookings (Paginated + Filtered)
  async getBookings(userId: string, filters: BookingFiltersDto) {
    const propertyId = await this.helper.resolvePropertyId(userId, filters.propertyId);
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {
      propertyId,
      deletedAt: null,
    };

    if (filters.status) where.status = filters.status;
    if (filters.channel) where.channel = filters.channel;

    if (filters.fromDate || filters.toDate) {
      where.checkInDate = {};
      if (filters.fromDate) (where.checkInDate as any).gte = new Date(filters.fromDate);
      if (filters.toDate) (where.checkInDate as any).lte = new Date(filters.toDate);
    }

    if (filters.guestSearch) {
      where.guest = {
        OR: [
          { fullName: { contains: filters.guestSearch, mode: 'insensitive' } },
          { phone: { contains: filters.guestSearch } },
          { email: { contains: filters.guestSearch, mode: 'insensitive' } },
        ],
      };
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          guest: true,
          roomType: true,
          agency: true,
          createdByUser: { select: { id: true, email: true, role: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 12. Get Booking By ID
  async getBookingById(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      include: {
        guest: true,
        roomType: true,
        agency: true,
        bookingFacilities: { include: { amenity: true } },
        createdByUser: { select: { id: true, email: true, role: true } },
        payments: true,
        deletionRequests: {
          include: {
            requestedBy: { select: { id: true, email: true } },
            decidedBy: { select: { id: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }
}
