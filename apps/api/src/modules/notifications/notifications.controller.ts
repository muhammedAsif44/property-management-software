import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationType, UserRole, DevicePlatform } from '@prisma/client';

@Controller({ version: '1' })
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('admin/notifications')
  async createNotification(
    @CurrentUser() user: any,
    @Body() dto: {
      title: string;
      message: string;
      type?: NotificationType;
      targetRole?: UserRole;
      targetPropertyId?: string;
      expiresAt?: string;
    },
  ) {
    return this.notificationsService.createNotification({
      organizationId: user.organizationId,
      title: dto.title,
      message: dto.message,
      type: dto.type,
      targetRole: dto.targetRole,
      targetPropertyId: dto.targetPropertyId,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      createdByUserId: user.id,
    });
  }

  @Get('notifications')
  async getUserNotifications(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.getUserNotifications(user.id, user.organizationId, { page, limit });
  }

  @Post('notifications/:id/read')
  async markAsRead(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    await this.notificationsService.markAsRead(id, user.id);
    return { success: true };
  }

  @Post('admin/notifications/broadcast')
  async broadcastAnnouncement(
    @CurrentUser() user: any,
    @Body() dto: {
      title: string;
      message: string;
      type?: NotificationType;
      targetRole?: UserRole | 'ALL';
      organizationId?: string;
    },
  ) {
    return this.notificationsService.broadcastAnnouncement({
      title: dto.title,
      message: dto.message,
      type: dto.type,
      targetRole: dto.targetRole,
      organizationId: dto.organizationId,
      createdByUserId: user.id,
    });
  }

  @Post('notifications/device-tokens')
  async registerDeviceToken(
    @CurrentUser() user: any,
    @Body() dto: { pushToken: string; platform: DevicePlatform },
  ) {
    await this.notificationsService.registerDeviceToken(user.id, dto.pushToken, dto.platform);
    return { success: true };
  }
}

