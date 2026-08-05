import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { SettleAgencyDto } from './dto/settle-agency.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller({ version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  /**
   * POST /api/v1/properties/:id/agencies
   * Register a new travel agency (Owner, Manager, Super Admin)
   */
  @Post('properties/:id/agencies')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async createAgency(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) propertyId: string,
    @Body() dto: CreateAgencyDto,
  ) {
    return this.agenciesService.createAgency(user.id, propertyId, dto);
  }

  /**
   * GET /api/v1/properties/:id/agencies
   * List agencies & TAC summaries for a property
   */
  @Get('properties/:id/agencies')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.SUPER_ADMIN)
  async getAgencies(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) propertyId: string,
  ) {
    return this.agenciesService.getAgencies(user.id, propertyId);
  }

  /**
   * GET /api/v1/agencies/:id
   * Get single agency detail with bookings and settlements
   */
  @Get('agencies/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.SUPER_ADMIN)
  async getAgencyDetails(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) agencyId: string,
  ) {
    return this.agenciesService.getAgencyDetails(user.id, agencyId);
  }

  /**
   * POST /api/v1/agencies/:id/settle
   * Settle pending agency commission (Owner, Manager ONLY!)
   */
  @Post('agencies/:id/settle')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async settleCommission(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) agencyId: string,
    @Body() dto: SettleAgencyDto,
    @Headers('Idempotency-Key') idempotencyKey: string,
  ) {
    return this.agenciesService.settleCommission(user.id, agencyId, dto, idempotencyKey);
  }
}
