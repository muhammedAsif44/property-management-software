import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../database/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // 1. Generate 7d Access Token & 30d Refresh Token + Set Cookies
  async generateTokensAndSetCookies(user: any, res: Response) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'orvyn_access_super_secret_key_2026_x89a',
      expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '7d') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'orvyn_refresh_super_secret_key_2026_z91b',
      expiresIn: '30d',
    });

    // Hash refresh token & persist in database
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const isProduction = process.env.NODE_ENV === 'production';

    // HTTP-Only Cookies
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days persistent session
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    const targetApp = user.role === UserRole.SUPER_ADMIN ? 'admin' : 'pms';
    const redirectUrl = user.role === UserRole.SUPER_ADMIN ? '/admin/approvals' : '/dashboard';

    return {
      message: 'Authentication successful',
      targetApp,
      redirectUrl,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.owner?.fullName || user.email,
        organizationName: user.organization?.name || '',
        role: user.role,
        approvalStatus: user.approvalStatus,
        organizationId: user.organizationId,
      },
      tokens: {
        accessToken,
        accessTokenExpiresIn: '7d',
        refreshTokenExpiresIn: '30d',
      },
    };
  }

  // 2. Token Rotation: Verify & Rotate Refresh Token
  async rotateRefreshToken(refreshTokenString: string, res: Response) {
    if (!refreshTokenString) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      const payload = this.jwtService.verify(refreshTokenString, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'orvyn_refresh_super_secret_key_2026_z91b',
      });

      const userRefreshTokens = await this.prisma.refreshToken.findMany({
        where: {
          userId: payload.sub,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      let matchingTokenRecord = null;
      for (const tokenRecord of userRefreshTokens) {
        const isMatch = await bcrypt.compare(refreshTokenString, tokenRecord.tokenHash);
        if (isMatch) {
          matchingTokenRecord = tokenRecord;
          break;
        }
      }

      if (!matchingTokenRecord) {
        throw new UnauthorizedException('Invalid or revoked refresh token');
      }

      // Revoke old refresh token
      await this.prisma.refreshToken.update({
        where: { id: matchingTokenRecord.id },
        data: { revokedAt: new Date() },
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { organization: true, owner: true },
      });

      if (!user || user.deletedAt !== null || !user.isActive) {
        throw new UnauthorizedException('User account is inactive or removed');
      }

      if (user.approvalStatus !== 'APPROVED') {
        throw new UnauthorizedException('User account is not approved');
      }

      return this.generateTokensAndSetCookies(user, res);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // 3. Server-Side Revoke Tokens & Clear Cookies
  async revokeUserTokens(userId: string, refreshTokenString?: string, res?: Response) {
    if (userId) {
      if (refreshTokenString) {
        const activeTokens = await this.prisma.refreshToken.findMany({
          where: { userId, revokedAt: null },
        });

        for (const tokenRecord of activeTokens) {
          const isMatch = await bcrypt.compare(refreshTokenString, tokenRecord.tokenHash);
          if (isMatch) {
            await this.prisma.refreshToken.update({
              where: { id: tokenRecord.id },
              data: { revokedAt: new Date() },
            });
            break;
          }
        }
      } else {
        await this.prisma.refreshToken.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    }

    if (res) {
      this.clearAuthCookies(res);
    }
  }

  clearAuthCookies(res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('access_token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      expires: new Date(0),
    });
    res.cookie('refresh_token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/api/v1/auth',
      expires: new Date(0),
    });
  }
}
