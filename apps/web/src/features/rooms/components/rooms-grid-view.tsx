'use client';

import React from 'react';
import { DoorClosed, Edit3, Trash2 } from 'lucide-react';
import { RoomUnit } from '@/features/housekeeping/services/housekeeping.service';

interface RoomsGridViewProps {
  units: RoomUnit[];
  isManagerOrOwner: boolean;
  onMarkClean: (unitId: string) => void;
  onMarkDirty: (unitId: string) => void;
  onEditRoom: (unit: RoomUnit) => void;
  onDeleteRoom: (unit: RoomUnit) => void;
}

export const RoomsGridView: React.FC<RoomsGridViewProps> = ({
  units,
  isManagerOrOwner,
  onMarkClean,
  onMarkDirty,
  onEditRoom,
  onDeleteRoom,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {units.map((u) => {
        const isOccupied = u.bookings && u.bookings.length > 0 && u.bookings[0].status === 'CHECKED_IN';
        const activeBooking = u.bookings && u.bookings.length > 0 ? u.bookings[0] : null;

        return (
          <div
            key={u.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <DoorClosed className="w-4 h-4 text-emerald-600" />
                  {u.unitNumber}
                </span>
                <div className="flex items-center gap-1.5">
                  {isManagerOrOwner && (
                    <>
                      <button
                        onClick={() => onEditRoom(u)}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title="Edit Room Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteRoom(u)}
                        className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Room"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      u.cleanlinessStatus === 'CLEAN'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : u.cleanlinessStatus === 'DIRTY'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {u.cleanlinessStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <p className="text-xs font-bold text-slate-500 mt-1 truncate">
                {u.roomType?.name || 'Room'} {u.floor ? `• ${u.floor}` : ''}
              </p>

              <div
                className={`mt-3 p-3 rounded-xl border text-xs space-y-1 ${
                  isOccupied
                    ? 'bg-indigo-50/70 border-indigo-200/70 text-indigo-900'
                    : 'bg-slate-50 border-slate-200/60 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between font-extrabold text-[11px]">
                  <span>{isOccupied ? 'Occupied' : 'Vacant / Ready'}</span>
                  {activeBooking && (
                    <span className="text-[10px] text-slate-400 uppercase">{activeBooking.status}</span>
                  )}
                </div>
                {activeBooking?.guest && (
                  <p className="text-xs font-bold text-slate-800 truncate">
                    Guest: {activeBooking.guest.fullName}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
              {u.cleanlinessStatus !== 'CLEAN' && (
                <button
                  onClick={() => onMarkClean(u.id)}
                  className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-lg text-center cursor-pointer"
                >
                  Mark Clean
                </button>
              )}
              {u.cleanlinessStatus !== 'DIRTY' && (
                <button
                  onClick={() => onMarkDirty(u.id)}
                  className="flex-1 py-1.5 bg-rose-50 text-rose-700 font-bold text-[11px] rounded-lg text-center cursor-pointer"
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
