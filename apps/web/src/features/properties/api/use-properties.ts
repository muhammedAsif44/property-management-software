import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyService, PropertyItem } from '../services/property.service';
import { usePropertyStore } from '../store/use-property-store';
import { useToast } from '@/components/ui/toast';
import { propertyKeys } from './property-keys';

/**
 * TanStack Query hook for fetching all owned properties
 */
export function useMyPropertiesQuery() {
  const setProperties = usePropertyStore((state) => state.setProperties);

  return useQuery({
    queryKey: propertyKeys.myProperties(),
    queryFn: async () => {
      const data = await propertyService.getMyProperties();
      setProperties(data.properties, data.defaultPropertyId);
      return data;
    },
  });
}

/**
 * TanStack Query hook for fetching current active property
 */
export function useActivePropertyQuery() {
  const setActiveProperty = usePropertyStore((state) => state.setActiveProperty);

  return useQuery({
    queryKey: propertyKeys.active(),
    queryFn: async () => {
      const data = await propertyService.getActiveProperty();
      if (data.activeProperty) {
        setActiveProperty(data.activeProperty);
      }
      return data;
    },
  });
}

/**
 * TanStack Query hook for property onboarding data
 */
export function useOnboardingDataQuery(propertyId: string | null) {
  return useQuery({
    queryKey: propertyKeys.onboarding(propertyId || ''),
    queryFn: () => propertyService.getOnboardingData(propertyId!),
    enabled: !!propertyId,
  });
}

/**
 * TanStack Mutation hook for switching active property (Instagram-style)
 * Implements 0ms Optimistic UI updates for instant 60 FPS UI switching.
 */
export function useSwitchPropertyMutation() {
  const queryClient = useQueryClient();
  const setActiveProperty = usePropertyStore((state) => state.setActiveProperty);
  const properties = usePropertyStore((state) => state.properties);
  const toast = useToast();

  return useMutation({
    mutationFn: (propertyId: string) => propertyService.switchActiveProperty(propertyId),
    onMutate: async (propertyId: string) => {
      // 1. Cancel outgoing queries so background fetches don't overwrite optimistic state
      await queryClient.cancelQueries({ queryKey: propertyKeys.active() });

      // 2. Snapshot previous active property
      const previousActive = usePropertyStore.getState().activeProperty;

      // 3. Find target property and update Zustand + Query cache INSTANTLY (0ms!)
      const targetProperty = properties.find((p) => p.id === propertyId);
      if (targetProperty) {
        setActiveProperty(targetProperty);
        queryClient.setQueryData(propertyKeys.active(), { activeProperty: targetProperty });
      }

      return { previousActive };
    },
    onSuccess: (data: { message: string; activeProperty: PropertyItem }) => {
      if (data?.activeProperty) {
        setActiveProperty(data.activeProperty);
        queryClient.setQueryData(propertyKeys.active(), { activeProperty: data.activeProperty });
      }
      // Selective invalidation of active property & dashboard analytics only
      queryClient.invalidateQueries({ queryKey: propertyKeys.active(), exact: true });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err: any, _variables, context) => {
      // Rollback to previous state on network failure
      if (context?.previousActive) {
        setActiveProperty(context.previousActive);
        queryClient.setQueryData(propertyKeys.active(), { activeProperty: context.previousActive });
      }
      toast.error(err?.message || 'Failed to switch property', 'Switch Error');
    },
  });
}

/**
 * TanStack Mutation hook for saving onboarding step
 */
export function useSaveOnboardingStepMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ propertyId, payload }: { propertyId: string; payload: any }) =>
      propertyService.saveOnboardingStep(propertyId, payload),
    onSuccess: (data: { message: string; property: PropertyItem }, variables) => {
      toast.success(data.message, `Step ${variables.payload.step} Saved`);
      queryClient.invalidateQueries({ queryKey: propertyKeys.onboarding(variables.propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to save onboarding step', 'Save Error');
    },
  });
}
