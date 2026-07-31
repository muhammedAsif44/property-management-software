'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { CreateBookingPayload } from '../../types/booking.types';
import { RoomType } from './step-room-dates';

interface StepReviewConfirmProps {
  form: Partial<CreateBookingPayload>;
  selectedRoom?: RoomType;
  baseAmount: number;
  facilityTotal: number;
  advancePaid: number;
  totalEstimate: number;
  balanceDue: number;
}

export function StepReviewConfirm({
  form,
  selectedRoom,
  baseAmount,
  facilityTotal,
  advancePaid,
  totalEstimate,
  balanceDue,
}: StepReviewConfirmProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">{t('reviewAndConfirm')}</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">Review guest identity, stay dates, and total charges before saving.</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs">
          <div>
            <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-0.5">{t('guest')}:</span>
            <p className="font-extrabold text-slate-900">{form.guestName || '—'}</p>
          </div>
          <div>
            <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-0.5">{t('phoneNumber')}:</span>
            <p className="font-extrabold text-slate-900">{form.guestPhone || '—'}</p>
          </div>
          <div>
            <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-0.5">{t('roomType')}:</span>
            <p className="font-extrabold text-slate-900">{selectedRoom?.name || '—'}</p>
          </div>
          <div>
            <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-0.5">{t('channel')}:</span>
            <p className="font-extrabold text-slate-900">{form.channel}</p>
          </div>
          <div>
            <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-0.5">{t('checkInDate')}:</span>
            <p className="font-extrabold text-slate-900">{form.checkInDate}</p>
          </div>
          <div>
            <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-0.5">{t('checkOutDate')}:</span>
            <p className="font-extrabold text-slate-900">{form.checkOutDate}</p>
          </div>
          <div>
            <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-0.5">{t('guests')}:</span>
            <p className="font-extrabold text-slate-900">
              {form.adults} {t('adults')}, {form.children || 0} {t('children')}
            </p>
          </div>
          <div>
            <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-0.5">{t('mealPlan')}:</span>
            <p className="font-extrabold text-slate-900">{form.mealPlan || 'None'}</p>
          </div>
        </div>

        <div className="p-5 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600">{t('baseAmount')}:</span>
            <span className="font-bold text-slate-900">₹{baseAmount.toLocaleString('en-IN')}</span>
          </div>
          {facilityTotal > 0 && (
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600">{t('facilities')}:</span>
              <span className="font-bold text-slate-900">₹{facilityTotal.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600">{t('advancePaid')}:</span>
            <span className="font-bold text-emerald-700">₹{advancePaid.toLocaleString('en-IN')}</span>
          </div>
          <hr className="my-2 border-emerald-200" />
          <div className="flex justify-between text-sm font-black">
            <span className="text-slate-900">{t('estimatedTotal')}:</span>
            <span className="text-slate-900">₹{totalEstimate.toLocaleString('en-IN')}</span>
          </div>
          {advancePaid > 0 && (
            <div className="flex justify-between text-sm font-extrabold text-emerald-800 pt-1">
              <span>Balance Due at Check-in:</span>
              <span>₹{balanceDue.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
