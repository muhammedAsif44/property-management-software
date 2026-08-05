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

  async getAgencyDetails(agencyId: string) {
    const raw = await httpClient.get<any>(`/agencies/${agencyId}`);
    return raw?.data || raw;
  },

  async createAgency(propertyId: string, payload: CreateAgencyPayload) {
    const raw = await httpClient.post<any>(`/properties/${propertyId}/agencies`, payload);
    return raw?.data || raw;
  },

  async updateAgency(agencyId: string, payload: Partial<CreateAgencyPayload>) {
    const raw = await httpClient.patch<any>(`/agencies/${agencyId}`, payload);
    return raw?.data || raw;
  },

  async settleCommission(
    agencyId: string,
    amount: number,
    reference?: string,
    paymentMethod?: string,
    remarks?: string,
    idempotencyKey?: string
  ) {
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined;
    const raw = await httpClient.post<any>(
      `/agencies/${agencyId}/settle`,
      { amount },
      { headers }
    );
    return raw?.data || raw;
  },
};
