'use client';

import React from 'react';
import { DoorClosed, Edit3, Trash2, CheckCircle2, AlertTriangle, Wrench, Eye } from 'lucide-react';
import { RoomUnit } from '@/features/housekeeping/services/housekeeping.service';

interface RoomsGridViewProps {
  units: RoomUnit[];
  isManagerOrOwner: boolean;
  onCardClick?: (unit: RoomUnit) => void;
  onMarkClean: (unitId: string) => void;
  onMarkDirty: (unitId: string) => void;
  onEditRoom: (unit: RoomUnit) => void;
  onReportIssue?: (unit: RoomUnit) => void;
  onDeleteRoom: (unit: RoomUnit) => void;
}

export const RoomsGridView: React.FC<RoomsGridViewProps> = ({
  units,
  isManagerOrOwner,
  onCardClick,
  onMarkClean,
  onMarkDirty,
  onEditRoom,
  onReportIssue,
  onDeleteRoom,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {units.map((u) => {
        const isOccupied = u.bookings && u.bookings.length > 0 && u.bookings[0].status === 'CHECKED_IN';
        const activeBooking = u.bookings && u.bookings.length > 0 ? u.bookings[0] : null;

        const isClean = u.cleanlinessStatus === 'CLEAN';
        const isDirty = u.cleanlinessStatus === 'DIRTY';
        const isOutOfOrder = u.cleanlinessStatus === 'OUT_OF_ORDER';

        return (
          <div
            key={u.id}
            onClick={() => onCardClick?.(u)}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-4 flex flex-col justify-between space-y-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    {u.unitNumber}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      Room {u.unitNumber}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">{u.floor || 'Ground Floor'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {isManagerOrOwner && (
                    <>
                      <button
                        onClick={() => onEditRoom(u)}
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title="Edit Room Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteRoom(u)}
                        className="p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Room"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {u.roomType?.name || 'Standard'}
                  </span>
                  <span className="font-semibold text-[11px] text-emerald-800 dark:text-emerald-400">
                    ₹{Number(u.roomType?.basePrice || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Status Row */}
              <div className="mt-2.5 flex items-center justify-between gap-1.5 flex-wrap">
                {isClean && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span>Clean</span>
                  </span>
                )}
                {isDirty && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>Needs Clean</span>
                  </span>
                )}
                {isOutOfOrder && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>Out of Order</span>
                  </span>
                )}

                {isOccupied ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    <span>{activeBooking?.guest?.fullName || 'Occupied'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    <span>Vacant</span>
                  </span>
                )}
              </div>
            </div>

            <div
              className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {(isDirty || isOutOfOrder) && (
                <button
                  onClick={() => onMarkClean(u.id)}
                  className="flex-1 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 hover:text-white text-emerald-800 dark:text-emerald-300 font-bold text-[11px] rounded-lg text-center transition-all cursor-pointer border border-emerald-200 dark:border-emerald-800"
                >
                  Mark Clean
                </button>
              )}
              {isClean && (
                <button
                  onClick={() => onMarkDirty(u.id)}
                  className="flex-1 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 hover:text-amber-800 text-slate-600 dark:text-slate-300 font-bold text-[11px] rounded-lg text-center transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  Mark Dirty
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
