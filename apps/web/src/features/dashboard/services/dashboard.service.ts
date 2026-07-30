import { httpClient } from '@/lib/api/http-client';
import { DashboardAnalyticsResponse } from '../types/dashboard.types';

export class DashboardService {
  /**
   * Fetch live dashboard analytics aggregations for a property
   */
  async getDashboardAnalytics(propertyId?: string): Promise<DashboardAnalyticsResponse> {
    const query = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : '';
    return httpClient.get<DashboardAnalyticsResponse>(`/analytics/dashboard${query}`);
  }

  /**
   * Trigger manual auto-checkout for expired stays
   */
  async autoCheckoutExpiredBookings(propertyId?: string): Promise<{ message: string; updatedCount: number }> {
    const query = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : '';
    return httpClient.post<{ message: string; updatedCount: number }>(`/analytics/auto-checkout${query}`);
  }
}

export const dashboardService = new DashboardService();
