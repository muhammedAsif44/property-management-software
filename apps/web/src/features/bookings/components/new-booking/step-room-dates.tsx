'use client';

import React, { useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import { usePropertyStore } from '@/features/properties';
import { useHousekeepingUnitsQuery } from '@/features/housekeeping/api/use-housekeeping';
import { RoomUnit } from '@/features/housekeeping/services/housekeeping.service';
import { CreateBookingPayload } from '../../types/booking.types';
import { BedDouble, CalendarDays, Users, Minus, Plus, Phone, Globe, Plane, Building2, Moon } from 'lucide-react';

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

const ROOM_EMOJIS: Record<string, string> = {
  'standard': '🏨',
  'deluxe': '👑',
  'suite': '🌟',
  'executive': '🌟',
  'premium': '💎',
  'villa': '🏡',
};

function getRoomEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(ROOM_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return '🛏️';
}

/* ─── Stepper Control (- / +) ─── */
function StepperInput({
  label,
  value,
  min,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
  icon: any;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{label}</label>
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
        <Icon className="w-4 h-4 text-slate-500 shrink-0" />
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 font-bold flex items-center justify-center transition-all duration-200 cursor-pointer btn-press disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-8 text-center font-black text-slate-900 text-sm">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 font-bold flex items-center justify-center transition-all duration-200 cursor-pointer btn-press"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Channel Chip Selector ─── */
const CHANNELS = [
  { value: 'WALK_IN', icon: Users, labelKey: 'walkIn' },
  { value: 'PHONE', icon: Phone, labelKey: 'phoneBooking' },
  { value: 'WEBSITE', icon: Globe, labelKey: 'website' },
  { value: 'AGENCY', icon: Plane, labelKey: 'agencyBooking' },
  { value: 'OTA', icon: Building2, labelKey: 'otaBooking' },
];

export function StepRoomDates({ form, roomTypes, agencies, onChange }: StepRoomDatesProps) {
  const { t } = useTranslation();

  const activeProperty = usePropertyStore((s) => s.activeProperty);
  const { data: unitsData } = useHousekeepingUnitsQuery(activeProperty?.id);

  const rawUnitsData = (unitsData as any)?.units || (unitsData as any)?.data?.units || (Array.isArray(unitsData) ? unitsData : []);
  const units: RoomUnit[] = rawUnitsData;

  const { availableUnits, oooUnitsCount } = useMemo(() => {
    if (!form.roomTypeId) return { availableUnits: [], oooUnitsCount: 0 };

    const matchingTypeUnits = units.filter((u) => u.roomTypeId === form.roomTypeId);
    const oooCount = matchingTypeUnits.filter((u) => u.cleanlinessStatus === 'OUT_OF_ORDER').length;

    const cleanAndReadyUnits = matchingTypeUnits.filter((u) => {
      // Exclude Out of Order rooms completely
      if (u.cleanlinessStatus === 'OUT_OF_ORDER') return false;
      // Exclude currently occupied checked-in rooms
      const isOccupied = u.bookings && u.bookings.length > 0 && u.bookings[0].status === 'CHECKED_IN';
      if (isOccupied) return false;
      return true;
    });

    return { availableUnits: cleanAndReadyUnits, oooUnitsCount: oooCount };
  }, [units, form.roomTypeId]);

  // Night count calculation
  const nightCount = useMemo(() => {
    if (!form.checkInDate || !form.checkOutDate) return 0;
    const checkIn = new Date(form.checkInDate);
    const checkOut = new Date(form.checkOutDate);
    const diff = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [form.checkInDate, form.checkOutDate]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">{t('roomAndDates')}</h2>
        <p className="text-xs text-slate-500 font-medium mt-1 min-w-0">{t('selectRoomCategoryDates') || 'Select configured room category, check-in dates, and occupancy.'}</p>
      </div>

      <div className="space-y-6">
        {/* ── Room Type Cards ── */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">{t('selectRoomType')} *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roomTypes.map((rt) => {
              const isSelected = form.roomTypeId === rt.id;
              const emoji = getRoomEmoji(rt.name);
              return (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => {
                    onChange('roomTypeId', rt.id);
                    onChange('baseAmount', rt.basePrice);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 cursor-pointer btn-press group ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/80 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20 -translate-y-0.5'
                      : 'border-slate-200/90 bg-slate-50/50 hover:bg-slate-100/60 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <span className="text-base">{emoji}</span>
                      {rt.name}
                    </span>
                    <span className={`font-black text-sm ${isSelected ? 'text-emerald-700' : 'text-slate-700'}`}>₹{rt.basePrice.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 mt-1.5">
                    {rt.totalUnits} units configured • Max {rt.maxOccupancy} guests
                  </p>
                  {isSelected && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-emerald-700 uppercase tracking-wider animate-scaleIn">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Selected
                    </div>
                  )}
                </button>
              );
            })}
            {roomTypes.length === 0 && <p className="text-xs font-bold text-slate-400 col-span-2">{t('noRoomTypesConfigured')}</p>}
          </div>

          {/* Physical Room Selection Dropdown */}
          {form.roomTypeId && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Physical Room / Door (Optional)
                </label>
                {oooUnitsCount > 0 && (
                  <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    ⚠️ {oooUnitsCount} {oooUnitsCount === 1 ? 'room is' : 'rooms are'} Out of Order (Hidden)
                  </span>
                )}
              </div>

              <select
                value={form.roomUnitId || ''}
                onChange={(e) => onChange('roomUnitId', e.target.value || undefined)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer shadow-xs"
              >
                <option value="">Auto-Assign Room on Check-In</option>
                {availableUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    Room {unit.unitNumber} {unit.floor ? `(${unit.floor})` : ''} — {unit.cleanlinessStatus.replace('_', ' ')}
                  </option>
                ))}
              </select>

              {availableUnits.length === 0 && (
                <p className="text-[11px] font-semibold text-slate-500 italic">
                  No specific vacant rooms available right now. A room will be auto-assigned upon guest check-in.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Date Pickers with Night Count ── */}
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('checkInDate')} *</label>
              <div className="relative">
                <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={form.checkInDate || ''}
                  onChange={(e) => onChange('checkInDate', e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-all duration-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('checkOutDate')} *</label>
              <div className="relative">
                <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={form.checkOutDate || ''}
                  onChange={(e) => onChange('checkOutDate', e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Night Count Badge */}
          {nightCount > 0 && (
            <div className="mt-3 flex justify-center animate-scaleIn">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-black shadow-xs">
                <Moon className="w-3.5 h-3.5 text-blue-600" />
                {nightCount} {nightCount === 1 ? (t('nightStay') || 'Night') : (t('nightsStay') || 'Nights')}
              </span>
            </div>
          )}
        </div>

        {/* ── Occupancy Steppers ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StepperInput
            label={t('adults')}
            value={form.adults || 1}
            min={1}
            onChange={(v) => onChange('adults', v)}
            icon={Users}
          />
          <StepperInput
            label={t('children')}
            value={form.children || 0}
            min={0}
            onChange={(v) => onChange('children', v)}
            icon={Users}
          />
        </div>

        {/* ── Channel Chip Selector ── */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">{t('bookingChannel')}</label>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((ch) => {
              const ChIcon = ch.icon;
              const isSelected = form.channel === ch.value;
              return (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => onChange('channel', ch.value)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all duration-200 cursor-pointer btn-press inline-flex items-center gap-2 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs ring-1 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <ChIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {t(ch.labelKey as any) || ch.value.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Agency Selector (conditional slide-down) ── */}
        {form.channel === 'AGENCY' && (
          <div className="animate-slideDown">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t('selectAgency')}</label>
            <select
              value={form.agencyId || ''}
              onChange={(e) => onChange('agencyId', e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-all duration-200"
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
