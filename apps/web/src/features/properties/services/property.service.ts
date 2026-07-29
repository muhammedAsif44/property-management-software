import { httpClient } from '@/lib/api/http-client';

export interface PropertyItem {
  id: string;
  organizationId: string;
  ownerId: string;
  name: string;
  slug: string;
  logoUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  status: string;
  onboardingStep: number;
  isActive?: boolean;
  createdAt: string;
  settings?: {
    checkInTime?: string;
    checkOutTime?: string;
    termsAndConditions?: string;
    bankAccountDetails?: any;
    upiId?: string;
    qrCodeUrl?: string;
    activeInvoiceTemplateId?: string;
    activeInvoiceTemplate?: any;
  };
  roomTypes?: Array<{
    id?: string;
    name: string;
    totalUnits: number;
    basePrice: number | string;
    maxOccupancy?: number;
  }>;
  amenities?: Array<{
    id?: string;
    name: string;
    price: number | string;
    icon?: string;
  }>;
}

export interface PropertiesResponse {
  defaultPropertyId?: string;
  properties: PropertyItem[];
  total: number;
}

export interface InvoiceTemplateItem {
  id: string;
  name: string;
  htmlContent: string;
  isDefault: boolean;
}

export const propertyService = {
  // Get all properties owned by current Owner
  getMyProperties: () => httpClient.get<PropertiesResponse>('/properties'),

  // Get current active property
  getActiveProperty: () => httpClient.get<{ activeProperty: PropertyItem | null }>('/properties/active'),

  // Get full onboarding & property settings data
  getOnboardingData: (propertyId: string) =>
    httpClient.get<{ property: PropertyItem; invoiceTemplates: InvoiceTemplateItem[] }>(
      `/properties/${propertyId}/onboarding`,
    ),

  // Create a new property
  createProperty: (data: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    currency?: string;
    timezone?: string;
  }) =>
    httpClient.post<{ message: string; property: PropertyItem }>('/properties', data),

  // Save progress for any of the 6 onboarding steps
  saveOnboardingStep: (propertyId: string, payload: any) =>
    httpClient.post<{ message: string; property: PropertyItem }>(
      `/properties/${propertyId}/onboarding/step`,
      payload,
    ),

  // Switch default active property (Instagram-style switcher)
  switchActiveProperty: (propertyId: string) =>
    httpClient.patch<{ message: string; activeProperty: PropertyItem }>(
      `/properties/switch/${propertyId}`,
    ),
};
