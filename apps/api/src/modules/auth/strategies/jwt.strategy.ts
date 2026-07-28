import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../../database/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  organizationId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token || null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || 'orvyn_access_super_secret_key_2026_x89a',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        approvalStatus: true,
        rejectionReason: true,
        isActive: true,
        deletedAt: true,
        organizationId: true,
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
          },
        },
      },
    });

    if (!user || user.deletedAt !== null) {
      throw new UnauthorizedException('User account has been removed or does not exist');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated or suspended');
    }

    if (user.approvalStatus === 'PENDING') {
      throw new UnauthorizedException('Your account is pending admin approval. Please wait for a Super Admin to review your application.');
    }

    if (user.approvalStatus === 'REJECTED') {
      const reason = user.rejectionReason ? `: ${user.rejectionReason}` : '';
      throw new UnauthorizedException(`Your registration request was rejected${reason}`);
    }

    return {
      ...user,
      fullName: user.owner?.fullName || user.email,
      organizationName: user.organization?.name || '',
    };
  }
}
