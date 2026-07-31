'use client';

import React from 'react';
import { User, BedDouble, CreditCard, CheckCircle2, LucideIcon } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface StepItem {
  num: number;
  label: string;
  icon: LucideIcon;
}

interface BookingStepperHeaderProps {
  step: number;
  setStep: (step: number) => void;
}

export function BookingStepperHeader({ step, setStep }: BookingStepperHeaderProps) {
  const { t } = useTranslation();

  const steps: StepItem[] = [
    { num: 1, label: t('guestDetails'), icon: User },
    { num: 2, label: t('roomAndDates'), icon: BedDouble },
    { num: 3, label: t('pricingAndFacilities'), icon: CreditCard },
    { num: 4, label: t('reviewAndConfirm'), icon: CheckCircle2 },
  ];

  const progressPct = Math.round(((step - 1) / 4) * 100);
  const currentStepObj = steps.find((s) => s.num === step);

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-emerald-200/90 shadow-lg p-5 space-y-4">
      <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          {t('stepOf')} {step} / 4 — {progressPct}% {t('completed')}
        </span>
        <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200/90 shadow-2xs">
          {currentStepObj?.label}
        </span>
      </div>

      {/* Smooth Animated Linear Progress Indicator */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 transition-all duration-500 ease-out rounded-full shadow-xs"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Horizontal Connected Stepper Chain Bar */}
      <div className="flex items-center justify-between overflow-x-auto py-1 gap-1.5 scrollbar-none">
        {steps.map((st, i) => {
          const Icon = st.icon;
          const isDone = st.num < step;
          const isCurrent = st.num === step;

          return (
            <React.Fragment key={st.num}>
              <button
                type="button"
                onClick={() => (isDone || isCurrent) && setStep(st.num)}
                disabled={!isDone && !isCurrent}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-md shadow-emerald-700/20 ring-2 ring-emerald-500/30 scale-102'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/90 hover:bg-emerald-100/80 hover:-translate-y-0.5'
                    : 'bg-slate-100/80 text-slate-400 border border-slate-200/70 cursor-not-allowed opacity-70'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Icon className="w-4 h-4" />}
                <span className="min-w-0 truncate">{st.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 min-w-[20px] mx-1 transition-all duration-500 rounded-full ${
                    st.num < step ? 'bg-emerald-500 shadow-2xs' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
