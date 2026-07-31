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
  _count?: {
    roomTypes?: number;
    amenities?: number;
  };
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
  getMyProperties: async () => {
    const raw = await httpClient.get<any>('/properties');
    return (raw?.data || raw) as PropertiesResponse;
  },

  // Get current active property
  getActiveProperty: async () => {
    const raw = await httpClient.get<any>('/properties/active');
    return (raw?.data || raw) as { activeProperty: PropertyItem | null };
  },

  // Get full onboarding & property settings data
  getOnboardingData: async (propertyId: string) => {
    const raw = await httpClient.get<any>(`/properties/${propertyId}/onboarding`);
    return (raw?.data || raw) as { property: PropertyItem; invoiceTemplates: InvoiceTemplateItem[] };
  },

  // Create a new property
  createProperty: async (data: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    currency?: string;
    timezone?: string;
  }) => {
    const raw = await httpClient.post<any>('/properties', data);
    return (raw?.data || raw) as { message: string; property: PropertyItem };
  },

  // Save progress for any of the 6 onboarding steps
  saveOnboardingStep: async (propertyId: string, payload: any) => {
    const raw = await httpClient.post<any>(`/properties/${propertyId}/onboarding/step`, payload);
    return (raw?.data || raw) as { message: string; property: PropertyItem };
  },

  // Switch default active property (Instagram-style switcher)
  switchActiveProperty: async (propertyId: string) => {
    const raw = await httpClient.patch<any>(`/properties/switch/${propertyId}`);
    return (raw?.data || raw) as { message: string; activeProperty: PropertyItem };
  },
};
