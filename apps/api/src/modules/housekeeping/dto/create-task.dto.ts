import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsUUID()
  roomUnitId!: string;

  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @IsOptional()
  @IsString()
  reportedIssue?: string;

  @IsOptional()
  @IsString()
  propertyId?: string;
}
