import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, NotificationType, UserRole, DevicePlatform } from '@prisma/client';
import { EventsGateway } from '../realtime/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async createNotification(data: {
    organizationId: string;
    title: string;
    message: string;
    type?: NotificationType;
    targetRole?: UserRole;
    targetPropertyId?: string;
    expiresAt?: Date;
    createdByUserId?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        organizationId: data.organizationId,
        title: data.title,
        message: data.message,
        type: data.type || NotificationType.SYSTEM,
        targetRole: data.targetRole,
        targetPropertyId: data.targetPropertyId,
        expiresAt: data.expiresAt,
        createdByUserId: data.createdByUserId,
      },
    });

    // Emit WebSocket live notification event to connected clients
    if (data.targetPropertyId) {
      this.eventsGateway.emitToProperty(data.targetPropertyId, 'notification_created', {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
      });
    } else {
      this.eventsGateway.server?.emit('notification_created', {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
      });
    }

    return notification;
  }

  async getUserNotifications(userId: string, organizationId: string, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = options;

    // Determine the user's role and associated properties
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        staffMemberships: { select: { propertyId: true } },
        owner: { select: { id: true, defaultPropertyId: true } }
      }
    });

    if (!user) return { data: [], total: 0 };

    const propertyIds = user.staffMemberships.map(sm => sm.propertyId);
    if (user.owner?.defaultPropertyId && !propertyIds.includes(user.owner.defaultPropertyId)) {
      propertyIds.push(user.owner.defaultPropertyId);
    }

    // Build the query to fetch targeted notifications or global org notifications
    const where: Prisma.NotificationWhereInput = {
      organizationId,
      OR: [
        // Targeted to specific property the user belongs to
        { targetPropertyId: { in: propertyIds } },
        // Global to org, no property target
        { targetPropertyId: null }
      ],
      // Role targeting
      AND: [
        {
          OR: [
            { targetRole: null },
            { targetRole: user.role }
          ]
        },
        // Exclude expired
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      ]
    };

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          reads: {
            where: { userId }
          }
        }
      }),
      this.prisma.notification.count({ where })
    ]);

    // Format output with isRead boolean
    const data = notifications.map(n => {
      const { reads, ...rest } = n;
      return {
        ...rest,
        isRead: reads.length > 0
      };
    });

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    // Uses upsert so it's idempotent
    return this.prisma.notificationRead.upsert({
      where: {
        notificationId_userId: { notificationId, userId }
      },
      create: {
        notificationId,
        userId
      },
      update: {
        readAt: new Date()
      }
    });
  }

  async registerDeviceToken(userId: string, pushToken: string, platform: DevicePlatform) {
    const existing = await this.prisma.deviceToken.findFirst({
      where: { userId, pushToken }
    });

    if (existing) {
      return this.prisma.deviceToken.update({
        where: { id: existing.id },
        data: { lastActiveAt: new Date() }
      });
    }

    return this.prisma.deviceToken.create({
      data: {
        userId,
        pushToken,
        platform
      }
    });
  }
}
