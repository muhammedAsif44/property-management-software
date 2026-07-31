import { IsOptional, IsString, IsUUID, IsDateString, IsEnum, IsNumber, IsArray, Min, MinLength } from 'class-validator';
import { BookingChannel, MealPlan } from '@prisma/client';

export class UpdateBookingDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  guestName?: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @IsOptional()
  @IsString()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestNationality?: string;

  @IsOptional()
  @IsUUID()
  roomTypeId?: string;

  @IsOptional()
  @IsDateString()
  checkInDate?: string;

  @IsOptional()
  @IsDateString()
  checkOutDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  adults?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  children?: number;

  @IsOptional()
  @IsEnum(MealPlan)
  mealPlan?: MealPlan;

  @IsOptional()
  @IsEnum(BookingChannel)
  channel?: BookingChannel;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseAmount?: number;

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
