import { IsEnum } from 'class-validator';
import { StaffRole } from '@prisma/client';

export class UpdateStaffRoleDto {
  @IsEnum(StaffRole, { message: 'Role must be MANAGER, RECEPTION_STAFF, HOUSEKEEPING, or VIEWER' })
  role!: StaffRole;
}
