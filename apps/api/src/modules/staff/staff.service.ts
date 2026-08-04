import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StaffInvitationService } from './services/staff-invitation.service';
import { StaffManagementService } from './services/staff-management.service';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateStaffRoleDto } from './dto/update-staff-role.dto';
import { UserRole, StaffRole, StaffStatus } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invitationService: StaffInvitationService,
    private readonly managementService: StaffManagementService,
  ) {}

  /**
   * Helper: Resolve active property & caller permissions
   */
  private async resolveCallerProperty(userId: string, requestedPropertyId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        organizationId: true,
        owner: { select: { id: true, defaultPropertyId: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    let targetPropertyId =
      requestedPropertyId &&
      requestedPropertyId !== 'undefined' &&
      requestedPropertyId !== 'null' &&
      requestedPropertyId.trim() !== ''
        ? requestedPropertyId
        : user.owner?.defaultPropertyId;

    if (!targetPropertyId) {
      const prop = await this.prisma.property.findFirst({
        where: {
          OR: [
            { owner: { userId } },
            { staffMembers: { some: { userId } } },
          ],
          deletedAt: null,
        },
        select: { id: true, ownerId: true },
      });

      if (!prop) {
        throw new NotFoundException('No active property context found');
      }
      targetPropertyId = prop.id;
    }

    const property = await this.prisma.property.findUnique({
      where: { id: targetPropertyId },
      select: { id: true, ownerId: true, organizationId: true, name: true },
    });

    if (!property) {
      throw new NotFoundException('Target property not found');
    }

    const isOwner = user.owner?.id === property.ownerId || user.role === UserRole.OWNER || user.role === UserRole.SUPER_ADMIN;

    let isManager = false;
    if (!isOwner) {
      const staffRecord = await this.prisma.staffMember.findUnique({
        where: { userId_propertyId: { userId, propertyId: targetPropertyId } },
      });

      if (staffRecord && staffRecord.role === StaffRole.MANAGER && staffRecord.status === StaffStatus.ACTIVE) {
        isManager = true;
      }
    }

    if (!isOwner && !isManager) {
      throw new ForbiddenException('You must be an Owner or Manager to access staff management');
    }

    return { callerUser: user, property, isOwner, isManager };
  }

  /**
   * 1. Get Staff Directory (Owner & Manager)
   */
  async getStaffDirectory(userId: string, propertyId?: string) {
    const { property, isOwner } = await this.resolveCallerProperty(userId, propertyId);

    const staffMembers = await this.prisma.staffMember.findMany({
      where: { propertyId: property.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        role: true,
        status: true,
        invitedAt: true,
        joinedAt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            approvalStatus: true,
            lastLoginAt: true,
          },
        },
        invitedByOwner: {
          select: { id: true, fullName: true, user: { select: { email: true } } },
        },
      },
    });

    return {
      property: { id: property.id, name: property.name },
      staff: staffMembers,
      total: staffMembers.length,
    };
  }

  /**
   * 2. Invite Staff Member by Email (Delegated)
   */
  async inviteStaff(userId: string, dto: InviteStaffDto) {
    const { property } = await this.resolveCallerProperty(userId, dto.propertyId);
    return this.invitationService.inviteStaff(userId, property, dto);
  }

  /**
   * 3. Update Staff Role (Delegated)
   */
  async updateStaffRole(userId: string, staffId: string, dto: UpdateStaffRoleDto) {
    const { property } = await this.resolveCallerProperty(userId);
    return this.managementService.updateStaffRole(property.id, staffId, dto);
  }

  /**
   * 4. Suspend Staff Member (Delegated)
   */
  async suspendStaff(userId: string, staffId: string) {
    const { property } = await this.resolveCallerProperty(userId);
    return this.managementService.suspendStaff(property.id, staffId);
  }

  /**
   * 5. Reactivate Staff Member (Delegated)
   */
  async reactivateStaff(userId: string, staffId: string) {
    const { property } = await this.resolveCallerProperty(userId);
    return this.managementService.reactivateStaff(property.id, staffId);
  }

  /**
   * 6. Resend Invitation Email
   */
  async resendInvite(userId: string, staffId: string) {
    const { property } = await this.resolveCallerProperty(userId);
    return this.invitationService.resendInvite(property.id, staffId);
  }

  /**
   * 7. Permanently Delete Staff Member (Delegated - Owner Only)
   */
  async deleteStaffPermanently(userId: string, staffId: string) {
    const { isOwner, property } = await this.resolveCallerProperty(userId);
    return this.managementService.deleteStaffPermanently(isOwner, property.id, staffId);
  }
}
