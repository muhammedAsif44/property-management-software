import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller({ path: 'analytics', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.SUPER_ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /api/v1/analytics/dashboard
   * Retrieves real-time property aggregations (Revenue, Check-ins, Occupancy, Bookings Feed, TAC).
   */
  @Get('dashboard')
  async getDashboardAnalytics(
    @Req() req: any,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getDashboardAnalytics(req.user.id, query.propertyId);
  }

  /**
   * POST /api/v1/analytics/auto-checkout
   * Triggers automated check-out processing for expired stays.
   * Restricted to OWNER, MANAGER, and SUPER_ADMIN roles.
   */
  @Post('auto-checkout')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async triggerAutoCheckout(
    @Req() req: any,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.autoCheckoutExpiredBookings(req.user.id, query.propertyId);
  }
}
