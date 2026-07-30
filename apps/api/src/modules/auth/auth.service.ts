import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { TokenService } from './services/token.service';
import { PasswordService } from './services/password.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { OwnerSignupDto } from './dto/owner-signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { UserRole, ApprovalStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
  ) {}

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. Owner Signup (Company Level Registration)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async ownerSignup(dto: OwnerSignupDto) {
    const emailNormalized = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email address already exists');
    }

    const timestamp = Date.now();
    const cleanOrgSlug = dto.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const slug = `${cleanOrgSlug}-${timestamp}`;

    const passwordHash = await this.passwordService.hashPassword(dto.password);

    // Create Organization, User (Pending), and Owner Profile
    const result = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug,
          billingEmail: emailNormalized,
          maxProperties: 10,
        },
      });

      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          email: emailNormalized,
          passwordHash,
          phone: dto.phone,
          role: UserRole.OWNER,
          approvalStatus: ApprovalStatus.PENDING,
          isActive: true,
        },
      });

      const owner = await tx.owner.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          fullName: dto.name,
          whatsappNumber: dto.phone,
        },
      });

      return { user, organization, owner };
    });

    return {
      message: 'Company & Owner registration submitted successfully. Your account is pending Super Admin approval.',
      approvalStatus: ApprovalStatus.PENDING,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        organizationName: result.organization.name,
        organizationId: result.organization.id,
      },
    };
  }

  // Legacy/General Register helper
  async register(dto: RegisterDto, res: Response) {
    return this.ownerSignup({
      name: dto.fullName,
      email: dto.email,
      password: dto.password,
      organizationName: dto.organizationName,
      phone: dto.phone,
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. Login (With Status Gate Checks)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async login(dto: LoginDto, res: Response) {
    const emailNormalized = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: emailNormalized },
      include: {
        organization: true,
        owner: true,
      },
    });

    if (!user || user.deletedAt !== null) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.passwordService.comparePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated or suspended');
    }

    if (user.approvalStatus === ApprovalStatus.PENDING) {
      // Check if user is an invited staff member - auto-approve staff
      const staffCount = await this.prisma.staffMember.count({
        where: { userId: user.id },
      });

      if (staffCount > 0) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { approvalStatus: ApprovalStatus.APPROVED },
        });
        user.approvalStatus = ApprovalStatus.APPROVED;
      } else {
        throw new UnauthorizedException(
          'Your account is pending admin approval. Please wait for a Super Admin to review your registration.',
        );
      }
    }

    if (user.approvalStatus === ApprovalStatus.REJECTED) {
      const reason = user.rejectionReason ? `: ${user.rejectionReason}` : '';
      throw new UnauthorizedException(`Your registration request was rejected${reason}`);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.tokenService.generateTokensAndSetCookies(user, res);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. Refresh Tokens & Logout
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async refreshToken(refreshTokenString: string, res: Response) {
    return this.tokenService.rotateRefreshToken(refreshTokenString, res);
  }

  async logout(userId: string, refreshTokenString: string | undefined, res: Response) {
    await this.tokenService.revokeUserTokens(userId, refreshTokenString, res);
    return { message: 'Logged out successfully. Server session terminated.' };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. Forgot & Reset Password
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user || user.deletedAt !== null) {
      return { message: 'If an account exists for this email, password reset instructions have been issued.' };
    }

    const resetToken = this.passwordService.generateResetToken(user.id, user.email);

    return {
      message: 'Password reset code/token generated successfully',
      resetToken,
      expiresIn: '15 minutes',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const payload = this.passwordService.verifyResetToken(dto.token, dto.email);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.deletedAt !== null) {
      throw new NotFoundException('User not found');
    }

    const newPasswordHash = await this.passwordService.hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all active refresh tokens for security
    await this.tokenService.revokeUserTokens(user.id);

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. Account Settings (Change Password & Email)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt !== null) {
      throw new NotFoundException('User not found');
    }

    const isValid = await this.passwordService.comparePassword(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Incorrect current password');
    }

    const newPasswordHash = await this.passwordService.hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    await this.tokenService.revokeUserTokens(userId);

    return { message: 'Password changed successfully' };
  }

  async changeEmail(userId: string, dto: ChangeEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt !== null) {
      throw new NotFoundException('User not found');
    }

    const isValid = await this.passwordService.comparePassword(dto.password, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Incorrect password');
    }

    const newEmailNormalized = dto.newEmail.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: newEmailNormalized },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('This email address is already in use');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { email: newEmailNormalized },
    });

    return { message: 'Email address updated successfully', email: newEmailNormalized };
  }
}
