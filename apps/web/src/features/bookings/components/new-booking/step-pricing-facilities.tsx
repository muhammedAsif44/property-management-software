'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { CreateBookingPayload } from '../../types/booking.types';
import { RoomType } from './step-room-dates';
import { IndianRupee, CheckCircle2, StickyNote, Coffee, Utensils, UtensilsCrossed, Soup } from 'lucide-react';

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

/* ─── Meal Plan Visual Cards ─── */
const MEAL_PLANS = [
  { value: '', label: 'None', desc: 'No meal included', emoji: '🚫' },
  { value: 'EP', label: 'EP', desc: 'Room Only', emoji: '🛏️' },
  { value: 'CP', label: 'CP', desc: 'Bed & Breakfast', emoji: '☕' },
  { value: 'MAP', label: 'MAP', desc: 'Half Board', emoji: '🥘' },
  { value: 'AP', label: 'AP', desc: 'Full Board', emoji: '🍱' },
];

export function StepPricingFacilities({
  form,
  amenities,
  selectedRoom,
  onChange,
  toggleFacility,
}: StepPricingFacilitiesProps) {
  const { t } = useTranslation();

  // Live pricing calculation
  const baseAmount = Number(form.baseAmount ?? selectedRoom?.basePrice ?? 0);
  const facilityTotal = (form.facilityIds || []).reduce((sum, id) => {
    const a = amenities.find((x) => x.id === id);
    return sum + Number(a?.price || 0);
  }, 0);
  const advancePaid = Number(form.advancePaid || 0);
  const liveTotal = baseAmount + facilityTotal;
  const liveBalance = Math.max(0, liveTotal - advancePaid);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">{t('pricingAndFacilities')}</h2>
        <p className="text-xs text-slate-500 font-medium mt-1 min-w-0">{t('configureMealPlan') || 'Configure meal plans, extra add-ons, base rate, and advance payment.'}</p>
      </div>

      <div className="space-y-6">
        {/* ── Meal Plan Visual Cards ── */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">{t('mealPlan')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {MEAL_PLANS.map((mp) => {
              const isSelected = (form.mealPlan || '') === mp.value;
              return (
                <button
                  key={mp.value}
                  type="button"
                  onClick={() => onChange('mealPlan', mp.value || undefined)}
                  className={`p-3.5 rounded-2xl border-2 text-center transition-all duration-300 cursor-pointer btn-press ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/80 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/20 -translate-y-0.5'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 hover:-translate-y-0.5 hover:shadow-sm hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl block mb-1">{mp.emoji}</span>
                  <span className={`font-black text-xs block ${isSelected ? 'text-emerald-800' : 'text-slate-800'}`}>{mp.label}</span>
                  <span className="text-[10px] font-medium text-slate-500 block mt-0.5 min-w-0 truncate">{mp.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Facility Toggle Buttons ── */}
        {amenities.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">{t('extraFacilities')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {amenities.map((a) => {
                const selected = (form.facilityIds || []).includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleFacility(a.id)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-300 cursor-pointer btn-press relative overflow-hidden ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-xs block truncate">{a.name}</span>
                        <span className={`block text-[11px] font-extrabold mt-1 ${selected ? 'text-emerald-700' : 'text-slate-500'}`}>₹{a.price.toLocaleString('en-IN')}</span>
                      </div>
                      {selected && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 animate-checkPop" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Amount Inputs with Currency Prefix ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('baseAmount')} *</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none flex items-center gap-0.5">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
              <input
                type="number"
                min={0}
                value={form.baseAmount || selectedRoom?.basePrice || ''}
                onChange={(e) => onChange('baseAmount', parseFloat(e.target.value) || 0)}
                className="w-full pl-9 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('advancePaid')}</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none flex items-center gap-0.5">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
              <input
                type="number"
                min={0}
                value={form.advancePaid || ''}
                onChange={(e) => onChange('advancePaid', parseFloat(e.target.value) || 0)}
                className="w-full pl-9 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* ── Notes ── */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <StickyNote className="w-3.5 h-3.5 text-slate-400" />
            {t('notes')}
          </label>
          <textarea
            value={form.notes || ''}
            onChange={(e) => onChange('notes', e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium h-20 resize-none focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
            placeholder={t('bookingNotesPlaceholder')}
          />
        </div>

        {/* ── Live Pricing Summary ── */}
        <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-2 animate-fadeIn">
          <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-2">Live Estimate</h4>
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600">{t('baseAmount')}</span>
            <span className="font-bold text-slate-900">₹{baseAmount.toLocaleString('en-IN')}</span>
          </div>
          {facilityTotal > 0 && (
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600">{t('facilities')}</span>
              <span className="font-bold text-slate-900">₹{facilityTotal.toLocaleString('en-IN')}</span>
            </div>
          )}
          <hr className="border-emerald-200 my-1" />
          <div className="flex justify-between text-sm font-black">
            <span className="text-emerald-900">{t('estimatedTotal')}</span>
            <span className="text-emerald-900 animate-counterPop">₹{liveTotal.toLocaleString('en-IN')}</span>
          </div>
          {advancePaid > 0 && (
            <div className="flex justify-between text-xs font-bold text-emerald-700 pt-1">
              <span>{t('balanceDue') || 'Balance Due'}</span>
              <span>₹{liveBalance.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
