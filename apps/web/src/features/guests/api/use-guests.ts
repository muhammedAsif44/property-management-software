import { useQuery } from '@tanstack/react-query';
import { httpClient as api } from '@/lib/api';

export const GUESTS_QUERY_KEY = 'guests';

export interface Guest {
  id: string;
  propertyId: string;
  fullName: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  nationality?: string;
  totalVisits: number;
  totalSpend: number;
  firstStayAt?: string;
  lastStayAt?: string;
  createdAt: string;
}

export interface GuestDetails extends Guest {
  bookings: any[]; // Adjust type based on Booking
}

export function useGuestsQuery(
  propertyId: string | null,
  options?: { search?: string; page?: number; limit?: number }
) {
  return useQuery({
    queryKey: [GUESTS_QUERY_KEY, propertyId, options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);
      if (options?.search) params.append('search', options.search);
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());

      const res = await api.get<any>(`/guests?${params.toString()}`);
      return res;
    },
    enabled: true,
  });
}

export function useGuestQuery(propertyId: string | null, id: string | null) {
  return useQuery({
    queryKey: [GUESTS_QUERY_KEY, propertyId, id],
    queryFn: async () => {
      if (!propertyId || !id) return null;
      const res = await api.get<GuestDetails>(`/guests/${id}?propertyId=${propertyId}`);
      return res;
    },
    enabled: !!propertyId && !!id,
  });
}
