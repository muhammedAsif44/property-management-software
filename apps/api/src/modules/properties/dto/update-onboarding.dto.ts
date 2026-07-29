import {
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsObject,
  Min,
  Max,
} from 'class-validator';

export class UpdateOnboardingDto {
  @IsNumber()
  @Min(1)
  @Max(6)
  step!: number;

  @IsObject()
  @IsOptional()
  step1?: {
    name?: string;
    logoUrl?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    timezone?: string;
    currency?: string;
  };

  @IsObject()
  @IsOptional()
  step2?: {
    checkInTime?: string;
    checkOutTime?: string;
    termsAndConditions?: string;
  };

  @IsObject()
  @IsOptional()
  step3?: {
    roomTypes: Array<{
      id?: string;
      name: string;
      totalUnits: number;
      basePrice: number;
      maxOccupancy?: number;
    }>;
  };

  @IsObject()
  @IsOptional()
  step4?: {
    amenities: Array<{
      id?: string;
      name: string;
      price: number;
      icon?: string;
    }>;
  };

  @IsObject()
  @IsOptional()
  step5?: {
    activeInvoiceTemplateId: string;
  };

  @IsObject()
  @IsOptional()
  step6?: {
    bankAccountDetails?: {
      accountNumber?: string;
      ifscCode?: string;
      bankName?: string;
      accountHolderName?: string;
    };
    upiId?: string;
    qrCodeUrl?: string;
  };
}
