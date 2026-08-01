import { IsUUID, IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class BatchGenerateUnitsDto {
  @IsUUID()
  roomTypeId!: string;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  startNumber?: number;

  @IsOptional()
  @IsString()
  prefix?: string;
}
