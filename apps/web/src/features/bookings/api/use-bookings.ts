import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/booking.service';
import { BookingFilters, CreateBookingPayload, CancelBookingPayload } from '../types/booking.types';
import { useToast } from '@/components/ui/toast';

export const bookingKeys = {
  all: ['bookings'] as const,
  list: (filters: BookingFilters) => ['bookings', 'list', filters] as const,
  detail: (id: string) => ['bookings', 'detail', id] as const,
  deletionRequests: (propertyId?: string) => ['bookings', 'deletion-requests', propertyId] as const,
  occupancy: (propertyId: string, from: string, to: string) => ['bookings', 'occupancy', propertyId, from, to] as const,
};

export function useBookingsQuery(filters: BookingFilters) {
  return useQuery({
    queryKey: bookingKeys.list(filters),
    queryFn: () => bookingService.getBookings(filters),
    staleTime: 10000,
  });
}

export function useBookingDetailQuery(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => bookingService.getBookingById(id),
    enabled: !!id,
    staleTime: 10000,
  });
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => {
      const idempotencyKey = crypto.randomUUID();
      return bookingService.createBooking(payload, idempotencyKey);
    },
    onSuccess: () => {
      toast.success('Booking created successfully', 'Booking Created');
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create booking', 'Booking Error');
    },
  });
}

export function useUpdateBookingMutation(bookingId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: Partial<CreateBookingPayload>) =>
      bookingService.updateBooking(bookingId, payload),
    onSuccess: () => {
      toast.success('Booking updated successfully', 'Booking Updated');
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update booking', 'Update Error');
    },
  });
}

export function useCancelBookingMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CancelBookingPayload }) =>
      bookingService.cancelBooking(id, payload),
    onSuccess: () => {
      toast.success('Booking cancelled', 'Cancelled');
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to cancel booking', 'Cancel Error');
    },
  });
}

export function useCheckInMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => bookingService.checkIn(id),
    onSuccess: () => {
      toast.success('Guest checked in', 'Check-In');
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Check-in failed', 'Error');
    },
  });
}

export function useCheckOutMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => bookingService.checkOut(id),
    onSuccess: () => {
      toast.success('Guest checked out', 'Check-Out');
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Check-out failed', 'Error');
    },
  });
}

export function useDeleteBookingMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => bookingService.softDeleteBooking(id),
    onSuccess: () => {
      toast.success('Booking deleted', 'Deleted');
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete', 'Error');
    },
  });
}

export function useRequestDeletionMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      bookingService.requestDeletion(id, reason),
    onSuccess: () => {
      toast.success('Deletion request submitted', 'Request Sent');
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to request deletion', 'Error');
    },
  });
}

export function useDeletionRequestsQuery(propertyId?: string) {
  return useQuery({
    queryKey: bookingKeys.deletionRequests(propertyId),
    queryFn: () => bookingService.getDeletionRequests(propertyId),
    staleTime: 10000,
  });
}

export function useApproveDeletionMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (requestId: string) => bookingService.approveDeletion(requestId),
    onSuccess: () => {
      toast.success('Deletion approved', 'Approved');
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to approve', 'Error');
    },
  });
}

export function useRejectDeletionMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (requestId: string) => bookingService.rejectDeletion(requestId),
    onSuccess: () => {
      toast.success('Deletion rejected', 'Rejected');
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to reject', 'Error');
    },
  });
}

export function useOccupancyQuery(propertyId: string, from: string, to: string) {
  return useQuery({
    queryKey: bookingKeys.occupancy(propertyId, from, to),
    queryFn: () => bookingService.getOccupancy(propertyId, from, to),
    enabled: !!propertyId && !!from && !!to,
    staleTime: 30000,
  });
}
