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
      const res = await api.get<Notification[]>(`/notifications`);
      return res;
    },
    // Poll every 30 seconds for new notifications
    refetchInterval: 30000,
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
