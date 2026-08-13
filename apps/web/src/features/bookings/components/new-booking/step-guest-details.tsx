'use client';

import React from 'react';
import { User, Phone, Mail, Globe, CreditCard, MapPin } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { CreateBookingPayload } from '../../types/booking.types';

interface StepGuestDetailsProps {
  form: Partial<CreateBookingPayload>;
  onChange: (field: string, value: any) => void;
}

const NATIONALITY_OPTIONS = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'IN', label: 'India' },
  { code: 'CA', label: 'Canada' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'IT', label: 'Italy' },
  { code: 'ES', label: 'Spain' },
  { code: 'AU', label: 'Australia' },
  { code: 'AE', label: 'United Arab Emirates' },
  { code: 'SG', label: 'Singapore' },
  { code: 'JP', label: 'Japan' },
];

const ID_TYPE_OPTIONS = [
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'NATIONAL_ID', label: 'National ID' },
  { value: 'DRIVING_LICENSE', label: "Driver's License" },
  { value: 'AADHAAR', label: 'Aadhaar Card' },
  { value: 'VOTER_ID', label: 'Voter ID' },
];

export function StepGuestDetails({ form, onChange }: StepGuestDetailsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Step Title Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
          <User className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white">Guest Details</h2>
          <p className="text-xs text-slate-400 font-medium">Enter primary guest identity and contact details.</p>
        </div>
      </div>

      {/* Two-Column Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Guest Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Guest Name <span className="text-emerald-700">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={form.guestName || ''}
              onChange={(e) => onChange('guestName', e.target.value)}
              placeholder="Enter guest full name"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* 2. Phone Number */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Phone Number <span className="text-emerald-700">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="tel"
              value={form.guestPhone || ''}
              onChange={(e) => onChange('guestPhone', e.target.value)}
              placeholder="Enter phone number"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* 3. Email Address */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="email"
              value={form.guestEmail || ''}
              onChange={(e) => onChange('guestEmail', e.target.value)}
              placeholder="Enter email address"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* 4. Nationality */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Nationality
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={form.guestNationality || (form as any).nationality || 'US'}
              onChange={(e) => {
                onChange('guestNationality', e.target.value);
                onChange('nationality', e.target.value);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">Select nationality</option>
              {NATIONALITY_OPTIONS.map((n) => (
                <option key={n.code} value={n.code}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 5. ID Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            ID Type
          </label>
          <div className="relative">
            <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={(form as any).idType || ''}
              onChange={(e) => onChange('idType', e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">Select ID type</option>
              {ID_TYPE_OPTIONS.map((idOpt) => (
                <option key={idOpt.value} value={idOpt.value}>
                  {idOpt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 6. ID Number */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            ID Number
          </label>
          <div className="relative">
            <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={(form as any).idNumber || ''}
              onChange={(e) => onChange('idNumber', e.target.value)}
              placeholder="Enter ID number"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* 7. Address (Optional) Spanning 2 Columns */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Address <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <textarea
              rows={2}
              value={form.notes || (form as any).address || ''}
              onChange={(e) => {
                onChange('address', e.target.value);
                onChange('notes', e.target.value);
              }}
              placeholder="Enter address"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
