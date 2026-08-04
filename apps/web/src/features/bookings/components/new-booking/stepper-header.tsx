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

  const progressPct = Math.round(((step - 1) / 3) * 100);
  const currentStepObj = steps.find((s) => s.num === step);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
      {/* Top: Progress Info */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulseGlow" />
          {t('stepOf')} {step} / 4 — {progressPct}% {t('completed')}
        </span>
        <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/90 shadow-2xs min-w-0 truncate max-w-[160px]">
          {currentStepObj?.label}
        </span>
      </div>

      {/* Animated Progress Bar */}
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 transition-all duration-700 ease-out rounded-full shadow-xs relative overflow-hidden"
          style={{ width: `${progressPct}%` }}
        >
          {/* Shimmer overlay on filled portion */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        </div>
      </div>

      {/* Stepper Chain */}
      <div className="flex items-center justify-between overflow-x-auto py-1 gap-1 scrollbar-none">
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-300 shrink-0 cursor-pointer btn-press focus-ring-emerald ${
                  isCurrent
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-md shadow-emerald-700/20 ring-2 ring-emerald-500/30 scale-[1.02]'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/90 hover:bg-emerald-100/80 hover:-translate-y-0.5 hover:shadow-sm'
                    : 'bg-slate-100/80 text-slate-400 border border-slate-200/70 cursor-not-allowed opacity-60'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-checkPop" />
                ) : (
                  <Icon className={`w-4 h-4 ${isCurrent ? 'text-emerald-200' : ''}`} />
                )}
                <span className="min-w-0 truncate">{st.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 min-w-[16px] mx-1 transition-all duration-700 ease-out rounded-full ${
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
