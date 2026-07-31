import { httpClient } from '@/lib/api/http-client';
import { StaffDirectoryResponse, InviteStaffPayload, StaffRole } from '../types/staff.types';

export class StaffService {
  /**
   * Fetch staff directory for current property
   */
  async getStaffDirectory(propertyId?: string): Promise<StaffDirectoryResponse> {
    const query = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : '';
    const raw = await httpClient.get<any>(`/staff${query}`);
    return raw?.data || raw;
  }

  /**
   * Invite new staff member by email
   */
  async inviteStaff(payload: InviteStaffPayload): Promise<{ message: string; staff: any }> {
    const raw = await httpClient.post<any>('/staff/invite', payload);
    return raw?.data || raw;
  }

  /**
   * Update staff role
   */
  async updateStaffRole(staffId: string, role: StaffRole): Promise<{ message: string }> {
    const raw = await httpClient.patch<any>(`/staff/${staffId}/role`, { role });
    return raw?.data || raw;
  }

  /**
   * Suspend staff member
   */
  async suspendStaff(staffId: string): Promise<{ message: string; staffId: string }> {
    const raw = await httpClient.patch<any>(`/staff/${staffId}/suspend`);
    return raw?.data || raw;
  }

  /**
   * Reactivate staff member
   */
  async reactivateStaff(staffId: string): Promise<{ message: string; staffId: string }> {
    const raw = await httpClient.patch<any>(`/staff/${staffId}/reactivate`);
    return raw?.data || raw;
  }

  /**
   * Permanently delete staff member (Owner only)
   */
  async deleteStaffPermanently(staffId: string): Promise<{ message: string; staffId: string }> {
    const raw = await httpClient.delete<any>(`/staff/${staffId}`);
    return raw?.data || raw;
  }
}

export const staffService = new StaffService();
