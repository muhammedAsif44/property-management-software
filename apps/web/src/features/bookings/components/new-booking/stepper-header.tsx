'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface BookingStepperHeaderProps {
  step: number;
  setStep: (step: number) => void;
}

export function BookingStepperHeader({ step, setStep }: BookingStepperHeaderProps) {
  const { t } = useTranslation();

  const steps = [
    { num: 1, label: t('guestDetails') || 'Guest Details' },
    { num: 2, label: t('roomAndDates') || 'Room & Dates' },
    { num: 3, label: t('pricingAndFacilities') || 'Pricing & Facilities' },
    { num: 4, label: t('reviewAndConfirm') || 'Review & Confirm' },
  ];

  return (
    <div className="space-y-3 w-full">
      {/* Step Indicator Badge */}
      <div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
          Step {step} of 4
        </span>
      </div>

      {/* Horizontal Connected Stepper */}
      <div className="relative flex items-center justify-between w-full py-2">
        {/* Continuous Connecting Line Behind */}
        <div className="absolute left-[8%] right-[8%] top-5 -translate-y-1/2 h-[1.5px] bg-slate-200 dark:bg-slate-700 z-0" />

        {steps.map((st) => {
          const isCurrent = st.num === step;
          const isDone = st.num < step;

          return (
            <div key={st.num} className="relative z-10 flex flex-col items-center group">
              <button
                type="button"
                onClick={() => (isDone || isCurrent) && setStep(st.num)}
                disabled={!isDone && !isCurrent}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                  isCurrent
                    ? 'bg-emerald-950 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/60 shadow-xs'
                    : isDone
                    ? 'bg-emerald-800 text-white cursor-pointer hover:scale-105'
                    : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : st.num}
              </button>

              <span
                className={`text-xs mt-2 transition-colors duration-200 text-center select-none ${
                  isCurrent
                    ? 'font-bold text-slate-900 dark:text-white'
                    : isDone
                    ? 'font-semibold text-slate-700 dark:text-slate-300'
                    : 'font-medium text-slate-400 dark:text-slate-500'
                }`}
              >
                {st.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
