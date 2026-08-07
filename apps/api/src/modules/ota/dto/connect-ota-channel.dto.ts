import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { OtaChannel } from '@prisma/client';

export class ConnectOtaChannelDto {
  @IsEnum(OtaChannel)
  @IsNotEmpty()
  channel!: OtaChannel;

  @IsObject()
  @IsOptional()
  credentials?: Record<string, any>;
}

export class SyncAriDto {
  @IsEnum(OtaChannel)
  @IsOptional()
  channel?: OtaChannel;

  @IsString()
  @IsOptional()
  roomTypeId?: string;
}
