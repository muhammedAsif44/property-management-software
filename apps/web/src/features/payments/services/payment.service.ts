import { httpClient } from '@/lib/api/http-client';

export interface PaymentRecordPayload {
  amount: number;
  mode?: string;
  gatewayTransactionId?: string;
  referenceNote?: string;
}

export const paymentService = {
  async recordPayment(bookingId: string, payload: PaymentRecordPayload) {
    const raw = await httpClient.post<any>(`/bookings/${bookingId}/payments`, payload);
    return raw?.data || raw;
  },

  async getBookingPayments(bookingId: string) {
    const raw = await httpClient.get<any>(`/bookings/${bookingId}/payments`);
    return raw?.data || raw;
  },
};
