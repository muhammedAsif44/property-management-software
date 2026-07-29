'use client';

import React, { memo } from 'react';
import { RoomTypeItem } from '../types/property-onboarding.types';
import { ArrowRight, BedDouble, Plus, Trash2 } from 'lucide-react';

interface Props {
  roomTypes: RoomTypeItem[];
  onChange: (roomTypes: RoomTypeItem[]) => void;
  onSave: () => void;
  onBack?: () => void;
  saving?: boolean;
  isSettingsView?: boolean;
}

export const Step3Rooms: React.FC<Props> = memo(({
  roomTypes,
  onChange,
  onSave,
  onBack,
  saving,
  isSettingsView,
}) => {
  const addCategory = () => {
    onChange([
      ...roomTypes,
      { name: 'Deluxe Suite', totalUnits: 2, basePrice: 3500, maxOccupancy: 2 },
    ]);
  };

  const removeCategory = (index: number) => {
    onChange(roomTypes.filter((_, i) => i !== index));
  };

  const updateCategory = (index: number, field: keyof RoomTypeItem, val: any) => {
    const updated = [...roomTypes];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#0B6E4F] flex items-center justify-center font-bold">
            <BedDouble className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {isSettingsView ? 'Room Setup & Rates' : 'Step 3: Room Setup'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure room categories, unit inventory, and base nightly rates.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={addCategory}
          className="px-3.5 py-2 rounded-xl bg-emerald-50 text-[#0B6E4F] text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Room Category
        </button>
      </div>

      <div className="space-y-4">
        {roomTypes.map((rt, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between"
          >
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1 w-full">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={rt.name}
                  onChange={(e) => updateCategory(idx, 'name', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B6E4F]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Total Units
                </label>
                <input
                  type="number"
                  value={rt.totalUnits}
                  onChange={(e) => updateCategory(idx, 'totalUnits', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B6E4F]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Price (₹/night)
                </label>
                <input
                  type="number"
                  value={rt.basePrice}
                  onChange={(e) => updateCategory(idx, 'basePrice', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B6E4F]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Max Occupants
                </label>
                <input
                  type="number"
                  value={rt.maxOccupancy}
                  onChange={(e) => updateCategory(idx, 'maxOccupancy', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B6E4F]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeCategory(idx)}
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
              title="Remove Room Category"
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
          {saving ? 'Saving...' : isSettingsView ? 'Save Room Types' : 'Save & Continue to Step 4'}
          {!isSettingsView && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
});

Step3Rooms.displayName = 'Step3Rooms';
