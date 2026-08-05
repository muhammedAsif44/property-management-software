import { useQuery } from '@tanstack/react-query';
import { httpClient as api } from '@/lib/api';

export const REPORTS_QUERY_KEY = 'reports';

export interface ReportData {
  period: string;
  dateRange: {
    from: string;
    to: string;
  };
  kpis: {
    totalRevenue: number;
    baseRevenue: number;
    taxes: number;
    totalPaymentsReceived: number;
    outstandingBalance: number;
    totalTac: number;
    adr: number;
    metrics: {
      totalBookings: number;
      validBookings: number;
      cancelledBookings: number;
      cancellationRate: number;
    };
  };
}

export function useReportsQuery(
  propertyId: string | null,
  options: { period: 'monthly' | 'yearly' | 'custom'; from?: string; to?: string }
) {
  return useQuery({
    queryKey: [REPORTS_QUERY_KEY, propertyId, options],
    queryFn: async () => {
      if (!propertyId) return null;
      const params = new URLSearchParams({ period: options.period });
      if (options.from) params.append('from', options.from);
      if (options.to) params.append('to', options.to);

      const res = await api.get<ReportData>(`/v1/properties/${propertyId}/reports?${params.toString()}`);
      return res;
    },
    enabled: !!propertyId && (options.period !== 'custom' || (!!options.from && !!options.to)),
  });
}
