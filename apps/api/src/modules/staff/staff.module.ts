import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { StaffInvitationService } from './services/staff-invitation.service';
import { StaffManagementService } from './services/staff-management.service';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [StaffController],
  providers: [StaffService, StaffInvitationService, StaffManagementService],
  exports: [StaffService, StaffInvitationService, StaffManagementService],
})
export class StaffModule {}
