import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { OtaChannel } from '@prisma/client';

export enum OtaEventType {
  RESERVATION_CREATED = 'RESERVATION_CREATED',
  RESERVATION_MODIFIED = 'RESERVATION_MODIFIED',
  RESERVATION_CANCELLED = 'RESERVATION_CANCELLED',
  ARI_SYNC_TRIGGER = 'ARI_SYNC_TRIGGER',
}

export class OtaWebhookPayloadDto {
  @IsEnum(OtaEventType)
  @IsNotEmpty()
  eventType!: OtaEventType;

  @IsEnum(OtaChannel)
  @IsNotEmpty()
  channel!: OtaChannel;

  @IsString()
  @IsNotEmpty()
  externalReservationId!: string;

  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @IsString()
  @IsOptional()
  roomTypeId?: string;

  @IsString()
  @IsNotEmpty()
  checkInDate!: string;

  @IsString()
  @IsNotEmpty()
  checkOutDate!: string;

  @IsNumber()
  @IsNotEmpty()
  totalAmount!: number;

  @IsString()
  @IsNotEmpty()
  guestName!: string;

  @IsString()
  @IsOptional()
  guestPhone?: string;

  @IsString()
  @IsOptional()
  guestEmail?: string;

  @IsOptional()
  rawPayload?: any;
}
