import { PropertyItem, InvoiceTemplateItem } from '../services/property.service';

export interface Step1IdentityData {
  name: string;
  logoUrl: string;
  address: string;
  city: string;
  state: string;
  country: string;
  currency: string;
  timezone: string;
}

export interface Step2TimesData {
  checkInTime: string;
  checkOutTime: string;
  termsAndConditions: string;
}

export interface RoomTypeItem {
  id?: string;
  name: string;
  totalUnits: number;
  basePrice: number;
  maxOccupancy: number;
}

export interface AmenityItem {
  id?: string;
  name: string;
  price: number;
  icon: string;
}

export interface Step6BankData {
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountHolderName: string;
  upiId: string;
  qrCodeUrl: string;
}
