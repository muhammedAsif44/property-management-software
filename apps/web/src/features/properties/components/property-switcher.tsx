'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PropertyItem, propertyService } from '../services/property.service';
import { usePropertyStore } from '../store/use-property-store';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/features/auth';
import {
  useMyPropertiesQuery,
  useSwitchPropertyMutation,
} from '../api/use-properties';
import { useToast } from '@/components/ui/toast';
import { getQueryClient } from '@/lib/react-query';
import { propertyKeys } from '../api/property-keys';
import {
  Building2,
  ChevronDown,
  Check,
  Plus,
  Hotel,
  MapPin,
  X,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

import { createPortal } from 'react-dom';
import { useTranslation } from '@/lib/i18n';
import { useShallow } from 'zustand/react/shallow';

export const PropertySwitcher: React.FC<{ onPropertyChange?: (prop: PropertyItem) => void }> = ({
  onPropertyChange,
}) => {
  const toast = useToast();
  const { t } = useTranslation();

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { activeProperty, properties } = usePropertyStore(
    useShallow((state) => ({
      activeProperty: state.activeProperty,
      properties: state.properties,
    }))
  );

  // TanStack Query & Mutation
  const { isLoading, refetch } = useMyPropertiesQuery();
  const switchMutation = useSwitchPropertyMutation();

  // Resolve user role
  const { data: profileData } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => authService.getProfile(),
    staleTime: 60000,
    retry: false,
  });

  const userRole = profileData?.user?.role || profileData?.data?.user?.role || 'OWNER';
  const isOwner = userRole === 'OWNER' || userRole === 'SUPER_ADMIN';

  const [isOpen, setIsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Property Form State
  const [newProp, setNewProp] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    currency: 'INR',
  });
  const [addingLoading, setAddingLoading] = useState(false);

  // Handle Switch Property via TanStack Mutation
  const handleSwitch = (property: PropertyItem) => {
    if (property.id === activeProperty?.id) {
      setIsOpen(false);
      return;
    }

    switchMutation.mutate(property.id, {
      onSuccess: (res) => {
        if (onPropertyChange) {
          onPropertyChange(res.activeProperty);
        }
        setIsOpen(false);
      },
    });
  };

  // Handle Create Property
  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProp.name.trim()) return;

    setAddingLoading(true);
    try {
      const res = await propertyService.createProperty(newProp);
      const createdProp = (res as any)?.property || (res as any)?.data?.property;

      if (createdProp) {
        toast.success(`Onboarded ${createdProp.name} successfully!`, 'Property Created');

        const currentProps = usePropertyStore.getState().properties;
        const updatedProps = [createdProp, ...currentProps.filter((p) => p.id !== createdProp.id)];
        usePropertyStore.getState().setProperties(updatedProps, createdProp.id);
        usePropertyStore.getState().setActiveProperty(createdProp);

        const queryClient = getQueryClient();
        queryClient.setQueryData(propertyKeys.myProperties(), { properties: updatedProps, total: updatedProps.length });
        queryClient.setQueryData(propertyKeys.active(), { activeProperty: createdProp });
        queryClient.invalidateQueries({ queryKey: propertyKeys.all });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
      }

      setNewProp({ name: '', address: '', city: '', state: '', currency: 'INR' });
      setIsAddModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create property', 'Creation Error');
    } finally {
      setAddingLoading(false);
    }
  };

  if (isLoading && properties.length === 0) {
    return (
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-emerald-50/50 dark:bg-slate-900 border border-emerald-200/60 dark:border-slate-800 text-slate-400 text-xs animate-pulse">
        <Building2 className="w-4 h-4 text-[#0B6E4F]" /> Loading property...
      </div>
    );
  }

  const displayName = activeProperty?.name || t('noPropertySelected');
  const displayCity = activeProperty?.city || t('onboarding');

  return (
    <div className="relative w-full">
      {/* Current Active Property Pill Tile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/70 border border-emerald-300/80 dark:border-emerald-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 text-slate-900 dark:text-slate-100 shadow-2xs transition-all duration-200 group cursor-pointer select-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:scale-[0.99]"
        title={`${displayName} — ${t('clickToSwitch') || 'Click to switch'}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Hotel Icon Square Badge */}
          <div className="w-8.5 h-8.5 rounded-xl bg-[#0B6E4F] text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <Hotel className="w-4.5 h-4.5" />
          </div>

          {/* Property Name & City Stack */}
          <div className="text-left min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#0B6E4F] dark:text-emerald-400 leading-none">
                {t('currentPropertyLabel') || 'Current Property'}
              </span>
            </div>
            <div className="text-[13px] font-extrabold truncate text-slate-900 dark:text-slate-100 leading-snug mt-0.5" title={displayName}>
              {displayName}
            </div>
            <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 truncate flex items-center gap-1 leading-none mt-0.5">
              <MapPin className="w-3 h-3 text-[#0B6E4F] dark:text-emerald-400 shrink-0" />
              <span className="truncate">{displayCity}</span>
            </div>
          </div>
        </div>

        {/* Dropdown Chevron Indicator */}
        <div className="p-1 rounded-lg bg-emerald-100/60 dark:bg-emerald-900/60 text-[#0B6E4F] dark:text-emerald-300 shrink-0">
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          />
        </div>
      </button>

      {/* Modern Intuitive Dropdown Selector Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 w-full bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/90 dark:border-slate-800 shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 space-y-2.5">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-[#0B6E4F] dark:text-emerald-400 shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 truncate">
                {t('selectPropertyTitle') || 'Select Active Property'} ({properties.length})
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isOwner && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsAddModalOpen(true);
                  }}
                  className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-[#0B6E4F] dark:text-emerald-300 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
                  title="Onboard New Property"
                >
                  <Plus className="w-3 h-3" /> {t('addProperty')}
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List of Properties */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5 scrollbar-none">
            {properties.length === 0 ? (
              <div className="py-6 text-center">
                <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No properties found</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Onboard your hotel or resort below</p>
              </div>
            ) : (
              properties.map((prop) => {
                const isSelected = prop.id === activeProperty?.id;
                const isSwitching = switchMutation.isPending && switchMutation.variables === prop.id;

                return (
                  <button
                    key={prop.id}
                    onClick={() => handleSwitch(prop)}
                    disabled={isSwitching}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 cursor-pointer text-left outline-none focus:outline-none focus:ring-0 focus-visible:outline-none ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300/90 dark:border-emerald-700 text-slate-900 dark:text-slate-100 font-bold shadow-2xs'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-black transition-all ${
                          isSelected
                            ? 'bg-[#0B6E4F] text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {prop.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="text-left min-w-0 flex-1">
                        <div className="text-[12.5px] font-bold truncate text-slate-900 dark:text-slate-100" title={prop.name}>
                          {prop.name}
                        </div>
                        <div className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-[#0B6E4F] dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{prop.city ? `${prop.city}, ${prop.state || 'IN'}` : 'Property Unit'}</span>
                        </div>
                      </div>
                    </div>

                    {isSwitching ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0B6E4F] shrink-0 ml-2" />
                    ) : isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-[#0B6E4F] text-white flex items-center justify-center shrink-0 ml-2 shadow-2xs">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Portfolio Action Link */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/properties"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2 py-1.5 rounded-xl text-[11.5px] font-bold text-[#0B6E4F] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-all outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
            >
              <span>{t('manageAllProperties') || 'Manage All Properties'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Add Property Onboarding Modal rendered via Portal */}
      {isAddModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-[#0B6E4F] dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  <Hotel className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 truncate">{t('onboardNewProperty')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Add a Hotel, Resort, Villa, or Homestay to your portfolio.</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-[#0B6E4F] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  {t('propertyName')} *
                </label>
                <input
                  type="text"
                  required
                  value={newProp.name}
                  onChange={(e) => setNewProp({ ...newProp, name: e.target.value })}
                  placeholder="e.g. Sapphire Bay Resort & Spa"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-[#0B6E4F] focus:ring-1 focus:ring-[#0B6E4F] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    {t('city')}
                  </label>
                  <input
                    type="text"
                    value={newProp.city}
                    onChange={(e) => setNewProp({ ...newProp, city: e.target.value })}
                    placeholder="e.g. Goa, Jaipur"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-[#0B6E4F] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    {t('state')}
                  </label>
                  <input
                    type="text"
                    value={newProp.state}
                    onChange={(e) => setNewProp({ ...newProp, state: e.target.value })}
                    placeholder="e.g. Rajasthan"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-[#0B6E4F] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  {t('streetAddress')}
                </label>
                <input
                  type="text"
                  value={newProp.address}
                  onChange={(e) => setNewProp({ ...newProp, address: e.target.value })}
                  placeholder="123 Beachside Drive"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-[#0B6E4F] transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
                >
                  {t('cancel')}
                </button>

                <button
                  type="submit"
                  disabled={addingLoading}
                  className="px-6 py-3 rounded-2xl bg-[#0B6E4F] hover:bg-[#08543c] text-white text-xs font-bold shadow-xl shadow-[#0B6E4F]/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
                >
                  {addingLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Registering Property...
                    </>
                  ) : (
                    <>
                      {t('save')} <Plus className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
