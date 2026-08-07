import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RejectOwnerDto } from './dto/reject-owner.dto';
import { ApprovalStatus, UserRole, SyncType, BackupStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Platform-wide Dashboard Analytics (Excludes Super Admin accounts from customer statistics)
  async getPlatformDashboard() {
    const [
      totalTenants,
      totalProperties,
      totalBookings,
      totalRevenueResult,
      pendingApplications,
      totalUsersCount,
    ] = await Promise.all([
      // Count organization customer tenants
      this.prisma.organization.count(),
      // Count active properties
      this.prisma.property.count({ where: { deletedAt: null } }),
      // Count total bookings across all properties
      this.prisma.booking.count({ where: { deletedAt: null } }),
      // Aggregate revenue excluding deleted bookings
      this.prisma.booking.aggregate({
        where: { deletedAt: null },
        _sum: { totalAmount: true },
      }),
      // Count pending owner approval applications
      this.prisma.user.count({
        where: {
          role: UserRole.OWNER,
          approvalStatus: ApprovalStatus.PENDING,
          deletedAt: null,
        },
      }),
      // Count total customer users (excluding SUPER_ADMIN)
      this.prisma.user.count({
        where: {
          role: { not: UserRole.SUPER_ADMIN },
          deletedAt: null,
        },
      }),
    ]);

    const recentTenants = await this.prisma.organization.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { properties: true, users: true },
        },
        users: {
          where: { role: UserRole.OWNER },
          select: {
            id: true,
            email: true,
            approvalStatus: true,
            owner: { select: { fullName: true } },
          },
        },
      },
    });

    return {
      totalTenants,
      totalProperties,
      totalBookings,
      totalRevenue: Number(totalRevenueResult._sum.totalAmount || 0),
      pendingApplications,
      totalCustomerUsers: totalUsersCount,
      recentTenants,
    };
  }

  // 2. Tenant Directory List
  async getAllTenants() {
    const tenants = await this.prisma.organization.findMany({
      include: {
        _count: {
          select: {
            properties: true,
            users: true,
          },
        },
        users: {
          where: { role: UserRole.OWNER },
          select: {
            id: true,
            email: true,
            approvalStatus: true,
            owner: { select: { fullName: true } },
          },
        },
        properties: {
          where: { deletedAt: null },
          select: { id: true, name: true, city: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      count: tenants.length,
      tenants,
    };
  }

  // 3. Tenant Deep-Dive View (Bookings, Agencies, Staff, Backup History)
  async getTenantDeepDive(tenantId: string) {
    const tenant = await this.prisma.organization.findUnique({
      where: { id: tenantId },
      include: {
        properties: {
          where: { deletedAt: null },
          include: {
            roomTypes: { select: { id: true, name: true, totalUnits: true } },
            roomUnits: { select: { id: true, unitNumber: true, cleanlinessStatus: true } },
          },
        },
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            email: true,
            role: true,
            approvalStatus: true,
            createdAt: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant organization with ID "${tenantId}" not found`);
    }

    const propertyIds = tenant.properties.map((p) => p.id);

    // Aggregate Bookings, Agencies, and Backup History across tenant properties
    const [recentBookings, agencies, backupLogs] = await Promise.all([
      this.prisma.booking.findMany({
        where: { propertyId: { in: propertyIds }, deletedAt: null },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          guest: { select: { fullName: true, phone: true } },
          roomType: { select: { name: true } },
        },
      }),
      this.prisma.agency.findMany({
        where: { propertyId: { in: propertyIds } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.backupLog.findMany({
        where: { propertyId: { in: propertyIds } },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { property: { select: { name: true } } },
      }),
    ]);

    return {
      tenant,
      metrics: {
        totalProperties: tenant.properties.length,
        totalUsers: tenant.users.length,
        totalBookings: recentBookings.length,
        totalAgencies: agencies.length,
      },
      recentBookings,
      agencies,
      backupLogs,
    };
  }

  // 4. Backup Operation Logs Table API
  async getBackupLogs() {
    const logs = await this.prisma.backupLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            organization: { select: { name: true } },
          },
        },
      },
    });

    return {
      count: logs.length,
      logs,
    };
  }

  // 5. Helper to record Backup & Sync log entry
  async recordBackupLog(data: {
    propertyId: string;
    syncType?: SyncType;
    status?: BackupStatus;
    recordCounts?: any;
    errorMessage?: string;
  }) {
    return this.prisma.backupLog.create({
      data: {
        propertyId: data.propertyId,
        syncType: data.syncType || SyncType.MANUAL,
        status: data.status || BackupStatus.SUCCESS,
        recordCounts: data.recordCounts || { bookings: 0, guests: 0, units: 0 },
        errorMessage: data.errorMessage || null,
      },
    });
  }

  // 6. Get List of Owner Account Applications
  async getPendingOwners(status?: string) {
    const whereClause: any = {
      role: UserRole.OWNER,
      deletedAt: null,
    };

    if (status && status !== 'ALL') {
      whereClause.approvalStatus = status as ApprovalStatus;
    }

    const pendingUsers = await this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        approvalStatus: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            whatsappNumber: true,
            defaultProperty: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      count: pendingUsers.length,
      pendingOwners: pendingUsers,
    };
  }

  // 7. Approve Pending Owner Account
  async approveOwner(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { owner: true },
    });

    if (!user || user.deletedAt !== null) {
      throw new NotFoundException('User account not found');
    }

    if (user.role !== UserRole.OWNER) {
      throw new BadRequestException('Target user is not an Owner account');
    }

    if (user.approvalStatus === ApprovalStatus.APPROVED) {
      return { message: 'Owner account is already approved', user };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        approvalStatus: ApprovalStatus.APPROVED,
        rejectionReason: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        approvalStatus: true,
        organizationId: true,
      },
    });

    return {
      message: `Owner account (${user.email}) approved successfully. User can now log in.`,
      user: updatedUser,
    };
  }

  // 8. Reject Pending Owner Account with Rejection Reason
  async rejectOwner(userId: string, dto: RejectOwnerDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt !== null) {
      throw new NotFoundException('User account not found');
    }

    if (user.role !== UserRole.OWNER) {
      throw new BadRequestException('Target user is not an Owner account');
    }

    const rejectionReason = dto?.rejectionReason || 'Registration application was not approved by Super Admin.';

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        approvalStatus: ApprovalStatus.REJECTED,
        rejectionReason,
      },
      select: {
        id: true,
        email: true,
        role: true,
        approvalStatus: true,
        rejectionReason: true,
      },
    });

    // Revoke active refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return {
      message: `Owner account (${user.email}) rejected.`,
      user: updatedUser,
    };
  }

  // 9. Legacy alias for all organizations
  async getAllOrganizations() {
    return this.getAllTenants();
  }

  // 10. Toggle User Block Status (IsActive)
  async toggleUserBlockStatus(userId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot block Super Admin accounts');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, email: true, isActive: true, role: true },
    });

    if (!isActive) {
      // Revoke all active refresh tokens for the blocked user
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return {
      message: `User ${user.email} is now ${isActive ? 'active' : 'blocked'}.`,
      user: updatedUser,
    };
  }

  // 11. Toggle Tenant Organization Subscription Status (Suspend/Activate)
  async toggleOrganizationStatus(orgId: string, status: any) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { users: { select: { id: true } } },
    });

    if (!org) {
      throw new NotFoundException(`Organization with ID "${orgId}" not found`);
    }

    const updatedOrg = await this.prisma.organization.update({
      where: { id: orgId },
      data: { subscriptionStatus: status },
    });

    if (status === 'CANCELLED' || status === 'PAST_DUE') {
      const userIds = org.users.map((u) => u.id);
      await this.prisma.refreshToken.updateMany({
        where: { userId: { in: userIds }, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return {
      message: `Organization "${org.name}" status updated to ${status}.`,
      organization: updatedOrg,
    };
  }

  // 12. Invoice Templates Management
  async getInvoiceTemplates() {
    return this.prisma.invoiceTemplate.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      include: {
        organization: { select: { id: true, name: true } },
      },
    });
  }

  async createInvoiceTemplate(dto: {
    name: string;
    htmlContent: string;
    isDefault?: boolean;
    organizationId?: string;
  }) {
    // If no org ID specified, fallback to system org or default org
    let targetOrgId = dto.organizationId;
    if (!targetOrgId) {
      const systemOrg = await this.prisma.organization.findFirst({
        where: { slug: 'orvyn-system-admin' },
      });
      targetOrgId = systemOrg?.id || (await this.prisma.organization.findFirst())?.id;
    }

    if (!targetOrgId) {
      throw new BadRequestException('No organization found to attach template');
    }

    if (dto.isDefault) {
      await this.prisma.invoiceTemplate.updateMany({
        where: { organizationId: targetOrgId },
        data: { isDefault: false },
      });
    }

    return this.prisma.invoiceTemplate.create({
      data: {
        organizationId: targetOrgId,
        name: dto.name,
        htmlContent: dto.htmlContent,
        isDefault: dto.isDefault || false,
        status: 'PUBLISHED',
      },
    });
  }

  async updateInvoiceTemplate(
    id: string,
    dto: { name?: string; htmlContent?: string; isDefault?: boolean },
  ) {
    const template = await this.prisma.invoiceTemplate.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Invoice template with ID "${id}" not found`);
    }

    if (dto.isDefault) {
      await this.prisma.invoiceTemplate.updateMany({
        where: { organizationId: template.organizationId },
        data: { isDefault: false },
      });
    }

    return this.prisma.invoiceTemplate.update({
      where: { id },
      data: {
        name: dto.name ?? template.name,
        htmlContent: dto.htmlContent ?? template.htmlContent,
        isDefault: dto.isDefault ?? template.isDefault,
        version: template.version + 1,
      },
    });
  }

  async setDefaultInvoiceTemplate(id: string) {
    const template = await this.prisma.invoiceTemplate.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Invoice template with ID "${id}" not found`);
    }

    await this.prisma.invoiceTemplate.updateMany({
      where: { organizationId: template.organizationId },
      data: { isDefault: false },
    });

    return this.prisma.invoiceTemplate.update({
      where: { id },
      data: { isDefault: true },
    });
  }
}

