import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useDeleteBookingMutation, useRequestDeletionMutation } from '../api/use-bookings';
import { Booking } from '../types/booking.types';

export function DeleteBookingModal({ 
  booking, 
  isOpen, 
  onClose,
  activePropertyId,
  isReception
}: { 
  booking: Booking | null; 
  isOpen: boolean; 
  onClose: () => void;
  activePropertyId?: string;
  isReception: boolean;
}) {
  const { t } = useTranslation();
  const [deleteReason, setDeleteReason] = useState('');
  
  const deleteMutation = useDeleteBookingMutation(activePropertyId);
  const requestDeletionMutation = useRequestDeletionMutation(activePropertyId);
  
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDeleteReason('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleDeleteConfirm = () => {
    if (!booking) return;
    if (isReception) {
      requestDeletionMutation.mutate(
        { id: booking.id, reason: deleteReason },
        { onSuccess: () => { onClose(); setDeleteReason(''); } }
      );
    } else {
      deleteMutation.mutate(booking.id, {
        onSuccess: () => { onClose(); }
      });
    }
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
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {isReception ? t('requestDeletion') : t('deleteBooking')}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isReception ? t('requestDeletionConfirm') : t('deleteBookingConfirm')}{' '}
                <strong>{booking?.guest?.fullName}</strong>
              </p>
            </div>
          </div>

          {isReception && (
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder={t('deletionReasonPlaceholder')}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium resize-none h-24 focus:outline-none focus:border-emerald-600"
              autoFocus
            />
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">{t('close')}</button>
            <button
              onClick={handleDeleteConfirm}
              disabled={(isReception && deleteReason.length < 5) || deleteMutation.isPending || requestDeletionMutation.isPending}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              {(deleteMutation.isPending || requestDeletionMutation.isPending) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isReception ? t('submitRequest') : t('confirmDelete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
