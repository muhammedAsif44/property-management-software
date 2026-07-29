'use client';

import React, { memo } from 'react';
import { Step2TimesData } from '../types/property-onboarding.types';
import { ArrowRight, Clock } from 'lucide-react';

interface Props {
  data: Step2TimesData;
  onChange: (data: Step2TimesData) => void;
  onSave: () => void;
  onBack?: () => void;
  saving?: boolean;
  isSettingsView?: boolean;
}

export const Step2TimesTerms: React.FC<Props> = memo(({
  data,
  onChange,
  onSave,
  onBack,
  saving,
  isSettingsView,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#0B6E4F] flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {isSettingsView ? 'Times & Terms Settings' : 'Step 2: Check-in/out & Terms'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set default check-in & check-out times and master invoice terms & conditions.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Default Check-In Time
            </label>
            <input
              type="time"
              value={data.checkInTime}
              onChange={(e) => onChange({ ...data, checkInTime: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0B6E4F]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Default Check-Out Time
            </label>
            <input
              type="time"
              value={data.checkOutTime}
              onChange={(e) => onChange({ ...data, checkOutTime: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0B6E4F]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Master Terms & Conditions (Appears on Invoices)
          </label>
          <textarea
            rows={4}
            value={data.termsAndConditions}
            onChange={(e) => onChange({ ...data, termsAndConditions: e.target.value })}
            placeholder="Enter cancellation policy, guest check-in rules..."
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0B6E4F]"
          />
        </div>
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
          {saving ? 'Saving...' : isSettingsView ? 'Save Times & Terms' : 'Save & Continue to Step 3'}
          {!isSettingsView && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
});

Step2TimesTerms.displayName = 'Step2TimesTerms';
