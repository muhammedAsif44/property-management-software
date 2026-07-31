import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PropertyItem } from '../services/property.service';

interface PropertyState {
  activeProperty: PropertyItem | null;
  properties: PropertyItem[];
  defaultPropertyId: string | null;
  setActiveProperty: (property: PropertyItem | null) => void;
  setProperties: (properties: PropertyItem[], defaultPropertyId?: string) => void;
}

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set) => ({
      activeProperty: null,
      properties: [],
      defaultPropertyId: null,

      setActiveProperty: (property) =>
        set({
          activeProperty: property,
          defaultPropertyId: property?.id || null,
        }),

      setProperties: (properties, defaultPropertyId) =>
        set((state) => {
          const activeId = defaultPropertyId || state.activeProperty?.id || state.defaultPropertyId;
          const active = properties.find((p) => p.id === activeId) || state.activeProperty || properties[0] || null;
          return {
            properties,
            defaultPropertyId: activeId || active?.id || null,
            activeProperty: active,
          };
        }),
    }),
    {
      name: 'orvyn_active_property_store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
