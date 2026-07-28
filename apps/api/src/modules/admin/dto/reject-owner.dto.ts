import { IsOptional, IsString } from 'class-validator';

export class RejectOwnerDto {
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
