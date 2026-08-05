'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import { useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/booking.service';
import { useHousekeepingUnitsQuery } from '@/features/housekeeping/api/use-housekeeping';
import { Booking } from '../types/booking.types';
import { X, BedDouble, CheckCircle2, Loader2, Key } from 'lucide-react';

interface AssignRoomUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onSuccess?: () => void;
}

export function AssignRoomUnitModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: AssignRoomUnitModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedUnitObj, setSelectedUnitObj] = useState<{ id: string; unitNumber: string } | null>(null);
  const [customUnitNumber, setCustomUnitNumber] = useState<string>('');
  const [actionType, setActionType] = useState<'ONLY' | 'CHECKIN' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useHousekeepingUnitsQuery(
    booking?.propertyId,
    booking?.roomTypeId
  );
  
  const units = Array.isArray(data) ? data : data?.units || [];

  if (!isOpen || !booking) return null;

  const getTargetRoomUnit = () => {
    let targetRoomUnitId = selectedUnitObj?.id;
    let targetLabel = selectedUnitObj?.unitNumber || customUnitNumber;

    if (!targetRoomUnitId && customUnitNumber) {
      const match = units.find((u: any) => u.unitNumber === customUnitNumber || u.number === customUnitNumber);
      if (match) {
        targetRoomUnitId = match.id;
        targetLabel = match.unitNumber;
      } else {
        targetRoomUnitId = customUnitNumber;
      }
    }
    return { targetRoomUnitId, targetLabel };
  };

  const handleAssignOnly = async () => {
    const { targetRoomUnitId, targetLabel } = getTargetRoomUnit();
    if (!targetLabel) {
      toast.warning('Please select or enter a room unit number', 'Room Unit Required');
      return;
    }

    setIsSubmitting(true);
    setActionType('ONLY');
    try {
      if (targetRoomUnitId) {
        await bookingService.updateBooking(booking.id, {
          roomUnitId: targetRoomUnitId,
        } as any);
      }

      toast.success(
        `Room ${targetLabel} assigned to guest successfully!`,
        'Room Assigned'
      );
      queryClient.invalidateQueries();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to assign room unit', 'Error');
    } finally {
      setIsSubmitting(false);
      setActionType(null);
    }
  };

  const handleAssignAndCheckIn = async () => {
    const { targetRoomUnitId, targetLabel } = getTargetRoomUnit();

    if (!targetLabel) {
      toast.warning('Please select or enter a room unit number', 'Room Unit Required');
      return;
    }

    setIsSubmitting(true);
    setActionType('CHECKIN');
    try {
      if (targetRoomUnitId) {
        await bookingService.updateBooking(booking.id, {
          roomUnitId: targetRoomUnitId,
        } as any);
      }

      await bookingService.checkIn(booking.id, targetRoomUnitId);

      toast.success(
        `Room ${targetLabel} assigned & Guest checked in successfully!`,
        'Check-In Complete'
      );
      queryClient.invalidateQueries();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to assign room unit & check-in', 'Error');
    } finally {
      setIsSubmitting(false);
      setActionType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-5 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {t('assignRoomUnitTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                {booking?.guest?.fullName || 'Guest'} · {booking?.roomType?.name || 'Deluxe Room'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Unit Selection Grid */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            {t('selectRoomUnit')}
          </label>

          {isLoading ? (
            <div className="py-8 text-center text-xs font-bold text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>Loading room units...</span>
            </div>
          ) : units && units.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {units.map((u: any) => {
                const uNum = String(u.unitNumber || u.number || u.id);
                const isSelected = selectedUnitObj?.id === u.id || selectedUnitObj?.unitNumber === uNum;

                return (
                  <button
                    key={u.id || uNum}
                    type="button"
                    onClick={() => {
                      setSelectedUnitObj({ id: u.id, unitNumber: uNum });
                      setCustomUnitNumber('');
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-600 font-black shadow-md ring-2 ring-amber-400'
                        : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold'
                    }`}
                  >
                    <BedDouble className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span className="text-xs">Room {uNum}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
              <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Manual Room Unit Entry
              </p>
              <input
                type="text"
                placeholder="e.g. 101, 102, 201..."
                value={customUnitNumber}
                onChange={(e) => {
                  setCustomUnitNumber(e.target.value);
                  setSelectedUnitObj(null);
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
        </div>

        {/* Footer Dual Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleAssignOnly}
            disabled={isSubmitting || (!selectedUnitObj && !customUnitNumber)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting && actionType === 'ONLY' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <BedDouble className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>{t('assignRoomOnly')}</span>
          </button>

          <button
            type="button"
            onClick={handleAssignAndCheckIn}
            disabled={isSubmitting || (!selectedUnitObj && !customUnitNumber)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isSubmitting && actionType === 'CHECKIN' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>{t('assignAndCheckIn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
