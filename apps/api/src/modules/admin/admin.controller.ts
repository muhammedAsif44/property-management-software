import { Controller, Get, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RejectOwnerDto } from './dto/reject-owner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('pending-owners')
  async getPendingOwners(@Query('status') status?: string) {
    return this.adminService.getPendingOwners(status);
  }

  @Patch('owners/:userId/approve')
  @HttpCode(HttpStatus.OK)
  async approveOwner(@Param('userId') userId: string) {
    return this.adminService.approveOwner(userId);
  }

  @Patch('owners/:userId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectOwner(
    @Param('userId') userId: string,
    @Body() dto: RejectOwnerDto,
  ) {
    return this.adminService.rejectOwner(userId, dto);
  }

  @Get('organizations')
  async getAllOrganizations() {
    return this.adminService.getAllOrganizations();
  }
}
