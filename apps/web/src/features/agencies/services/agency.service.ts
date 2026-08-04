import { httpClient } from '@/lib/api/http-client';

export interface CreateAgencyPayload {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  defaultTacRate?: number;
}

export const agencyService = {
  async getAgencies(propertyId: string) {
    const raw = await httpClient.get<any>(`/properties/${propertyId}/agencies`);
    return raw?.data || raw;
  },

  async createAgency(propertyId: string, payload: CreateAgencyPayload) {
    const raw = await httpClient.post<any>(`/properties/${propertyId}/agencies`, payload);
    return raw?.data || raw;
  },

  async settleCommission(agencyId: string, amount: number) {
    const raw = await httpClient.post<any>(`/agencies/${agencyId}/settle`, { amount });
    return raw?.data || raw;
  },
};
