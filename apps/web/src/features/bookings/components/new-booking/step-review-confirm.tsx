'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { CreateBookingPayload } from '../../types/booking.types';
import { RoomType } from './step-room-dates';
import { Edit3, User, BedDouble, CreditCard, IndianRupee, CheckCircle2, CalendarDays, Users, Utensils } from 'lucide-react';
import { calculateTac } from '@/lib/utils/financial-math';

interface StepReviewConfirmProps {
  form: Partial<CreateBookingPayload>;
  selectedRoom?: RoomType;
  agencies?: any[];
  baseAmount: number;
  facilityTotal: number;
  advancePaid: number;
  totalEstimate: number;
  balanceDue: number;
  onEditStep?: (step: number) => void;
}

/* ─── Review Section Card ─── */
function ReviewSection({
  title,
  icon: Icon,
  stepNum,
  onEdit,
  children,
  accentColor = 'emerald',
  delay = '0s',
}: {
  title: string;
  icon: any;
  stepNum: number;
  onEdit?: (step: number) => void;
  children: React.ReactNode;
  accentColor?: string;
  delay?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-100 border-emerald-200 text-emerald-700',
    blue: 'bg-blue-100 border-blue-200 text-blue-700',
    amber: 'bg-amber-100 border-amber-200 text-amber-700',
  };

  return (
    <div
      className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3 animate-cardReveal card-hover-lift"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${colorMap[accentColor]}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          {title}
        </h4>
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(stepNum)}
            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-all duration-200 btn-press"
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/* ─── Review Item ─── */
function ReviewItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-0.5">{label}</span>
      <p className="font-extrabold text-slate-900 text-xs min-w-0 truncate">{value || '—'}</p>
    </div>
  );
}

export function StepReviewConfirm({
  form,
  selectedRoom,
  agencies = [],
  baseAmount,
  facilityTotal,
  advancePaid,
  totalEstimate,
  balanceDue,
  onEditStep,
}: StepReviewConfirmProps) {
  const { t } = useTranslation();

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">{t('reviewAndConfirm')}</h2>
        <p className="text-xs text-slate-500 font-medium mt-1 min-w-0">{t('reviewBeforeSaving') || 'Review guest identity, stay dates, and total charges before saving.'}</p>
      </div>

      <div className="space-y-4">
        {/* ── Guest Info ── */}
        <ReviewSection title={t('guestDetails')} icon={User} stepNum={1} onEdit={onEditStep} accentColor="emerald" delay="0.05s">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ReviewItem label={t('guestName')} value={form.guestName} />
            <ReviewItem label={t('phoneNumber')} value={form.guestPhone} />
            <ReviewItem label={t('email')} value={form.guestEmail} />
            <ReviewItem label={t('nationality')} value={form.guestNationality} />
          </div>
        </ReviewSection>

        {/* ── Stay Details ── */}
        <ReviewSection title={t('roomAndDates')} icon={BedDouble} stepNum={2} onEdit={onEditStep} accentColor="blue" delay="0.1s">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ReviewItem label={t('roomType')} value={
              <span className="inline-flex items-center gap-1.5">
                <BedDouble className="w-3 h-3 text-emerald-600" />
                {selectedRoom?.name}
              </span>
            } />
            <ReviewItem label={t('channel')} value={
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white rounded-lg border border-slate-200 text-[11px] font-bold">
                {form.channel?.replace('_', ' ')}
              </span>
            } />
            <ReviewItem label={t('checkInDate')} value={formatDate(form.checkInDate)} />
            <ReviewItem label={t('checkOutDate')} value={formatDate(form.checkOutDate)} />
            <ReviewItem label={t('guests')} value={
              <span>{form.adults} {t('adults')}, {form.children || 0} {t('children')}</span>
            } />
            <ReviewItem label={t('mealPlan')} value={form.mealPlan || 'None'} />
          </div>
        </ReviewSection>

        {/* ── Pricing Summary ── */}
        <ReviewSection title={t('pricingAndFacilities')} icon={CreditCard} stepNum={3} onEdit={onEditStep} accentColor="amber" delay="0.15s">
          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-2.5">
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
            {advancePaid > 0 && (
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">{t('advancePaid')}</span>
                <span className="font-bold text-emerald-700">₹{advancePaid.toLocaleString('en-IN')}</span>
              </div>
            )}
            <hr className="border-emerald-200 my-1" />
            <div className="flex justify-between text-sm font-black">
              <span className="text-slate-900">{t('estimatedTotal')}</span>
              <span className="text-emerald-800 animate-counterPop">₹{totalEstimate.toLocaleString('en-IN')}</span>
            </div>

            {form.channel === 'AGENCY' && form.agencyId && (() => {
              const agency = agencies.find((a: any) => a.id === form.agencyId);
              const rate = Number(agency?.defaultTacRate || 10);
              const { tacAmount, propertyAmount } = calculateTac(totalEstimate, rate);

              return (
                <div className="p-3 bg-blue-50/90 rounded-xl border border-blue-200 space-y-1.5 text-xs mt-3 mb-3">
                  <div className="flex justify-between font-extrabold text-blue-900">
                    <span>Booking Source: Travel Agency</span>
                    <span className="font-black">{agency?.name || 'TAC Partner'}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-blue-800">
                    <span>TAC Commission Rate ({rate}%)</span>
                    <span>- ₹{tacAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-black text-blue-950 border-t border-blue-200 pt-1.5 mt-1.5">
                    <span>Net Property Amount</span>
                    <span>₹{propertyAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })()}
            {advancePaid > 0 && (
              <div className="flex justify-between text-sm font-extrabold pt-1">
                <span className={balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                  {t('balanceDue') || 'Balance Due at Check-in'}
                </span>
                <span className={balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                  ₹{balanceDue.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>
        </ReviewSection>

        {/* ── Confidence Message ── */}
        <div className="flex items-center gap-3 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/60 animate-fadeIn" style={{ animationDelay: '0.25s' }}>
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs font-bold text-emerald-800 min-w-0">
            {t('everythingLooksGood') || 'Everything looks good! Click "Confirm Booking" to save this reservation.'}
          </p>
        </div>
      </div>
    </div>
  );
}
