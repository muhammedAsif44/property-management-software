'use client';

import React, { useEffect } from 'react';
import { X, DoorClosed, CheckCircle2, AlertTriangle, Wrench, UserCheck, Edit3, Trash2, ShieldCheck, MapPin } from 'lucide-react';
import { RoomUnit } from '@/features/housekeeping/services/housekeeping.service';
import { useTranslation } from '@/lib/i18n';

interface RoomDetailDrawerProps {
  unit: RoomUnit | null;
  onClose: () => void;
  onMarkClean: (unitId: string) => void;
  onMarkDirty: (unitId: string) => void;
  onEditRoom: (unit: RoomUnit) => void;
  onReportIssue: (unit: RoomUnit) => void;
  onDeleteRoom: (unit: RoomUnit) => void;
  isManagerOrOwner: boolean;
}

export function RoomDetailDrawer({
  unit,
  onClose,
  onMarkClean,
  onMarkDirty,
  onEditRoom,
  onReportIssue,
  onDeleteRoom,
  isManagerOrOwner,
}: RoomDetailDrawerProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (unit) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [unit, onClose]);

  if (!unit) return null;

  const isOccupied = unit.bookings && unit.bookings.length > 0 && unit.bookings[0].status === 'CHECKED_IN';
  const activeBooking = unit.bookings && unit.bookings.length > 0 ? unit.bookings[0] : null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Slide-Over Side Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white/95 backdrop-blur-2xl shadow-2xl border-l border-emerald-200/90 flex flex-col justify-between overflow-y-auto animate-slideInRight relative">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg shrink-0 shadow-xs border border-emerald-200">
                <DoorClosed className="w-6 h-6 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-slate-900 truncate">
                  Room {unit.unitNumber}
                </h3>
                <p className="text-xs font-bold text-slate-500 truncate">
                  {unit.roomType?.name || 'Standard Room'} • {unit.floor || 'Floor Unassigned'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body Specs */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto text-xs">
            {/* Cleanliness Status Pill */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                {t('cleanlinessStatusLabel') || 'Cleanliness Status'}
              </span>
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border ${
                    unit.cleanlinessStatus === 'CLEAN'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : unit.cleanlinessStatus === 'DIRTY'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {unit.cleanlinessStatus === 'CLEAN' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {unit.cleanlinessStatus === 'DIRTY' && <AlertTriangle className="w-3.5 h-3.5" />}
                  {unit.cleanlinessStatus === 'OUT_OF_ORDER' && <Wrench className="w-3.5 h-3.5" />}
                  {unit.cleanlinessStatus.replace('_', ' ')}
                </span>

                <div className="flex items-center gap-2">
                  {unit.cleanlinessStatus !== 'CLEAN' && (
                    <button
                      onClick={() => onMarkClean(unit.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      Mark Clean
                    </button>
                  )}
                  {unit.cleanlinessStatus !== 'DIRTY' && (
                    <button
                      onClick={() => onMarkDirty(unit.id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer active:scale-95"
                    >
                      Mark Dirty
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Live Occupancy Status Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Live Occupancy & Guest Information
              </span>
              {isOccupied ? (
                <div className="flex items-start gap-3 pt-1">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-indigo-950 text-sm">
                      {activeBooking?.guest?.fullName || 'Active Guest'}
                    </h4>
                    <p className="text-xs text-indigo-600 font-medium mt-0.5">
                      Status: <strong className="uppercase">{activeBooking?.status}</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500 font-bold py-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Vacant — Ready for Guest Allocation</span>
                </div>
              )}
            </div>

            {/* Room Rate & Spec Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Pricing & Floor Specifications
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-800">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block font-semibold">Category</span>
                  <span className="text-slate-900 font-black truncate block">
                    {unit.roomType?.name || 'Room'}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block font-semibold">Base Rate</span>
                  <span className="text-emerald-700 font-black truncate block">
                    ₹{Number(unit.roomType?.basePrice || 0).toLocaleString('en-IN')} / night
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          {isManagerOrOwner && (
            <div className="p-5 pb-8 sm:pb-5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-3">
              <button
                onClick={() => onEditRoom(unit)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              >
                <Edit3 className="w-4 h-4 text-slate-600" /> Edit Room
              </button>

              <button
                onClick={() => onReportIssue(unit)}
                className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Wrench className="w-4 h-4 text-amber-600" /> Maintenance
              </button>

              <button
                onClick={() => onDeleteRoom(unit)}
                className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
                title="Delete Room"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
