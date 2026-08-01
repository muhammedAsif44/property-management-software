import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { HousekeepingService } from './housekeeping.service';
import { CreateRoomUnitDto } from './dto/create-room-unit.dto';
import { UpdateRoomUnitDto } from './dto/update-room-unit.dto';
import { UpdateUnitStatusDto } from './dto/update-unit-status.dto';
import { BatchGenerateUnitsDto } from './dto/batch-generate-units.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, CleanlinessStatus, TaskStatus } from '@prisma/client';

@Controller({ path: 'housekeeping', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class HousekeepingController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  /**
   * GET /api/v1/housekeeping/units
   * Fetch room units & summary (Accessible by ALL staff roles including HOUSEKEEPING)
   */
  @Get('units')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.HOUSEKEEPING, UserRole.SUPER_ADMIN)
  async getUnits(
    @Req() req: any,
    @Query('propertyId') propertyId?: string,
    @Query('roomTypeId') roomTypeId?: string,
    @Query('status') status?: CleanlinessStatus,
  ) {
    return this.housekeepingService.getUnits(req.user.id, propertyId, roomTypeId, status);
  }

  /**
   * PATCH /api/v1/housekeeping/units/:id/status
   * Update cleanliness status of a room unit
   */
  @Patch('units/:id/status')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.HOUSEKEEPING, UserRole.SUPER_ADMIN)
  async updateUnitStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUnitStatusDto,
  ) {
    return this.housekeepingService.updateUnitStatus(req.user.id, id, dto);
  }

  /**
   * POST /api/v1/housekeeping/units
   * Create custom named room (e.g. Lotus, Lilly, Rose, Villa Sunset)
   */
  @Post('units')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async createUnit(@Req() req: any, @Body() dto: CreateRoomUnitDto) {
    return this.housekeepingService.createUnit(req.user.id, dto);
  }

  /**
   * PATCH /api/v1/housekeeping/units/:id
   * Update room unit name or details (e.g. rename room to Lotus or Lilly)
   */
  @Patch('units/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async updateUnit(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateRoomUnitDto) {
    return this.housekeepingService.updateUnit(req.user.id, id, dto);
  }

  /**
   * DELETE /api/v1/housekeeping/units/:id
   * Delete a room unit (Owner & Manager only)
   */
  @Delete('units/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async deleteUnit(@Req() req: any, @Param('id') id: string) {
    return this.housekeepingService.deleteUnit(req.user.id, id);
  }

  /**
   * POST /api/v1/housekeeping/units/batch-generate
   * Auto-generate room units from room type (Owner & Manager only)
   */
  @Post('units/batch-generate')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async batchGenerateUnits(
    @Req() req: any,
    @Body() dto: BatchGenerateUnitsDto,
  ) {
    return this.housekeepingService.batchGenerateUnits(req.user.id, dto);
  }

  /**
   * GET /api/v1/housekeeping/tasks
   * Fetch housekeeping & maintenance tasks
   */
  @Get('tasks')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.HOUSEKEEPING, UserRole.SUPER_ADMIN)
  async getTasks(
    @Req() req: any,
    @Query('propertyId') propertyId?: string,
    @Query('status') status?: TaskStatus,
  ) {
    return this.housekeepingService.getTasks(req.user.id, propertyId, status);
  }

  /**
   * POST /api/v1/housekeeping/tasks
   * Create a cleaning or maintenance task
   */
  @Post('tasks')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.HOUSEKEEPING, UserRole.SUPER_ADMIN)
  async createTask(
    @Req() req: any,
    @Body() dto: CreateTaskDto,
  ) {
    return this.housekeepingService.createTask(req.user.id, dto);
  }

  /**
   * PATCH /api/v1/housekeeping/tasks/:id
   * Update task state or report issue
   */
  @Patch('tasks/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.HOUSEKEEPING, UserRole.SUPER_ADMIN)
  async updateTask(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.housekeepingService.updateTask(req.user.id, id, dto);
  }
}
