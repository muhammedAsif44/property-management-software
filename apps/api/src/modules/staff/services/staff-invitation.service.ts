import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { InviteStaffDto } from '../dto/invite-staff.dto';
import { UserRole, StaffRole, StaffStatus, ApprovalStatus } from '@prisma/client';

@Injectable()
export class StaffInvitationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Invite staff member by email (With Edge Case Guards & Resend Handling)
   */
  async inviteStaff(userId: string, property: any, dto: InviteStaffDto) {
    const emailNormalized = dto.email.toLowerCase().trim();

    // 1. Fetch Inviter User context
    const inviterUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!inviterUser) {
      throw new NotFoundException('Inviter user profile not found');
    }

    // Edge Case A: Prevent Self-Invitation
    if (inviterUser.email.toLowerCase() === emailNormalized) {
      throw new BadRequestException('You cannot invite yourself as a staff member.');
    }

    const propertyOwner = await this.prisma.owner.findUnique({
      where: { id: property.ownerId },
      select: { id: true },
    });

    if (!propertyOwner) {
      throw new NotFoundException('Property owner profile not found');
    }

    const mappedUserRole =
      dto.role === StaffRole.MANAGER
        ? UserRole.MANAGER
        : dto.role === StaffRole.RECEPTION_STAFF
        ? UserRole.RECEPTION_STAFF
        : dto.role === StaffRole.HOUSEKEEPING
        ? UserRole.HOUSEKEEPING
        : UserRole.VIEWER;

    const targetUser = await this.prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    // Edge Case B: Protect existing Owner / Super Admin accounts from demotion
    if (targetUser) {
      if (targetUser.role === UserRole.OWNER || targetUser.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Cannot invite or alter an Owner or Super Admin account.');
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      if (targetUser) {
        const existingStaff = await tx.staffMember.findUnique({
          where: { userId_propertyId: { userId: targetUser.id, propertyId: property.id } },
        });

        // Edge Case C: Resend Pending Invitation vs Active Conflict
        if (existingStaff) {
          if (existingStaff.status === StaffStatus.INVITED) {
            // Resend invitation & update role / timestamp
            const updatedStaff = await tx.staffMember.update({
              where: { id: existingStaff.id },
              data: {
                role: dto.role,
                invitedAt: new Date(),
              },
              include: {
                user: { select: { id: true, email: true, role: true } },
              },
            });

            await tx.user.update({
              where: { id: targetUser.id },
              data: { role: mappedUserRole },
            });

            return {
              message: `Resent invitation to ${emailNormalized} as ${dto.role}.`,
              staff: updatedStaff,
            };
          }

          throw new ConflictException('This user is already an active staff member of this property');
        }

        await tx.user.update({
          where: { id: targetUser.id },
          data: {
            organizationId: property.organizationId,
            role: mappedUserRole,
            approvalStatus: ApprovalStatus.APPROVED,
            isActive: true,
          },
        });

        const newStaff = await tx.staffMember.create({
          data: {
            userId: targetUser.id,
            propertyId: property.id,
            invitedByOwnerId: propertyOwner.id,
            role: dto.role,
            status: StaffStatus.ACTIVE,
            joinedAt: new Date(),
          },
          include: {
            user: { select: { id: true, email: true, role: true } },
          },
        });

        return {
          message: `Invited ${emailNormalized} as ${dto.role}. Linked automatically to ${property.name}.`,
          staff: newStaff,
        };
      } else {
        const dummyPasswordHash = '$2b$10$w8T9J411q/nJgW4Wn5q/e.m2Z2f5b6g7h8i9j0k1l2m3n4o5p6q7';

        const newUser = await tx.user.create({
          data: {
            organizationId: property.organizationId,
            email: emailNormalized,
            passwordHash: dummyPasswordHash,
            role: mappedUserRole,
            approvalStatus: ApprovalStatus.APPROVED,
            isActive: true,
          },
        });

        const newStaff = await tx.staffMember.create({
          data: {
            userId: newUser.id,
            propertyId: property.id,
            invitedByOwnerId: propertyOwner.id,
            role: dto.role,
            status: StaffStatus.INVITED,
          },
          include: {
            user: { select: { id: true, email: true, role: true } },
          },
        });

        return {
          message: `Invitation sent to ${emailNormalized} as ${dto.role}. User can now sign up/log in without approval.`,
          staff: newStaff,
        };
      }
    });
  }
}
