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
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
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
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateBookingDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.bookingsService.createBooking(user.id, dto, idempotencyKey);
  }

  /**
   * GET /api/v1/bookings
   * List bookings with filters & pagination
   */
  @Get()
  async getBookings(@CurrentUser() user: AuthUser, @Query() filters: BookingFiltersDto) {
    return this.bookingsService.getBookings(user.id, filters);
  }

  /**
   * GET /api/v1/bookings/occupancy
   * Occupancy calendar/tape chart data
   */
  @Get('occupancy')
  async getOccupancy(
    @CurrentUser() user: AuthUser,
    @Query('propertyId') propertyId: string,
    @Query('from') fromDate: string,
    @Query('to') toDate: string,
  ) {
    return this.bookingsService.getOccupancy(user.id, propertyId, fromDate, toDate);
  }

  /**
   * GET /api/v1/bookings/:id
   * Get booking detail
   */
  @Get(':id')
  async getBookingById(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.getBookingById(user.id, id);
  }

  /**
   * PATCH /api/v1/bookings/:id
   * Update/edit an existing booking
   */
  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.SUPER_ADMIN)
  async updateBooking(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookingsService.updateBooking(user.id, id, dto);
  }

  /**
   * POST /api/v1/bookings/:id/cancel
   * Cancel booking with refund/forfeit
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.SUPER_ADMIN)
  async cancelBooking(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(user.id, id, dto);
  }

  /**
   * POST /api/v1/bookings/:id/check-in
   * Transition booking to CHECKED_IN
   */
  @Post(':id/check-in')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.SUPER_ADMIN)
  async checkIn(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.updateBookingStatus(user.id, id, BookingStatus.CHECKED_IN);
  }

  /**
   * POST /api/v1/bookings/:id/check-out
   * Transition booking to CHECKED_OUT
   */
  @Post(':id/check-out')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.SUPER_ADMIN)
  async checkOut(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.updateBookingStatus(user.id, id, BookingStatus.CHECKED_OUT);
  }

  /**
   * POST /api/v1/bookings/:id/status
   * Revert or update booking status (supports accidental status change reversal)
   */
  @Post(':id/status')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.SUPER_ADMIN)
  async updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: BookingStatus,
  ) {
    return this.bookingsService.updateBookingStatus(user.id, id, status);
  }

  /**
   * DELETE /api/v1/bookings/:id
   * Soft delete booking (Owner/Manager/SuperAdmin only)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async softDeleteBooking(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.softDeleteBooking(user.id, id);
  }

  /**
   * POST /api/v1/bookings/:id/request-deletion
   * Reception staff requests deletion
   */
  @Post(':id/request-deletion')
  @Roles(UserRole.RECEPTION_STAFF)
  async requestDeletion(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RequestDeletionDto,
  ) {
    return this.bookingsService.requestDeletion(user.id, id, dto);
  }

  /**
   * GET /api/v1/bookings/deletion-requests
   * Manager approval queue
   */
  @Get('deletion-requests/pending')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getDeletionRequests(
    @CurrentUser() user: AuthUser,
    @Query('propertyId') propertyId?: string,
  ) {
    return this.bookingsService.getDeletionRequests(user.id, propertyId);
  }

  /**
   * POST /api/v1/bookings/deletion-requests/:id/approve
   * Approve deletion request
   */
  @Post('deletion-requests/:id/approve')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async approveDeletion(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.approveDeletion(user.id, id);
  }

  /**
   * POST /api/v1/bookings/deletion-requests/:id/reject
   * Reject deletion request
   */
  @Post('deletion-requests/:id/reject')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async rejectDeletion(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.rejectDeletion(user.id, id);
  }
}
