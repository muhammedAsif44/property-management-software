import { IsEmail, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { StaffRole } from '@prisma/client';

export class InviteStaffDto {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email!: string;

  @IsEnum(StaffRole, { message: 'Role must be MANAGER, RECEPTION_STAFF, or VIEWER' })
  role!: StaffRole;

  @IsOptional()
  @IsUUID('4', { message: 'propertyId must be a valid UUID' })
  propertyId?: string;
}
