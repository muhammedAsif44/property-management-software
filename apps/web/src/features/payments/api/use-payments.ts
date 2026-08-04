import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService, PaymentRecordPayload } from '../services/payment.service';
import { useToast } from '@/components/ui/toast';

export function useBookingPaymentsQuery(bookingId: string) {
  return useQuery({
    queryKey: ['payments', bookingId],
    queryFn: () => paymentService.getBookingPayments(bookingId),
    enabled: !!bookingId,
  });
}

export function useRecordPaymentMutation(bookingId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: PaymentRecordPayload) =>
      paymentService.recordPayment(bookingId, payload),
    onSuccess: (data) => {
      toast.success(data?.message || 'Payment recorded', 'Success');
      queryClient.invalidateQueries({ queryKey: ['payments', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to record payment', 'Error');
    },
  });
}
