export type StaffRole = 'MANAGER' | 'RECEPTION_STAFF' | 'HOUSEKEEPING' | 'VIEWER';
export type StaffStatus = 'INVITED' | 'ACTIVE' | 'REMOVED';

export interface StaffUser {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  approvalStatus: string;
  lastLoginAt: string | null;
}

export interface StaffItem {
  id: string;
  role: StaffRole;
  status: StaffStatus;
  invitedAt: string;
  joinedAt: string | null;
  createdAt: string;
  user: StaffUser;
  invitedByOwner: {
    id?: string;
    fullName: string;
    user?: {
      email: string;
    };
  } | null;
}

export interface StaffDirectoryResponse {
  property: {
    id: string;
    name: string;
  };
  staff: StaffItem[];
  total: number;
}

export interface InviteStaffPayload {
  email: string;
  role: StaffRole;
  propertyId?: string;
}
