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
 */
export function useSwitchPropertyMutation() {
  const queryClient = useQueryClient();
  const setActiveProperty = usePropertyStore((state) => state.setActiveProperty);
  const toast = useToast();

  return useMutation({
    mutationFn: (propertyId: string) => propertyService.switchActiveProperty(propertyId),
    onSuccess: (data: { message: string; activeProperty: PropertyItem }) => {
      setActiveProperty(data.activeProperty);
      toast.success(data.message, 'Property Switched');
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
    onError: (err: any) => {
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
