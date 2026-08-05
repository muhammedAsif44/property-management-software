'use client';

import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { OccupancyCellBooking } from '@/features/bookings/types/booking.types';
import { X, User, Phone, Calendar, ArrowRight, ExternalLink, BedDouble, Eye } from 'lucide-react';

const STATUS_BADGE: Record<string, { label: string; bg: string; dot: string; text: string }> = {
  CONFIRMED: { label: 'Booked', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', dot: 'bg-rose-600' },
  CHECKED_IN: { label: 'Checked In', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', dot: 'bg-rose-600' },
  CHECKED_OUT: { label: 'Checked Out', bg: 'bg-slate-100 border-slate-300', text: 'text-slate-700', dot: 'bg-slate-500' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' },
  NO_SHOW: { label: 'No Show', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
};

export interface TargetRect {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}

interface BookingPreviewPopoverProps {
  targetRect?: TargetRect | null;
  bookings: OccupancyCellBooking[];
  dateLabel: string;
  roomTypeName?: string;
  onClose: () => void;
  onOpenDrawer?: (bookingId: string) => void;
}

export function BookingPreviewPopover({
  targetRect,
  bookings,
  dateLabel,
  roomTypeName,
  onClose,
  onOpenDrawer,
}: BookingPreviewPopoverProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    window.addEventListener('resize', onClose);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  const formatDate = (d: string) => {
    if (!d) return '—';
    const dateStr = d.includes('T') ? d : `${d}T00:00:00`;
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 1;
    const sStr = checkIn.includes('T') ? checkIn : `${checkIn}T00:00:00`;
    const eStr = checkOut.includes('T') ? checkOut : `${checkOut}T00:00:00`;
    const start = new Date(sStr).getTime();
    const end = new Date(eStr).getTime();
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const getPopoverPosition = () => {
    if (!targetRect || typeof window === 'undefined') {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', isTop: false, arrowLeft: 160 };
    }

    const popWidth = 320;
    const popEstimatedHeight = 280;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const spaceBelow = viewportHeight - targetRect.bottom;
    const isTop = spaceBelow < popEstimatedHeight && targetRect.top > popEstimatedHeight;

    let top = isTop ? targetRect.top - popEstimatedHeight - 10 : targetRect.bottom + 10;
    let left = targetRect.left + targetRect.width / 2 - popWidth / 2;

    const minLeft = 16;
    const maxLeft = viewportWidth - popWidth - 16;
    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;

    const targetCenterX = targetRect.left + targetRect.width / 2;
    const arrowLeft = Math.max(20, Math.min(popWidth - 20, targetCenterX - left));

    return {
      top: `${top}px`,
      left: `${left}px`,
      isTop,
      arrowLeft,
    };
  };

  if (!mounted) return null;

  const pos = getPopoverPosition();

  const content = (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div
        ref={cardRef}
        className="pointer-events-auto absolute w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-950/20 animate-in fade-in zoom-in-95 duration-150 flex flex-col overflow-hidden"
        style={{
          top: pos.top,
          left: pos.left,
        }}
      >
        <div
          className={`absolute w-3 h-3 bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 rotate-45 z-10 ${
            pos.isTop ? 'bottom-[-6px] border-b border-r' : 'top-[-6px] border-t border-l'
          }`}
          style={{ left: `${pos.arrowLeft}px`, transform: 'translateX(-50%) rotate(45deg)' }}
        />

        {/* Card Header */}
        <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
              <BedDouble className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {roomTypeName || t('bookingPreview')}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{dateLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
            title={t('closePreview')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bookings Card List */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-2">
          {bookings.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">{t('noBookingsThisDay')}</div>
          ) : (
            bookings.map((b) => {
              const badge = STATUS_BADGE[b.status] || STATUS_BADGE.CONFIRMED;
              const nights = calculateNights(b.checkInDate, b.checkOutDate);

              return (
                <div
                  key={b.id}
                  className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-300/80 dark:hover:border-slate-700 transition-all shadow-2xs group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {b.guestName ? b.guestName.charAt(0).toUpperCase() : 'G'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                          {b.guestName}
                        </p>
                        {b.guestPhone && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{b.guestPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${badge.bg} ${badge.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px] flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium my-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-2xs">
                      {nights} {t('nightsCount')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenDrawer) {
                          onOpenDrawer(b.id);
                        } else {
                          router.push(`/bookings/${b.id}`);
                        }
                      }}
                      className="flex items-center gap-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 transition-colors cursor-pointer group-hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t('viewBookingDetails')}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        router.push(`/bookings`);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      title="Open Bookings List"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
