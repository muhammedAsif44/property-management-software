import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { RequestDeletionDto } from './dto/request-deletion.dto';
import { BookingFiltersDto } from './dto/booking-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, BookingStatus } from '@prisma/client';

@Controller({ path: 'bookings', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * POST /api/v1/bookings
   * Create a new booking (supports Idempotency-Key header)
   */
  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.SUPER_ADMIN)
  async createBooking(
    @Req() req: any,
    @Body() dto: CreateBookingDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.bookingsService.createBooking(req.user.id, dto, idempotencyKey);
  }

  /**
   * GET /api/v1/bookings
   * List bookings with filters & pagination
   */
  @Get()
  async getBookings(@Req() req: any, @Query() filters: BookingFiltersDto) {
    return this.bookingsService.getBookings(req.user.id, filters);
  }

  /**
   * GET /api/v1/bookings/occupancy
   * Occupancy calendar/tape chart data
   */
  @Get('occupancy')
  async getOccupancy(
    @Req() req: any,
    @Query('propertyId') propertyId: string,
    @Query('from') fromDate: string,
    @Query('to') toDate: string,
  ) {
    return this.bookingsService.getOccupancy(req.user.id, propertyId, fromDate, toDate);
  }

  /**
   * GET /api/v1/bookings/:id
   * Get booking detail
   */
  @Get(':id')
  async getBookingById(@Req() req: any, @Param('id') id: string) {
    return this.bookingsService.getBookingById(req.user.id, id);
  }

  /**
   * PATCH /api/v1/bookings/:id
   * Update/edit an existing booking
   */
  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.SUPER_ADMIN)
  async updateBooking(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookingsService.updateBooking(req.user.id, id, dto);
  }

  /**
   * POST /api/v1/bookings/:id/cancel
   * Cancel booking with refund/forfeit
   */
  @Post(':id/cancel')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.SUPER_ADMIN)
  async cancelBooking(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(req.user.id, id, dto);
  }

  /**
   * POST /api/v1/bookings/:id/check-in
   * Transition booking to CHECKED_IN
   */
  @Post(':id/check-in')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.SUPER_ADMIN)
  async checkIn(@Req() req: any, @Param('id') id: string) {
    return this.bookingsService.updateBookingStatus(req.user.id, id, BookingStatus.CHECKED_IN);
  }

  /**
   * POST /api/v1/bookings/:id/check-out
   * Transition booking to CHECKED_OUT
   */
  @Post(':id/check-out')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.SUPER_ADMIN)
  async checkOut(@Req() req: any, @Param('id') id: string) {
    return this.bookingsService.updateBookingStatus(req.user.id, id, BookingStatus.CHECKED_OUT);
  }

  /**
   * DELETE /api/v1/bookings/:id
   * Soft delete booking (Owner/Manager/SuperAdmin only)
   */
  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async softDeleteBooking(@Req() req: any, @Param('id') id: string) {
    return this.bookingsService.softDeleteBooking(req.user.id, id);
  }

  /**
   * POST /api/v1/bookings/:id/request-deletion
   * Reception staff requests deletion
   */
  @Post(':id/request-deletion')
  @Roles(UserRole.RECEPTION_STAFF)
  async requestDeletion(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: RequestDeletionDto,
  ) {
    return this.bookingsService.requestDeletion(req.user.id, id, dto);
  }

  /**
   * GET /api/v1/bookings/deletion-requests
   * Manager approval queue
   */
  @Get('deletion-requests/pending')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getDeletionRequests(
    @Req() req: any,
    @Query('propertyId') propertyId?: string,
  ) {
    return this.bookingsService.getDeletionRequests(req.user.id, propertyId);
  }

  /**
   * POST /api/v1/bookings/deletion-requests/:id/approve
   * Approve deletion request
   */
  @Post('deletion-requests/:id/approve')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async approveDeletion(@Req() req: any, @Param('id') id: string) {
    return this.bookingsService.approveDeletion(req.user.id, id);
  }

  /**
   * POST /api/v1/bookings/deletion-requests/:id/reject
   * Reject deletion request
   */
  @Post('deletion-requests/:id/reject')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async rejectDeletion(@Req() req: any, @Param('id') id: string) {
    return this.bookingsService.rejectDeletion(req.user.id, id);
  }
}
