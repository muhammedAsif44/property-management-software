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
} from 'class-validator';
import { BookingChannel, MealPlan } from '@prisma/client';

export class CreateBookingDto {
  @IsString()
  @MinLength(2)
  guestName!: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @IsOptional()
  @IsString()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestNationality?: string;

  @IsUUID()
  roomTypeId!: string;

  @IsDateString()
  checkInDate!: string;

  @IsDateString()
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

  @IsNumber()
  @Min(0)
  baseAmount!: number;

  @IsOptional()
  @IsNumber()
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
  @IsString()
  propertyId?: string;
}
