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
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
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
    @CurrentUser() user: AuthUser,
    @Query('propertyId') propertyId?: string,
  ) {
    return this.staffService.getStaffDirectory(user.id, propertyId);
  }

  /**
   * POST /api/v1/staff/invite
   * Invite staff member by email (Accessible by Owner & Manager)
   */
  @Post('invite')
  async inviteStaff(@CurrentUser() user: AuthUser, @Body() dto: InviteStaffDto) {
    return this.staffService.inviteStaff(user.id, dto);
  }

  /**
   * PATCH /api/v1/staff/:id/role
   * Update staff member role (Accessible by Owner & Manager)
   */
  @Patch(':id/role')
  async updateStaffRole(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffRoleDto,
  ) {
    return this.staffService.updateStaffRole(user.id, id, dto);
  }

  /**
   * PATCH /api/v1/staff/:id/suspend
   * Suspend staff member access (Accessible by Owner & Manager)
   */
  @Patch(':id/suspend')
  async suspendStaff(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.staffService.suspendStaff(user.id, id);
  }

  /**
   * PATCH /api/v1/staff/:id/reactivate
   * Reactivate suspended staff member access (Accessible by Owner & Manager)
   */
  @Patch(':id/reactivate')
  async reactivateStaff(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.staffService.reactivateStaff(user.id, id);
  }

  /**
   * POST /api/v1/staff/:id/resend-invite
   * Resend staff invite (Accessible by Owner & Manager)
   */
  @Post(':id/resend-invite')
  @HttpCode(HttpStatus.OK)
  async resendInvite(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.staffService.resendInvite(user.id, id);
  }

  /**
   * DELETE /api/v1/staff/:id
   * Permanently delete staff member record (Restricted STRICTLY to OWNER & SUPER_ADMIN)
   * If a Manager calls this, it returns HTTP 403 Forbidden!
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.SUPER_ADMIN) // Hard override to block managers
  async removeStaffMember(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.staffService.deleteStaffPermanently(user.id, id);
  }
}
