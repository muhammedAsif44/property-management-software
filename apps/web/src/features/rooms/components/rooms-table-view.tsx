'use client';

import React from 'react';
import { DoorClosed, CheckCircle2, AlertTriangle, Wrench, UserCheck, Edit3, Trash2 } from 'lucide-react';
import { RoomUnit } from '@/features/housekeeping/services/housekeeping.service';

interface RoomsTableViewProps {
  units: RoomUnit[];
  isManagerOrOwner: boolean;
  selectedIds?: string[];
  onSelectAll?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectOne?: (unitId: string, e: React.MouseEvent) => void;
  onRowClick?: (unit: RoomUnit) => void;
  onMarkClean: (unitId: string) => void;
  onMarkDirty: (unitId: string) => void;
  onEditRoom: (unit: RoomUnit) => void;
  onReportIssue: (unit: RoomUnit) => void;
  onDeleteRoom: (unit: RoomUnit) => void;
}

export const RoomsTableView: React.FC<RoomsTableViewProps> = ({
  units,
  isManagerOrOwner,
  selectedIds = [],
  onSelectAll,
  onSelectOne,
  onRowClick,
  onMarkClean,
  onMarkDirty,
  onEditRoom,
  onReportIssue,
  onDeleteRoom,
}) => {
  const allSelected = units.length > 0 && selectedIds.length === units.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
              {onSelectAll && (
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="w-4 h-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                    title="Select all rooms"
                  />
                </th>
              )}
              <th className="py-3.5 px-5">Room Name / Door</th>
              <th className="py-3.5 px-5">Category & Rate</th>
              <th className="py-3.5 px-5">Location / Floor</th>
              <th className="py-3.5 px-5">Cleanliness Status</th>
              <th className="py-3.5 px-5">Occupancy & Guest</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold">
            {units.map((u) => {
              const isOccupied = u.bookings && u.bookings.length > 0 && u.bookings[0].status === 'CHECKED_IN';
              const activeBooking = u.bookings && u.bookings.length > 0 ? u.bookings[0] : null;
              const isSelected = selectedIds.includes(u.id);

              return (
                <RoomsTableRow
                  key={u.id}
                  u={u}
                  isSelected={isSelected}
                  isOccupied={isOccupied}
                  activeBooking={activeBooking}
                  isManagerOrOwner={isManagerOrOwner}
                  onSelectOne={onSelectOne}
                  onRowClick={onRowClick}
                  onMarkClean={onMarkClean}
                  onMarkDirty={onMarkDirty}
                  onEditRoom={onEditRoom}
                  onReportIssue={onReportIssue}
                  onDeleteRoom={onDeleteRoom}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RoomsTableRow = React.memo(({
  u,
  isSelected,
  isOccupied,
  activeBooking,
  isManagerOrOwner,
  onSelectOne,
  onRowClick,
  onMarkClean,
  onMarkDirty,
  onEditRoom,
  onReportIssue,
  onDeleteRoom
}: any) => {
  return (
    <tr
      onClick={() => onRowClick && onRowClick(u)}
      className={`transition-all cursor-pointer ${
        isSelected ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600' : 'hover:bg-slate-50/80'
      }`}
    >
      {/* Checkbox Column */}
      {onSelectOne && (
        <td
          className="py-3.5 px-4 text-center"
          onClick={(e) => onSelectOne(u.id, e)}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className="w-4 h-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
          />
        </td>
      )}

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
            <p className="text-[11px] font-medium tabular-data text-slate-500">
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
        <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              u.cleanlinessStatus === 'CLEAN'
                ? 'bg-emerald-500'
                : u.cleanlinessStatus === 'DIRTY'
                ? 'bg-amber-500'
                : u.cleanlinessStatus === 'OUT_OF_ORDER' || u.cleanlinessStatus === 'MAINTENANCE'
                ? 'bg-rose-500'
                : 'bg-slate-400'
            }`}
          />
          <span className="capitalize">{u.cleanlinessStatus.replace('_', ' ').toLowerCase()}</span>
        </span>
      </td>

      {/* Occupancy & Guest */}
      <td className="py-3.5 px-5 whitespace-nowrap">
        {isOccupied ? (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
            <div>
              <p className="font-semibold text-slate-900 text-xs">
                {activeBooking?.guest?.fullName || 'Occupied'}
              </p>
              <p className="text-[10px] font-medium text-slate-500 capitalize">
                {activeBooking?.status.replace('_', ' ').toLowerCase()}
              </p>
            </div>
          </div>
        ) : (
          <span className="flex items-center gap-2 text-slate-500 font-medium text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
            Vacant
          </span>
        )}
      </td>

      {/* Quick Actions */}
      <td className="py-3.5 px-5 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1">
          {u.cleanlinessStatus !== 'CLEAN' && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkClean(u.id); }}
              className="interactive px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs rounded-md shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              Mark Clean
            </button>
          )}
          {u.cleanlinessStatus !== 'DIRTY' && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkDirty(u.id); }}
              className="interactive px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold text-xs rounded-md shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              Mark Dirty
            </button>
          )}

          {/* Edit, Maintenance, and Delete options for Owners, Managers & Staff */}
          {isManagerOrOwner && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onEditRoom(u); }}
                className="interactive p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-900 cursor-pointer ml-1"
                title="Edit Room Details"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReportIssue(u); }}
                className="interactive p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-900 cursor-pointer"
                title="Report Out of Order"
              >
                <Wrench className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteRoom(u); }}
                className="interactive p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
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
}, (prevProps, nextProps) => {
  return prevProps.u.id === nextProps.u.id &&
         prevProps.u.cleanlinessStatus === nextProps.u.cleanlinessStatus &&
         prevProps.isSelected === nextProps.isSelected &&
         prevProps.isOccupied === nextProps.isOccupied &&
         prevProps.activeBooking?.id === nextProps.activeBooking?.id &&
         prevProps.isManagerOrOwner === nextProps.isManagerOrOwner;
});
RoomsTableRow.displayName = 'RoomsTableRow';
