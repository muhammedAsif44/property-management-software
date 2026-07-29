'use client';

import React, { memo } from 'react';
import { AmenityItem } from '../types/property-onboarding.types';
import { ArrowRight, Sparkles, Plus, Trash2 } from 'lucide-react';

interface Props {
  amenities: AmenityItem[];
  onChange: (amenities: AmenityItem[]) => void;
  onSave: () => void;
  onBack?: () => void;
  saving?: boolean;
  isSettingsView?: boolean;
}

export const Step4Amenities: React.FC<Props> = memo(({
  amenities,
  onChange,
  onSave,
  onBack,
  saving,
  isSettingsView,
}) => {
  const addAmenity = () => {
    onChange([...amenities, { name: 'Airport Shuttle', price: 1200, icon: 'car' }]);
  };

  const removeAmenity = (index: number) => {
    onChange(amenities.filter((_, i) => i !== index));
  };

  const updateAmenity = (index: number, field: keyof AmenityItem, val: any) => {
    const updated = [...amenities];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#0B6E4F] flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {isSettingsView ? 'Amenities & Add-ons' : 'Step 4: Amenities & Add-ons'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure free and paid extra facilities (e.g. BBQ, Campfire, Pool Access).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={addAmenity}
          className="px-3.5 py-2 rounded-xl bg-emerald-50 text-[#0B6E4F] text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Extra Facility
        </button>
      </div>

      <div className="space-y-4">
        {amenities.map((am, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
          >
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Amenity / Add-on Name
                </label>
                <input
                  type="text"
                  value={am.name}
                  onChange={(e) => updateAmenity(idx, 'name', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B6E4F]/5 focus:bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B6E4F]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Price (₹ - 0 for Free)
                </label>
                <input
                  type="number"
                  value={am.price}
                  onChange={(e) => updateAmenity(idx, 'price', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B6E4F]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeAmenity(idx)}
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
              title="Remove Amenity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="pt-4 flex justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
          >
            Back
          </button>
        ) : <div />}

        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-3 rounded-2xl bg-[#0B6E4F] hover:bg-[#08543c] text-white text-xs font-bold shadow-xl shadow-[#0B6E4F]/25 transition-all flex items-center gap-2"
        >
          {saving ? 'Saving...' : isSettingsView ? 'Save Amenities' : 'Save & Continue to Step 5'}
          {!isSettingsView && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
});

Step4Amenities.displayName = 'Step4Amenities';
