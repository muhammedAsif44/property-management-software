import { httpClient } from '@/lib/api/http-client';
import {
  Booking,
  BookingListResponse,
  CreateBookingPayload,
  CancelBookingPayload,
  BookingFilters,
  DeletionRequest,
  OccupancyData,
} from '../types/booking.types';

export class BookingService {
  async getBookings(filters: BookingFilters): Promise<BookingListResponse> {
    const params = new URLSearchParams();
    if (filters.propertyId) params.set('propertyId', filters.propertyId);
    if (filters.status) params.set('status', filters.status);
    if (filters.channel) params.set('channel', filters.channel);
    if (filters.fromDate) params.set('fromDate', filters.fromDate);
    if (filters.toDate) params.set('toDate', filters.toDate);
    if (filters.guestSearch) params.set('guestSearch', filters.guestSearch);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    const raw = await httpClient.get<any>(`/bookings?${params.toString()}`);
    return raw?.data || raw;
  }

  async getBookingById(id: string): Promise<Booking> {
    const raw = await httpClient.get<any>(`/bookings/${id}`);
    return raw?.data || raw;
  }

  async createBooking(payload: CreateBookingPayload, idempotencyKey?: string): Promise<Booking> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;
    const raw = await httpClient.post<any>('/bookings', payload, { headers });
    return raw?.data || raw;
  }

  async updateBooking(id: string, payload: Partial<CreateBookingPayload>): Promise<Booking> {
    const raw = await httpClient.patch<any>(`/bookings/${id}`, payload);
    return raw?.data || raw;
  }

  async cancelBooking(id: string, payload: CancelBookingPayload): Promise<Booking> {
    const raw = await httpClient.post<any>(`/bookings/${id}/cancel`, payload);
    return raw?.data || raw;
  }

  async checkIn(id: string): Promise<Booking> {
    const raw = await httpClient.post<any>(`/bookings/${id}/check-in`);
    return raw?.data || raw;
  }

  async checkOut(id: string): Promise<Booking> {
    const raw = await httpClient.post<any>(`/bookings/${id}/check-out`);
    return raw?.data || raw;
  }

  async softDeleteBooking(id: string): Promise<any> {
    const raw = await httpClient.delete<any>(`/bookings/${id}`);
    return raw?.data || raw;
  }

  async requestDeletion(id: string, reason: string): Promise<DeletionRequest> {
    const raw = await httpClient.post<any>(`/bookings/${id}/request-deletion`, { reason });
    return raw?.data || raw;
  }

  async getDeletionRequests(propertyId?: string): Promise<DeletionRequest[]> {
    const q = propertyId ? `?propertyId=${propertyId}` : '';
    const raw = await httpClient.get<any>(`/bookings/deletion-requests/pending${q}`);
    return raw?.data || raw;
  }

  async approveDeletion(requestId: string): Promise<DeletionRequest> {
    const raw = await httpClient.post<any>(`/bookings/deletion-requests/${requestId}/approve`);
    return raw?.data || raw;
  }

  async rejectDeletion(requestId: string): Promise<DeletionRequest> {
    const raw = await httpClient.post<any>(`/bookings/deletion-requests/${requestId}/reject`);
    return raw?.data || raw;
  }

  async getOccupancy(propertyId: string, from: string, to: string): Promise<OccupancyData> {
    const raw = await httpClient.get<any>(`/bookings/occupancy?propertyId=${propertyId}&from=${from}&to=${to}`);
    return raw?.data || raw;
  }
}

export const bookingService = new BookingService();
