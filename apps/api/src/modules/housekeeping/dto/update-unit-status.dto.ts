import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CleanlinessStatus } from '@prisma/client';

export class UpdateUnitStatusDto {
  @IsEnum(CleanlinessStatus)
  cleanlinessStatus!: CleanlinessStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
