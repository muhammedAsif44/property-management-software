import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient as api } from '@/lib/api';

// ─── Query Keys ───
export const ADMIN_DASHBOARD_KEY = 'admin-dashboard';
export const ADMIN_PENDING_OWNERS_KEY = 'admin-pending-owners';
export const ADMIN_TENANTS_KEY = 'admin-tenants';
export const ADMIN_BACKUPS_KEY = 'admin-backups';

// ─── Types ───
export interface PlatformStats {
  totalTenants: number;
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
  pendingApplications: number;
  totalCustomerUsers: number;
  recentTenants: RecentTenant[];
}

export interface RecentTenant {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  createdAt: string;
  _count: { properties: number; users: number };
  users: {
    id: string;
    email: string;
    approvalStatus: string;
    owner?: { fullName: string };
  }[];
}

export interface PendingOwner {
  id: string;
  email: string;
  phone?: string;
  role: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  owner?: {
    id: string;
    fullName: string;
    whatsappNumber?: string;
    defaultProperty?: {
      id: string;
      name: string;
    };
  };
}

export interface TenantOrg {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  billingEmail: string;
  createdAt: string;
  _count: { properties: number; users: number };
  users: {
    id: string;
    email: string;
    approvalStatus: string;
    owner?: { fullName: string };
  }[];
  properties: {
    id: string;
    name: string;
    city: string;
  }[];
}

export interface BackupLog {
  id: string;
  propertyId: string;
  syncType: string;
  status: string;
  recordCounts: any;
  errorMessage?: string;
  createdAt: string;
  property?: {
    name: string;
    organization?: { name: string };
  };
}

// ─── Queries ───

export function useAdminDashboard() {
  return useQuery<PlatformStats>({
    queryKey: [ADMIN_DASHBOARD_KEY],
    queryFn: async () => {
      const res = await api.get<any>('/admin/dashboard');
      return res?.data || res;
    },
    staleTime: 30000,
    retry: 1,
  });
}

export function usePendingOwners(status?: string) {
  return useQuery<{ count: number; pendingOwners: PendingOwner[] }>({
    queryKey: [ADMIN_PENDING_OWNERS_KEY, status],
    queryFn: async () => {
      const url = status && status !== 'ALL' ? `/admin/pending-owners?status=${status}` : '/admin/pending-owners';
      const res = await api.get<any>(url);
      return res?.data || res;
    },
    staleTime: 15000,
    retry: 1,
  });
}

export function useAdminTenants() {
  return useQuery<{ count: number; tenants: TenantOrg[] }>({
    queryKey: [ADMIN_TENANTS_KEY],
    queryFn: async () => {
      const res = await api.get<any>('/admin/tenants');
      return res?.data || res;
    },
    staleTime: 30000,
    retry: 1,
  });
}

export function useAdminBackupLogs() {
  return useQuery<{ count: number; logs: BackupLog[] }>({
    queryKey: [ADMIN_BACKUPS_KEY],
    queryFn: async () => {
      const res = await api.get<any>('/admin/backups');
      return res?.data || res;
    },
    staleTime: 60000,
    retry: 1,
  });
}

// ─── Mutations ───

export function useApproveOwner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.patch<any>(`/admin/owners/${userId}/approve`);
      return res?.data || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_PENDING_OWNERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_DASHBOARD_KEY] });
    },
  });
}

export function useRejectOwner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, rejectionReason }: { userId: string; rejectionReason?: string }) => {
      const res = await api.patch<any>(`/admin/owners/${userId}/reject`, { rejectionReason });
      return res?.data || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_PENDING_OWNERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_DASHBOARD_KEY] });
    },
  });
}

export function useToggleOrgStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId, status }: { orgId: string; status: string }) => {
      const res = await api.patch<any>(`/admin/tenants/${orgId}/status`, { status });
      return res?.data || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_TENANTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_DASHBOARD_KEY] });
    },
  });
}
