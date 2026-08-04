import React, { useRef, useEffect } from 'react';
import { RotateCcw, ArrowRight, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useRevertStatusMutation } from '../api/use-bookings';
import { Booking } from '../types/booking.types';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  CONFIRMED: { label: 'Confirmed', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  CHECKED_IN: { label: 'Checked In', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  CHECKED_OUT: { label: 'Checked Out', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-300', dot: 'bg-slate-400' },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
  NO_SHOW: { label: 'No Show', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
};

export function RevertStatusModal({ 
  revertData, 
  isOpen, 
  onClose,
  activePropertyId
}: { 
  revertData: { booking: Booking; targetStatus: 'CONFIRMED' | 'CHECKED_IN' } | null; 
  isOpen: boolean; 
  onClose: () => void;
  activePropertyId?: string;
}) {
  const { t } = useTranslation();
  const revertMutation = useRevertStatusMutation(activePropertyId);
  
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !revertData) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-enter"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-slate-900/50" />
      <div className="relative modal-card-enter w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{t('revertBookingStatus') || 'Revert Booking Status'}</h3>
              <p className="text-xs text-slate-500 font-medium">
                Did you accidentally change the status for <strong>{revertData.booking.guest?.fullName}</strong>?
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_CONFIG[revertData.booking.status || 'CONFIRMED']?.bg} ${STATUS_CONFIG[revertData.booking.status || 'CONFIRMED']?.color}`}>
              {revertData.booking.status?.replace('_', ' ')}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_CONFIG[revertData.targetStatus || 'CONFIRMED']?.bg} ${STATUS_CONFIG[revertData.targetStatus || 'CONFIRMED']?.color}`}>
              {revertData.targetStatus?.replace('_', ' ')}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              onClick={() => {
                revertMutation.mutate(
                  { id: revertData.booking.id, status: revertData.targetStatus },
                  { onSuccess: () => onClose() }
                );
              }}
              disabled={revertMutation.isPending}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              {revertMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {revertMutation.isPending ? (t('reverting') || 'Reverting...') : (t('confirmRevert') || 'Confirm Revert')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
