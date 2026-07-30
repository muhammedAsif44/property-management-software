import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { useToast } from '@/components/ui/toast';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  analytics: (propertyId?: string) => ['dashboard', 'analytics', propertyId || 'default'] as const,
};

/**
 * TanStack Query hook for fetching real-time dashboard analytics
 */
export function useDashboardAnalyticsQuery(propertyId?: string) {
  return useQuery({
    queryKey: dashboardKeys.analytics(propertyId),
    queryFn: () => dashboardService.getDashboardAnalytics(propertyId),
    refetchInterval: 30000, // Auto-refresh analytics every 30 seconds
    staleTime: 10000,
    retry: (failureCount, error: any) => {
      // Do not retry if the error is 401 Unauthorized
      if (error?.statusCode === 401) return false;
      return failureCount < 2;
    },
  });
}

/**
 * TanStack Mutation hook for triggering auto-checkout manually
 */
export function useAutoCheckoutMutation(propertyId?: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: () => dashboardService.autoCheckoutExpiredBookings(propertyId),
    onSuccess: (data) => {
      toast.success(data.message, 'Auto Checkout Sync');
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Auto-checkout sync failed', 'Sync Error');
    },
  });
}
