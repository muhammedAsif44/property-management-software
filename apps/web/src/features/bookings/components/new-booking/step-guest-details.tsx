'use client';

import React from 'react';
import { User, Phone, Mail, Globe2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { CreateBookingPayload } from '../../types/booking.types';

interface StepGuestDetailsProps {
  form: Partial<CreateBookingPayload>;
  onChange: (field: string, value: any) => void;
}

export function StepGuestDetails({ form, onChange }: StepGuestDetailsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">{t('guestDetails')}</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">Enter primary guest identity and contact details.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('guestName')} *</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={form.guestName || ''}
              onChange={(e) => onChange('guestName', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
              placeholder={t('enterGuestName')}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('phoneNumber')}</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="tel"
              value={form.guestPhone || ''}
              onChange={(e) => onChange('guestPhone', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
              placeholder={t('enterPhone')}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('email')}</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={form.guestEmail || ''}
              onChange={(e) => onChange('guestEmail', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
              placeholder={t('enterEmail')}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('nationality')}</label>
          <div className="relative">
            <Globe2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={form.guestNationality || ''}
              onChange={(e) => onChange('guestNationality', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
              placeholder={t('enterNationality')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
