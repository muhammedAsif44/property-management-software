import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CreateAuditLogOptions {
  organizationId: string;
  actorUserId: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeState?: any;
  afterState?: any;
  ipAddress?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Append-only audit trail logger
   */
  async log(options: CreateAuditLogOptions) {
    try {
      const entry = await this.prisma.auditLog.create({
        data: {
          organizationId: options.organizationId,
          actorUserId: options.actorUserId,
          entityType: options.entityType,
          entityId: options.entityId,
          action: options.action,
          beforeState: options.beforeState || null,
          afterState: options.afterState || null,
          ipAddress: options.ipAddress || null,
        },
      });

      this.logger.log(`📝 Immutable Audit Entry Logged: ${options.action} on ${options.entityType}:${options.entityId}`);
      return entry;
    } catch (error: any) {
      this.logger.error(`❌ Failed to log audit trail: ${error?.message}`, error?.stack);
    }
  }

  /**
   * Query audit logs per organization or entity
   */
  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      include: { actorUser: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
