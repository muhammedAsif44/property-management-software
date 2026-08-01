import { IsString, IsOptional, IsEnum } from 'class-validator';
import { CleanlinessStatus } from '@prisma/client';

export class UpdateRoomUnitDto {
  @IsOptional()
  @IsString()
  unitNumber?: string;

  @IsOptional()
  @IsString()
  roomTypeId?: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(CleanlinessStatus)
  cleanlinessStatus?: CleanlinessStatus;
}
