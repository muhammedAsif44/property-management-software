import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  Get,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { OwnerSignupDto } from './dto/owner-signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Throttle } from '@nestjs/throttler';
import { ChangeEmailDto } from './dto/change-email.dto';
import { StaffSignupDto } from './dto/staff-signup.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Owner Registration (Creates pending Owner account with Company/Organization name)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signup/owner')
  async ownerSignup(@Body() dto: OwnerSignupDto) {
    return this.authService.ownerSignup(dto);
  }

  // Staff Registration (For invited staff members: Manager, Reception Staff, Viewer)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signup/staff')
  async staffSignup(
    @Body() dto: StaffSignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.staffSignup(dto, res);
  }

  // Login (Email + Password)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, res);
  }

  // Forgot Password (Requests reset token)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // Reset Password (Sets new password using token)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // Change Password (Inside Account Settings)
  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  // Change Email (Inside Account Settings)
  @Patch('change-email')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changeEmail(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangeEmailDto,
  ) {
    return this.authService.changeEmail(userId, dto);
  }

  // Refresh Token Rotation
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    return this.authService.refreshToken(refreshToken, res);
  }

  // Logout (Server-Side Revocation)
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    return this.authService.logout(userId, refreshToken, res);
  }

  // Current User Profile
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return {
      user,
    };
  }
}
