/**
 * Official TanStack Query Key Factory for Properties Feature
 */
export const propertyKeys = {
  all: ['properties'] as const,
  lists: () => [...propertyKeys.all, 'list'] as const,
  list: (filters: string) => [...propertyKeys.lists(), { filters }] as const,
  myProperties: () => [...propertyKeys.all, 'my-properties'] as const,
  active: () => [...propertyKeys.all, 'active-property'] as const,
  onboarding: (id: string) => [...propertyKeys.all, 'onboarding', id] as const,
};
