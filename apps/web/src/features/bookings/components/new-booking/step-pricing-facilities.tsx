'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { CreateBookingPayload } from '../../types/booking.types';
import { RoomType } from './step-room-dates';

export interface Amenity {
  id: string;
  name: string;
  price: number;
  icon?: string;
}

interface StepPricingFacilitiesProps {
  form: Partial<CreateBookingPayload>;
  amenities: Amenity[];
  selectedRoom?: RoomType;
  onChange: (field: string, value: any) => void;
  toggleFacility: (id: string) => void;
}

export function StepPricingFacilities({
  form,
  amenities,
  selectedRoom,
  onChange,
  toggleFacility,
}: StepPricingFacilitiesProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">{t('pricingAndFacilities')}</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">Configure meal plans, extra add-ons, base rate, and advance payment.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('mealPlan')}</label>
          <select
            value={form.mealPlan || ''}
            onChange={(e) => onChange('mealPlan', e.target.value || undefined)}
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="">{t('noMealPlan')}</option>
            <option value="EP">EP — {t('europeanPlan')}</option>
            <option value="CP">CP — {t('continentalPlan')}</option>
            <option value="MAP">MAP — {t('modifiedAmericanPlan')}</option>
            <option value="AP">AP — {t('americanPlan')}</option>
          </select>
        </div>

        {amenities.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('extraFacilities')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {amenities.map((a) => {
                const selected = (form.facilityIds || []).includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleFacility(a.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span className="font-bold text-xs block truncate">{a.name}</span>
                    <span className="block text-[11px] text-emerald-700 font-extrabold mt-0.5">₹{a.price}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('baseAmount')} (₹) *</label>
            <input
              type="number"
              min={0}
              value={form.baseAmount || selectedRoom?.basePrice || ''}
              onChange={(e) => onChange('baseAmount', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('advancePaid')} (₹)</label>
            <input
              type="number"
              min={0}
              value={form.advancePaid || ''}
              onChange={(e) => onChange('advancePaid', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('notes')}</label>
          <textarea
            value={form.notes || ''}
            onChange={(e) => onChange('notes', e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium h-20 resize-none focus:outline-none focus:border-emerald-600"
            placeholder={t('bookingNotesPlaceholder')}
          />
        </div>
      </div>
    </div>
  );
}
