import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateStaffRoleDto } from './dto/update-staff-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller({ path: 'staff', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  /**
   * GET /api/v1/staff
   * List staff directory for the property (Accessible by Owner & Manager)
   */
  @Get()
  async getStaffDirectory(
    @Req() req: any,
    @Query('propertyId') propertyId?: string,
  ) {
    return this.staffService.getStaffDirectory(req.user.id, propertyId);
  }

  /**
   * POST /api/v1/staff/invite
   * Invite staff member by email (Accessible by Owner & Manager)
   */
  @Post('invite')
  async inviteStaff(@Req() req: any, @Body() dto: InviteStaffDto) {
    return this.staffService.inviteStaff(req.user.id, dto);
  }

  /**
   * PATCH /api/v1/staff/:id/role
   * Update staff member role (Accessible by Owner & Manager)
   */
  @Patch(':id/role')
  async updateStaffRole(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateStaffRoleDto,
  ) {
    return this.staffService.updateStaffRole(req.user.id, id, dto);
  }

  /**
   * PATCH /api/v1/staff/:id/suspend
   * Suspend staff member access (Accessible by Owner & Manager)
   */
  @Patch(':id/suspend')
  async suspendStaff(@Req() req: any, @Param('id') id: string) {
    return this.staffService.suspendStaff(req.user.id, id);
  }

  /**
   * PATCH /api/v1/staff/:id/reactivate
   * Reactivate suspended staff member access (Accessible by Owner & Manager)
   */
  @Patch(':id/reactivate')
  async reactivateStaff(@Req() req: any, @Param('id') id: string) {
    return this.staffService.reactivateStaff(req.user.id, id);
  }

  /**
   * DELETE /api/v1/staff/:id
   * Permanently delete staff member record (Restricted STRICTLY to OWNER & SUPER_ADMIN)
   * If a Manager calls this, it returns HTTP 403 Forbidden!
   */
  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.SUPER_ADMIN)
  async deleteStaffPermanently(@Req() req: any, @Param('id') id: string) {
    return this.staffService.deleteStaffPermanently(req.user.id, id);
  }
}
