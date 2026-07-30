import { IsOptional, IsUUID } from 'class-validator';

export class AnalyticsQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'propertyId must be a valid UUID' })
  propertyId?: string;
}
