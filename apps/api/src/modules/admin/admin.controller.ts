import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RejectOwnerDto } from './dto/reject-owner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller({ path: 'admin', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getPlatformDashboard() {
    return this.adminService.getPlatformDashboard();
  }

  @Get('tenants')
  async getAllTenants() {
    return this.adminService.getAllTenants();
  }

  @Get('tenants/:id')
  async getTenantDeepDive(@Param('id') id: string) {
    return this.adminService.getTenantDeepDive(id);
  }

  @Patch('tenants/:id/status')
  @HttpCode(HttpStatus.OK)
  async toggleOrganizationStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.adminService.toggleOrganizationStatus(id, body.status);
  }

  @Patch('users/:userId/block')
  @HttpCode(HttpStatus.OK)
  async toggleUserBlockStatus(
    @Param('userId') userId: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.adminService.toggleUserBlockStatus(userId, body.isActive);
  }

  @Get('backups')
  async getBackupLogs() {
    return this.adminService.getBackupLogs();
  }

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
    return this.adminService.getAllTenants();
  }

  // Invoice Templates Management
  @Get('invoice-templates')
  async getInvoiceTemplates() {
    return this.adminService.getInvoiceTemplates();
  }

  @Post('invoice-templates')
  async createInvoiceTemplate(
    @Body() dto: { name: string; htmlContent: string; isDefault?: boolean; organizationId?: string },
  ) {
    return this.adminService.createInvoiceTemplate(dto);
  }

  @Patch('invoice-templates/:id')
  async updateInvoiceTemplate(
    @Param('id') id: string,
    @Body() dto: { name?: string; htmlContent?: string; isDefault?: boolean },
  ) {
    return this.adminService.updateInvoiceTemplate(id, dto);
  }

  @Post('invoice-templates/:id/set-default')
  @HttpCode(HttpStatus.OK)
  async setDefaultInvoiceTemplate(@Param('id') id: string) {
    return this.adminService.setDefaultInvoiceTemplate(id);
  }
}

