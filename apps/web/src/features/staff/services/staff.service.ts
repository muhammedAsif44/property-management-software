import { httpClient } from '@/lib/api/http-client';
import { StaffDirectoryResponse, InviteStaffPayload, StaffRole } from '../types/staff.types';

export class StaffService {
  /**
   * Fetch staff directory for current property
   */
  async getStaffDirectory(propertyId?: string): Promise<StaffDirectoryResponse> {
    const query = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : '';
    return httpClient.get<StaffDirectoryResponse>(`/staff${query}`);
  }

  /**
   * Invite new staff member by email
   */
  async inviteStaff(payload: InviteStaffPayload): Promise<{ message: string; staff: any }> {
    return httpClient.post<{ message: string; staff: any }>('/staff/invite', payload);
  }

  /**
   * Update staff role
   */
  async updateStaffRole(staffId: string, role: StaffRole): Promise<{ message: string }> {
    return httpClient.patch<{ message: string }>(`/staff/${staffId}/role`, { role });
  }

  /**
   * Suspend staff member
   */
  async suspendStaff(staffId: string): Promise<{ message: string; staffId: string }> {
    return httpClient.patch<{ message: string; staffId: string }>(`/staff/${staffId}/suspend`);
  }

  /**
   * Reactivate staff member
   */
  async reactivateStaff(staffId: string): Promise<{ message: string; staffId: string }> {
    return httpClient.patch<{ message: string; staffId: string }>(`/staff/${staffId}/reactivate`);
  }

  /**
   * Permanently delete staff member (Owner only)
   */
  async deleteStaffPermanently(staffId: string): Promise<{ message: string; staffId: string }> {
    return httpClient.delete<{ message: string; staffId: string }>(`/staff/${staffId}`);
  }
}

export const staffService = new StaffService();
