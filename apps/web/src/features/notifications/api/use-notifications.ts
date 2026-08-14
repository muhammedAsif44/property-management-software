import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient as api } from '@/lib/api';

export const NOTIFICATIONS_QUERY_KEY = 'notifications';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  isRead: boolean;
}

export function useNotificationsQuery() {
  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY],
    queryFn: async () => {
      const res = await api.get<any>(`/notifications`);
      
      // TransformInterceptor + NestJS Controller response unwrapping:
      // Response shape: { success: true, statusCode: 200, data: { data: Notification[], meta: ... } }
      const level1 = res?.data ?? res;
      const level2 = level1?.data ?? level1?.notifications ?? level1?.items ?? level1;
      const list: Notification[] = Array.isArray(level2)
        ? level2
        : Array.isArray(level2?.data)
          ? level2.data
          : Array.isArray(res)
            ? res
            : [];

      return list;
    },
    refetchInterval: 4000, // Poll every 4 seconds for rapid broadcast detection
    staleTime: 1000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
    },
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      message: string;
      type?: string;
      targetRole?: string;
      targetPropertyId?: string;
    }) => {
      await api.post('/admin/notifications', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
    },
  });
}

export function useBroadcastAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      message: string;
      type?: string;
      targetRole?: string;
      organizationId?: string;
    }) => {
      await api.post('/admin/notifications/broadcast', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
    },
  });
}
