import React, { useState, useRef, useEffect } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useCancelBookingMutation } from '../api/use-bookings';
import { Booking } from '../types/booking.types';

export function CancelBookingModal({ 
  booking, 
  isOpen, 
  onClose,
  activePropertyId
}: { 
  booking: Booking | null; 
  isOpen: boolean; 
  onClose: () => void;
  activePropertyId?: string;
}) {
  const { t } = useTranslation();
  const [cancelReason, setCancelReason] = useState('');
  const [refundType, setRefundType] = useState<'REFUND' | 'FORFEIT'>('REFUND');
  const cancelMutation = useCancelBookingMutation();
  
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCancelReason('');
      setRefundType('REFUND');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleCancelConfirm = () => {
    if (!booking) return;
    cancelMutation.mutate(
      { id: booking.id, payload: { cancellationReason: cancelReason, refundType } },
      { onSuccess: () => { onClose(); setCancelReason(''); } }
    );
  };

  if (!isOpen) return null;

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
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">{t('cancelBooking')}</h3>
              <p className="text-xs text-slate-500 font-medium">
                {t('cancelBookingConfirm')} <strong>{booking?.guest?.fullName}</strong>?
              </p>
            </div>
          </div>

          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={t('cancellationReasonPlaceholder')}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium resize-none h-24 focus:outline-none focus:border-emerald-600"
            autoFocus
          />

          <div className="flex gap-2">
            <button
              onClick={() => { setRefundType('REFUND'); }}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${refundType === 'REFUND' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {t('refundAdvance')}
            </button>
            <button
              onClick={() => { setRefundType('FORFEIT'); }}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${refundType === 'FORFEIT' ? 'bg-rose-50 border-rose-300 text-rose-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {t('forfeitAdvance')}
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">{t('close')}</button>
            <button
              onClick={handleCancelConfirm}
              disabled={cancelMutation.isPending || !cancelReason}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              {cancelMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {cancelMutation.isPending ? t('cancelling') : t('confirmCancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
