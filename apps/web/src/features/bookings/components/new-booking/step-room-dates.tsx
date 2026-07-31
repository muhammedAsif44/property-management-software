'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { CreateBookingPayload } from '../../types/booking.types';

export interface RoomType {
  id: string;
  name: string;
  basePrice: number;
  totalUnits: number;
  maxOccupancy: number;
}

export interface Agency {
  id: string;
  name: string;
  contactPerson?: string;
  defaultTacRate?: number;
}

interface StepRoomDatesProps {
  form: Partial<CreateBookingPayload>;
  roomTypes: RoomType[];
  agencies: Agency[];
  onChange: (field: string, value: any) => void;
}

export function StepRoomDates({ form, roomTypes, agencies, onChange }: StepRoomDatesProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">{t('roomAndDates')}</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">Select configured room category, check-in dates, and occupancy.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('selectRoomType')} *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roomTypes.map((rt) => (
              <button
                key={rt.id}
                type="button"
                onClick={() => {
                  onChange('roomTypeId', rt.id);
                  onChange('baseAmount', rt.basePrice);
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  form.roomTypeId === rt.id
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200/90 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">{rt.name}</span>
                  <span className="text-emerald-700 font-black text-sm">₹{rt.basePrice}</span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  {rt.totalUnits} units configured • Max {rt.maxOccupancy} guests
                </p>
              </button>
            ))}
            {roomTypes.length === 0 && <p className="text-xs font-bold text-slate-400 col-span-2">{t('noRoomTypesConfigured')}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('checkInDate')} *</label>
            <input
              type="date"
              value={form.checkInDate || ''}
              onChange={(e) => onChange('checkInDate', e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('checkOutDate')} *</label>
            <input
              type="date"
              value={form.checkOutDate || ''}
              onChange={(e) => onChange('checkOutDate', e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('adults')}</label>
            <input
              type="number"
              min={1}
              value={form.adults || 1}
              onChange={(e) => onChange('adults', parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('children')}</label>
            <input
              type="number"
              min={0}
              value={form.children || 0}
              onChange={(e) => onChange('children', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('bookingChannel')}</label>
          <select
            value={form.channel || 'WALK_IN'}
            onChange={(e) => onChange('channel', e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="WALK_IN">{t('walkIn')}</option>
            <option value="PHONE">{t('phoneBooking')}</option>
            <option value="WEBSITE">Website</option>
            <option value="AGENCY">{t('agencyBooking')}</option>
            <option value="OTA">{t('otaBooking')}</option>
          </select>
        </div>

        {form.channel === 'AGENCY' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('selectAgency')}</label>
            <select
              value={form.agencyId || ''}
              onChange={(e) => onChange('agencyId', e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="">{t('chooseAgency')}</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.defaultTacRate}% TAC)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
