'use client';

import React, { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { OccupancyCellBooking, BookingStatus } from '@/features/bookings/types/booking.types';
import { X, User, Phone, Calendar, ArrowRight } from 'lucide-react';

const STATUS_BADGE: Record<string, { label: string; bg: string; dot: string }> = {
  CONFIRMED: { label: 'Confirmed', bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', dot: 'bg-emerald-500' },
  CHECKED_IN: { label: 'Checked In', bg: 'bg-blue-50 border-blue-200 text-blue-800', dot: 'bg-blue-500' },
  CHECKED_OUT: { label: 'Checked Out', bg: 'bg-slate-100 border-slate-300 text-slate-600', dot: 'bg-slate-400' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-rose-50 border-rose-200 text-rose-700', dot: 'bg-rose-500' },
  NO_SHOW: { label: 'No Show', bg: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-500' },
};

interface BookingPreviewPopoverProps {
  bookings: OccupancyCellBooking[];
  dateLabel: string;
  onClose: () => void;
}

export function BookingPreviewPopover({ bookings, dateLabel, onClose }: BookingPreviewPopoverProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  return (
    <div
      ref={ref}
      className="absolute z-50 w-72 bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{ top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-900 truncate">{t('bookingPreview')}</p>
          <p className="text-[10px] text-slate-500 font-semibold">{dateLabel}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
          title={t('closePreview')}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Booking List */}
      <div className="max-h-60 overflow-y-auto px-1 py-1">
        {bookings.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">{t('noBookingsThisDay')}</p>
        ) : (
          bookings.map((b, idx) => {
            const badge = STATUS_BADGE[b.status] || STATUS_BADGE.CONFIRMED;
            return (
              <div
                key={b.id}
                className={`mx-1 p-3 rounded-xl hover:bg-slate-50/80 transition-colors ${idx > 0 ? 'border-t border-slate-50' : ''}`}
              >
                {/* Guest Name & Status */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100/80 border border-emerald-200 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate min-w-0">{b.guestName}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${badge.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    {badge.label}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1 ml-9">
                  {b.guestPhone && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{b.guestPhone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}</span>
                  </div>
                </div>

                {/* View Button */}
                <button
                  onClick={() => {
                    onClose();
                    router.push(`/bookings`);
                  }}
                  className="mt-2 ml-9 flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
                >
                  {t('viewFullBooking')}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
