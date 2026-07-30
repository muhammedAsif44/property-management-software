import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { InviteStaffDto } from '../dto/invite-staff.dto';
import { UserRole, StaffRole, StaffStatus, ApprovalStatus } from '@prisma/client';

@Injectable()
export class StaffInvitationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Invite staff member by email (Auto-links existing/new users)
   */
  async inviteStaff(userId: string, property: any, dto: InviteStaffDto) {
    const emailNormalized = dto.email.toLowerCase().trim();

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
        : UserRole.VIEWER;

    const targetUser = await this.prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    return await this.prisma.$transaction(async (tx) => {
      if (targetUser) {
        const existingStaff = await tx.staffMember.findUnique({
          where: { userId_propertyId: { userId: targetUser.id, propertyId: property.id } },
        });

        if (existingStaff) {
          throw new ConflictException('This user is already a staff member of this property');
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
