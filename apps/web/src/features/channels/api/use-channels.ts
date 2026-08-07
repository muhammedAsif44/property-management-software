import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/lib/api/http-client';

export interface OtaChannelItem {
  channel: string;
  isConnected: boolean;
  syncStatus: 'SYNCED' | 'PENDING' | 'FAILED';
  lastSyncedAt: string | null;
  totalBookingsImported: number;
  credentials?: Record<string, any>;
}

export function useOtaChannels(propertyId?: string) {
  return useQuery<OtaChannelItem[]>({
    queryKey: ['ota-channels', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const res = (await httpClient.get(`/ota/channels?propertyId=${propertyId}`)) as any;
      return res.data || res;
    },
    enabled: !!propertyId,
  });
}

export function useConnectChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ propertyId, channel, credentials }: { propertyId: string; channel: string; credentials?: any }) => {
      const res = (await httpClient.post(`/ota/connect?propertyId=${propertyId}`, { channel, credentials })) as any;
      return res.data || res;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ota-channels', variables.propertyId] });
    },
  });
}

export function useSyncAri() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ propertyId, channel }: { propertyId: string; channel?: string }) => {
      const res = (await httpClient.post(`/ota/sync-ari?propertyId=${propertyId}`, { channel })) as any;
      return res.data || res;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ota-channels', variables.propertyId] });
    },
  });
}

export function useSimulateOtaWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = (await httpClient.post('/ota/webhook', payload)) as any;
      return res.data || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
  });
}
