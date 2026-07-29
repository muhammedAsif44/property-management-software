'use client';

import React, { useState } from 'react';
import { PropertyItem, propertyService } from '../services/property.service';
import { usePropertyStore } from '../store/use-property-store';
import {
  useMyPropertiesQuery,
  useSwitchPropertyMutation,
} from '../api/use-properties';
import { useToast } from '@/components/ui/toast';
import {
  Building2,
  ChevronDown,
  Check,
  Plus,
  Hotel,
  MapPin,
  Sparkles,
  X,
  RefreshCw,
} from 'lucide-react';

export const PropertySwitcher: React.FC<{ onPropertyChange?: (prop: PropertyItem) => void }> = ({
  onPropertyChange,
}) => {
  const toast = useToast();
  
  // Zustand Global State
  const activeProperty = usePropertyStore((state) => state.activeProperty);
  const properties = usePropertyStore((state) => state.properties);

  // TanStack Query & Mutation
  const { isLoading, refetch } = useMyPropertiesQuery();
  const switchMutation = useSwitchPropertyMutation();

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
      toast.success(`Onboarded ${res.property.name} successfully!`, 'Property Created');
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
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100 text-slate-400 text-xs animate-pulse">
        <Building2 className="w-4 h-4" /> Loading properties...
      </div>
    );
  }

  return (
    <div className="relative">
      
      {/* Property Selector Pill Button (Instagram-Style) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-900 shadow-sm transition-all duration-200 group"
      >
        <div className="w-8 h-8 rounded-xl bg-[#0B6E4F]/10 text-[#0B6E4F] flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
          <Hotel className="w-4 h-4" />
        </div>

        <div className="text-left min-w-0 pr-1">
          <div className="text-xs font-black truncate text-slate-900 max-w-[140px]">
            {activeProperty ? activeProperty.name : 'No Property Selected'}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold truncate flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-slate-400" />
            {activeProperty?.city || 'Onboarding'}
          </div>
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Instagram-Style Dropdown Modal */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 top-12 mt-2 w-80 bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-4 z-50 animate-fade-in-up space-y-3">
            
            <div className="flex items-center justify-between px-2 pt-1 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0B6E4F]" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Switch Managed Property ({properties.length})
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Owned Properties */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {properties.map((prop) => {
                const isSelected = prop.id === activeProperty?.id;
                const isSwitching = switchMutation.isPending && switchMutation.variables === prop.id;

                return (
                  <button
                    key={prop.id}
                    onClick={() => handleSwitch(prop)}
                    disabled={isSwitching}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#0B6E4F]/10 border border-[#0B6E4F]/30 text-slate-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                          isSelected
                            ? 'bg-[#0B6E4F] text-white shadow-md shadow-[#0B6E4F]/20'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {prop.name.charAt(0)}
                      </div>

                      <div className="text-left truncate">
                        <div className="text-xs font-bold truncate text-slate-900">{prop.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {prop.city ? `${prop.city}, ${prop.state || 'IN'}` : 'Property Unit'}
                        </div>
                      </div>
                    </div>

                    {isSwitching ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0B6E4F]" />
                    ) : isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-[#0B6E4F] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Add Property Action Button */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsAddModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-[#0B6E4F] border border-slate-200/80 text-slate-700 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 text-[#0B6E4F]" /> Onboard New Property
              </button>
            </div>

          </div>
        </>
      )}

      {/* Add Property Onboarding Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in-up">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#0B6E4F] flex items-center justify-center font-bold">
                  <Hotel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Onboard New Property</h3>
                  <p className="text-xs text-slate-500">Add a Hotel, Resort, Villa, or Homestay to your portfolio.</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-[#0B6E4F] rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Property Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProp.name}
                  onChange={(e) => setNewProp({ ...newProp, name: e.target.value })}
                  placeholder="e.g. Sapphire Bay Resort & Spa"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#0B6E4F] focus:ring-1 focus:ring-[#0B6E4F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={newProp.city}
                    onChange={(e) => setNewProp({ ...newProp, city: e.target.value })}
                    placeholder="e.g. Goa, Jaipur"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#0B6E4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={newProp.state}
                    onChange={(e) => setNewProp({ ...newProp, state: e.target.value })}
                    placeholder="e.g. Rajasthan"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#0B6E4F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  value={newProp.address}
                  onChange={(e) => setNewProp({ ...newProp, address: e.target.value })}
                  placeholder="123 Beachside Drive"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#0B6E4F]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={addingLoading}
                  className="px-6 py-3 rounded-2xl bg-[#0B6E4F] hover:bg-[#08543c] text-white text-xs font-bold shadow-xl shadow-[#0B6E4F]/25 transition-all flex items-center gap-2"
                >
                  {addingLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Registering Property...
                    </>
                  ) : (
                    <>
                      Save Property <Plus className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
