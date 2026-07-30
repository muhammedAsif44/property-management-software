import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '../services/staff.service';
import { InviteStaffPayload, StaffRole } from '../types/staff.types';
import { useToast } from '@/components/ui/toast';

export const staffKeys = {
  all: ['staff'] as const,
  directory: (propertyId?: string) => ['staff', 'directory', propertyId || 'default'] as const,
};

/**
 * Query staff directory
 */
export function useStaffDirectoryQuery(propertyId?: string) {
  return useQuery({
    queryKey: staffKeys.directory(propertyId),
    queryFn: () => staffService.getStaffDirectory(propertyId),
    staleTime: 15000,
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.statusCode === 401) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Mutation: Invite Staff Member
 */
export function useInviteStaffMutation(propertyId?: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: InviteStaffPayload) => staffService.inviteStaff(payload),
    onSuccess: (data) => {
      toast.success(data.message, 'Staff Invited');
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to send invitation', 'Invite Error');
    },
  });
}

/**
 * Mutation: Update Staff Role
 */
export function useUpdateStaffRoleMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ staffId, role }: { staffId: string; role: StaffRole }) =>
      staffService.updateStaffRole(staffId, role),
    onSuccess: (data) => {
      toast.success(data.message, 'Role Updated');
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update role', 'Update Error');
    },
  });
}

/**
 * Mutation: Suspend Staff Member
 */
export function useSuspendStaffMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (staffId: string) => staffService.suspendStaff(staffId),
    onSuccess: (data) => {
      toast.success(data.message, 'Staff Suspended');
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to suspend staff', 'Suspend Error');
    },
  });
}

/**
 * Mutation: Reactivate Staff Member
 */
export function useReactivateStaffMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (staffId: string) => staffService.reactivateStaff(staffId),
    onSuccess: (data) => {
      toast.success(data.message, 'Staff Reactivated');
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to reactivate staff', 'Reactivate Error');
    },
  });
}

/**
 * Mutation: Delete Staff Member Permanently (Owner Only)
 */
export function useDeleteStaffMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (staffId: string) => staffService.deleteStaffPermanently(staffId),
    onSuccess: (data) => {
      toast.success(data.message, 'Staff Removed');
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to remove staff member', 'Permission Denied');
    },
  });
}
