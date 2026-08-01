'use client';

import React from 'react';
import { DoorClosed, CheckCircle2, AlertTriangle, Wrench, UserCheck, Edit3, Trash2 } from 'lucide-react';
import { RoomUnit } from '@/features/housekeeping/services/housekeeping.service';

interface RoomsTableViewProps {
  units: RoomUnit[];
  isManagerOrOwner: boolean;
  onMarkClean: (unitId: string) => void;
  onMarkDirty: (unitId: string) => void;
  onEditRoom: (unit: RoomUnit) => void;
  onReportIssue: (unit: RoomUnit) => void;
  onDeleteRoom: (unit: RoomUnit) => void;
}

export const RoomsTableView: React.FC<RoomsTableViewProps> = ({
  units,
  isManagerOrOwner,
  onMarkClean,
  onMarkDirty,
  onEditRoom,
  onReportIssue,
  onDeleteRoom,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-5">Room Name / Door</th>
              <th className="py-3.5 px-5">Category & Rate</th>
              <th className="py-3.5 px-5">Location / Floor</th>
              <th className="py-3.5 px-5">Cleanliness Status</th>
              <th className="py-3.5 px-5">Occupancy & Guest</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {units.map((u) => {
              const isOccupied = u.bookings && u.bookings.length > 0 && u.bookings[0].status === 'CHECKED_IN';
              const activeBooking = u.bookings && u.bookings.length > 0 ? u.bookings[0] : null;

              return (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                  {/* Room Name */}
                  <td className="py-3.5 px-5 font-black text-slate-900 text-sm whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <DoorClosed className="w-4 h-4" />
                      </span>
                      <span>{u.unitNumber}</span>
                    </div>
                  </td>

                  {/* Category & Rate */}
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-800 truncate">{u.roomType?.name || 'Room'}</p>
                      {u.roomType?.basePrice && (
                        <p className="text-[11px] font-semibold text-emerald-700">
                          ₹{Number(u.roomType.basePrice).toLocaleString('en-IN')} / night
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Location / Floor */}
                  <td className="py-3.5 px-5 whitespace-nowrap font-medium text-slate-600">
                    {u.floor || <span className="text-slate-400 italic">Unassigned</span>}
                  </td>

                  {/* Cleanliness Status */}
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${
                        u.cleanlinessStatus === 'CLEAN'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : u.cleanlinessStatus === 'DIRTY'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : u.cleanlinessStatus === 'INSPECTED'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {u.cleanlinessStatus === 'CLEAN' && <CheckCircle2 className="w-3 h-3" />}
                      {u.cleanlinessStatus === 'DIRTY' && <AlertTriangle className="w-3 h-3" />}
                      {u.cleanlinessStatus === 'OUT_OF_ORDER' && <Wrench className="w-3 h-3" />}
                      {u.cleanlinessStatus.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Occupancy & Guest */}
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    {isOccupied ? (
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-full bg-indigo-100 text-indigo-700">
                          <UserCheck className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <p className="font-extrabold text-indigo-900 text-xs">
                            {activeBooking?.guest?.fullName || 'Occupied'}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                            {activeBooking?.status.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
                        Vacant
                      </span>
                    )}
                  </td>

                  {/* Quick Actions */}
                  <td className="py-3.5 px-5 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {u.cleanlinessStatus !== 'CLEAN' && (
                        <button
                          onClick={() => onMarkClean(u.id)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                        >
                          Mark Clean
                        </button>
                      )}
                      {u.cleanlinessStatus !== 'DIRTY' && (
                        <button
                          onClick={() => onMarkDirty(u.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                        >
                          Mark Dirty
                        </button>
                      )}

                      {/* Edit, Maintenance, and Delete options for Owners, Managers & Staff */}
                      {isManagerOrOwner && (
                        <>
                          <button
                            onClick={() => onEditRoom(u)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Edit Room Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onReportIssue(u)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-700 transition-colors cursor-pointer"
                            title="Report Out of Order"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteRoom(u)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Room"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
