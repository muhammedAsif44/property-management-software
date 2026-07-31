import { IsString, IsEnum } from 'class-validator';

export enum RefundType {
  REFUND = 'REFUND',
  FORFEIT = 'FORFEIT',
}

export class CancelBookingDto {
  @IsString()
  cancellationReason!: string;

  @IsEnum(RefundType)
  refundType!: RefundType;
}
