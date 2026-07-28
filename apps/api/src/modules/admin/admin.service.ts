import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RejectOwnerDto } from './dto/reject-owner.dto';
import { ApprovalStatus, UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Get List of Pending Owner Account Applications
  async getPendingOwners() {
    const pendingUsers = await this.prisma.user.findMany({
      where: {
        role: UserRole.OWNER,
        approvalStatus: ApprovalStatus.PENDING,
        deletedAt: null,
      },
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

  // 2. Approve Pending Owner Account
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

  // 3. Reject Pending Owner Account with Rejection Reason
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
}
