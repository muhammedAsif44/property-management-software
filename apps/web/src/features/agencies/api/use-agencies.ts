import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agencyService, CreateAgencyPayload } from '../services/agency.service';
import { useToast } from '@/components/ui/toast';

export function useAgenciesQuery(propertyId: string) {
  return useQuery({
    queryKey: ['agencies', propertyId],
    queryFn: () => agencyService.getAgencies(propertyId),
    enabled: !!propertyId,
  });
}

export function useCreateAgencyMutation(propertyId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: CreateAgencyPayload) => agencyService.createAgency(propertyId, payload),
    onSuccess: (data) => {
      toast.success(data?.message || 'Agency registered', 'Success');
      queryClient.invalidateQueries({ queryKey: ['agencies', propertyId] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create agency', 'Error');
    },
  });
}

export function useSettleCommissionMutation(propertyId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ agencyId, amount }: { agencyId: string; amount: number }) =>
      agencyService.settleCommission(agencyId, amount),
    onSuccess: (data) => {
      toast.success(data?.message || 'Commission settled', 'Settled');
      queryClient.invalidateQueries({ queryKey: ['agencies', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to settle commission', 'Error');
    },
  });
}
