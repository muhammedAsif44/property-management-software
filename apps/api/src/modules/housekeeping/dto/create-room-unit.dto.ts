import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { CleanlinessStatus } from '@prisma/client';

export class CreateRoomUnitDto {
  @IsString()
  @IsNotEmpty()
  unitNumber!: string;

  @IsString()
  @IsNotEmpty()
  roomTypeId!: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(CleanlinessStatus)
  cleanlinessStatus?: CleanlinessStatus;

  @IsOptional()
  @IsString()
  propertyId?: string;
}
