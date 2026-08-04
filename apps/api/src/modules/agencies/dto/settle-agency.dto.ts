import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class SettleAgencyDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount!: number;
}
