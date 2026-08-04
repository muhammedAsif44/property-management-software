import {
  IsString,
  IsUUID,
  IsDateString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  MinLength,
  IsEmail,
  IsPhoneNumber,
  IsISO31661Alpha2,
} from 'class-validator';
import { BookingChannel, MealPlan } from '@prisma/client';
import { IsAfterDate } from '../../../common/validators/is-after.validator';

export class CreateBookingDto {
  @IsString()
  @MinLength(2)
  guestName!: string;

  @IsOptional()
  @IsPhoneNumber()
  guestPhone?: string;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsOptional()
  @IsISO31661Alpha2()
  guestNationality?: string;

  @IsUUID()
  roomTypeId!: string;

  @IsDateString()
  checkInDate!: string;

  @IsDateString()
  @IsAfterDate('checkInDate')
  checkOutDate!: string;

  @IsNumber()
  @Min(1)
  adults!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  children?: number;

  @IsOptional()
  @IsEnum(MealPlan)
  mealPlan?: MealPlan;

  @IsEnum(BookingChannel)
  channel!: BookingChannel;

  @IsOptional()
  @IsUUID()
  agencyId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  baseAmount!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  advancePaid?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  facilityIds?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  roomUnitId?: string;

  @IsOptional()
  @IsString()
  propertyId?: string;
}
