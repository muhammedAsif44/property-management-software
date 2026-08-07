import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { housekeepingService } from '../services/housekeeping.service';
import { useToast } from '@/components/ui/toast';

export const housekeepingKeys = {
  all: ['housekeeping'] as const,
  units: (propertyId?: string, roomTypeId?: string, status?: string) =>
    ['housekeeping', 'units', propertyId, roomTypeId, status] as const,
  tasks: (propertyId?: string, status?: string) =>
    ['housekeeping', 'tasks', propertyId, status] as const,
};

export function useHousekeepingUnitsQuery(propertyId?: string, roomTypeId?: string, status?: string) {
  return useQuery({
    queryKey: housekeepingKeys.units(propertyId, roomTypeId, status),
    queryFn: () => housekeepingService.getUnits(propertyId, roomTypeId, status),
    enabled: !!propertyId,
    staleTime: 10000,
  });
}

export function useUpdateUnitStatusMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ unitId, status, notes }: { unitId: string; status: string; notes?: string }) =>
      housekeepingService.updateUnitStatus(unitId, status, notes),
    onSuccess: () => {
      toast.success('Room unit status updated', 'Housekeeping Updated');
      queryClient.invalidateQueries({ queryKey: housekeepingKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update unit status', 'Error');
    },
  });
}

export function useBatchGenerateUnitsMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ roomTypeId, prefix, startNumber, propertyId }: { roomTypeId: string; prefix?: string; startNumber?: number; propertyId?: string }) =>
      housekeepingService.batchGenerateUnits(roomTypeId, prefix, startNumber, propertyId),
    onSuccess: (data) => {
      toast.success(`Generated ${data.createdCount} room units`, 'Units Generated');
      queryClient.invalidateQueries({ queryKey: housekeepingKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to generate room units', 'Error');
    },
  });
}

export function useCreateRoomUnitMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ unitNumber, roomTypeId, floor, notes, propertyId }: { unitNumber: string; roomTypeId: string; floor?: string; notes?: string; propertyId?: string }) =>
      housekeepingService.createUnit(unitNumber, roomTypeId, floor, notes, propertyId),
    onSuccess: () => {
      toast.success('Room unit added successfully', 'Room Added');
      queryClient.invalidateQueries({ queryKey: housekeepingKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to add room unit', 'Error');
    },
  });
}

export function useUpdateRoomUnitMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ unitId, data }: { unitId: string; data: { unitNumber?: string; roomTypeId?: string; floor?: string; notes?: string } }) =>
      housekeepingService.updateUnit(unitId, data),
    onSuccess: () => {
      toast.success('Room unit updated', 'Room Updated');
      queryClient.invalidateQueries({ queryKey: housekeepingKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update room unit', 'Error');
    },
  });
}

export function useDeleteRoomUnitMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (unitId: string) => housekeepingService.deleteUnit(unitId),
    onSuccess: () => {
      toast.success('Room deleted successfully', 'Room Deleted');
      queryClient.invalidateQueries({ queryKey: housekeepingKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete room', 'Error');
    },
  });
}

export function useHousekeepingTasksQuery(propertyId?: string, status?: string) {
  return useQuery({
    queryKey: housekeepingKeys.tasks(propertyId, status),
    queryFn: () => housekeepingService.getTasks(propertyId, status),
    staleTime: 10000,
  });
}

export function useCreateHousekeepingTaskMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ roomUnitId, reportedIssue, assignedToUserId }: { roomUnitId: string; reportedIssue?: string; assignedToUserId?: string }) =>
      housekeepingService.createTask(roomUnitId, reportedIssue, assignedToUserId),
    onSuccess: () => {
      toast.success('Task created successfully', 'Task Created');
      queryClient.invalidateQueries({ queryKey: housekeepingKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create task', 'Error');
    },
  });
}

export function useUpdateHousekeepingTaskMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ taskId, status, reportedIssue, assignedToUserId }: { taskId: string; status?: string; reportedIssue?: string; assignedToUserId?: string }) =>
      housekeepingService.updateTask(taskId, status, reportedIssue, assignedToUserId),
    onSuccess: () => {
      toast.success('Task updated', 'Task Updated');
      queryClient.invalidateQueries({ queryKey: housekeepingKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update task', 'Error');
    },
  });
}
