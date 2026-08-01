import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UpdateStaffRoleDto } from '../dto/update-staff-role.dto';
import { UserRole, StaffRole, StaffStatus } from '@prisma/client';

@Injectable()
export class StaffManagementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update staff member role
   */
  async updateStaffRole(propertyId: string, staffId: string, dto: UpdateStaffRoleDto) {
    const staff = await this.prisma.staffMember.findFirst({
      where: { id: staffId, propertyId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    const mappedUserRole =
      dto.role === StaffRole.MANAGER
        ? UserRole.MANAGER
        : dto.role === StaffRole.RECEPTION_STAFF
        ? UserRole.RECEPTION_STAFF
        : dto.role === StaffRole.HOUSEKEEPING
        ? UserRole.HOUSEKEEPING
        : UserRole.VIEWER;

    await this.prisma.$transaction([
      this.prisma.staffMember.update({
        where: { id: staff.id },
        data: { role: dto.role },
      }),
      this.prisma.user.update({
        where: { id: staff.userId },
        data: { role: mappedUserRole },
      }),
    ]);

    return {
      message: `Staff role updated to ${dto.role}`,
    };
  }

  /**
   * Suspend staff member access (Owner & Manager)
   */
  async suspendStaff(propertyId: string, staffId: string) {
    const staff = await this.prisma.staffMember.findFirst({
      where: { id: staffId, propertyId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    await this.prisma.$transaction([
      this.prisma.staffMember.update({
        where: { id: staff.id },
        data: { status: StaffStatus.REMOVED },
      }),
      this.prisma.user.update({
        where: { id: staff.userId },
        data: { isActive: false },
      }),
    ]);

    return {
      message: 'Staff member suspended successfully',
      staffId: staff.id,
      status: StaffStatus.REMOVED,
    };
  }

  /**
   * Reactivate staff member access (Owner & Manager)
   */
  async reactivateStaff(propertyId: string, staffId: string) {
    const staff = await this.prisma.staffMember.findFirst({
      where: { id: staffId, propertyId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    await this.prisma.$transaction([
      this.prisma.staffMember.update({
        where: { id: staff.id },
        data: { status: StaffStatus.ACTIVE },
      }),
      this.prisma.user.update({
        where: { id: staff.userId },
        data: { isActive: true },
      }),
    ]);

    return {
      message: 'Staff member reactivated successfully',
      staffId: staff.id,
      status: StaffStatus.ACTIVE,
    };
  }

  /**
   * Permanently delete staff member (Owner ONLY)
   */
  async deleteStaffPermanently(isOwner: boolean, propertyId: string, staffId: string) {
    if (!isOwner) {
      throw new ForbiddenException(
        'Action Forbidden: Only the property Owner can permanently delete a staff member. Managers can only suspend or reactivate staff.',
      );
    }

    const staff = await this.prisma.staffMember.findFirst({
      where: { id: staffId, propertyId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    await this.prisma.staffMember.delete({
      where: { id: staff.id },
    });

    return {
      message: 'Staff member permanently removed',
      staffId: staff.id,
    };
  }
}
