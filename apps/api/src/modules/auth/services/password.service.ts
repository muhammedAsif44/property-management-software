import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // 1. Hash Plaintext Password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // 2. Compare Plaintext & Hashed Password
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // 3. Generate Password Reset Token (15 minutes)
  generateResetToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email, type: 'password_reset' },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      },
    );
  }

  // 4. Verify Password Reset Token
  verifyResetToken(token: string, expectedEmail: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      if (payload.type !== 'password_reset' || payload.email !== expectedEmail.toLowerCase().trim()) {
        throw new BadRequestException('Invalid password reset token');
      }

      return payload;
    } catch (err) {
      throw new BadRequestException('Invalid or expired password reset token');
    }
  }
}
