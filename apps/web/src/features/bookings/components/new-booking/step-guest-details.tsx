'use client';

import React, { useState } from 'react';
import { User, Phone, Mail, Globe2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { CreateBookingPayload } from '../../types/booking.types';

interface StepGuestDetailsProps {
  form: Partial<CreateBookingPayload>;
  onChange: (field: string, value: any) => void;
}

/* ─── Clean SaaS Form Input ─── */
function FormFieldInput({
  label,
  value,
  onChange,
  type = 'text',
  icon: Icon,
  required,
  placeholder,
  validation,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  icon: any;
  required?: boolean;
  placeholder?: string;
  validation?: (v: string) => boolean;
}) {
  const [touched, setTouched] = useState(false);
  const hasValue = value && value.length > 0;
  const isValid = validation ? validation(value) : true;
  const showError = touched && required && !hasValue;
  const showSuccess = touched && hasValue && isValid;

  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
        {label} {required && <span className="text-emerald-600">*</span>}
      </label>

      <div className="relative group">
        <Icon className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
          showError ? 'text-rose-400' : showSuccess ? 'text-emerald-500' : 'text-slate-400 group-focus-within:text-emerald-600'
        }`} />

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border text-slate-900 text-xs font-semibold focus:outline-none transition-all duration-200 focus-ring-emerald ${
            showError
              ? 'border-rose-300 bg-rose-50/40 focus:border-rose-500'
              : showSuccess
              ? 'border-emerald-300 bg-white focus:border-emerald-600'
              : 'border-slate-200 focus:border-emerald-600 focus:bg-white'
          }`}
        />

        {/* Validation Status Icon */}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {showError && <AlertCircle className="w-4 h-4 text-rose-500" />}
          {showSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        </div>
      </div>

      {/* Inline Error Message */}
      {showError && (
        <p className="text-[10px] font-bold text-rose-500 mt-1.5 ml-1">
          {label} is required
        </p>
      )}
    </div>
  );
}

export function StepGuestDetails({ form, onChange }: StepGuestDetailsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">{t('guestDetails')}</h2>
        <p className="text-xs text-slate-500 font-medium mt-1 min-w-0">{t('enterGuestIdentity') || 'Enter primary guest identity and contact details.'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormFieldInput
          label={t('guestName')}
          value={form.guestName || ''}
          onChange={(v) => onChange('guestName', v)}
          icon={User}
          required
          placeholder={t('enterGuestName')}
        />

        <FormFieldInput
          label={t('phoneNumber')}
          value={form.guestPhone || ''}
          onChange={(v) => onChange('guestPhone', v)}
          type="tel"
          icon={Phone}
          placeholder={t('enterPhone')}
        />

        <FormFieldInput
          label={t('email')}
          value={form.guestEmail || ''}
          onChange={(v) => onChange('guestEmail', v)}
          type="email"
          icon={Mail}
          placeholder={t('enterEmail')}
          validation={(v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}
        />

        <FormFieldInput
          label={t('nationality')}
          value={form.guestNationality || ''}
          onChange={(v) => onChange('guestNationality', v)}
          icon={Globe2}
          placeholder={t('enterNationality')}
        />
      </div>
    </div>
  );
}
