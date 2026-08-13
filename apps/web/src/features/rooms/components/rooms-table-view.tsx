'use client';

import React, { useState, useEffect } from 'react';
import {
  DoorClosed,
  Edit3,
  Trash2,
  Eye,
  MoreHorizontal,
  Wrench,
  User,
  Building2,
  Calendar,
} from 'lucide-react';
import { RoomUnit } from '@/features/housekeeping/services/housekeeping.service';

interface RoomsTableViewProps {
  units: RoomUnit[];
  isManagerOrOwner: boolean;
  selectedIds?: string[];
  onSelectAll?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectOne?: (unitId: string, e: React.MouseEvent) => void;
  onRowClick?: (unit: RoomUnit) => void;
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
  onEditRoom,
  onReportIssue,
  onDeleteRoom,
}) => {
  const allSelected = units.length > 0 && selectedIds.length === units.length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
      <table className="w-full text-left border-collapse table-fixed">
        <thead>
          <tr className="bg-slate-50/90 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {onSelectAll && (
              <th className="py-3 px-3.5 pl-4 w-[4%] text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  title="Select all rooms"
                />
              </th>
            )}
            <th className="py-3 px-3.5 w-[20%]">ROOM UNIT</th>
            <th className="py-3 px-3.5 w-[22%]">CATEGORY & RATE</th>
            <th className="py-3 px-3.5 w-[14%]">FLOOR / LOCATION</th>
            <th className="py-3 px-3.5 w-[16%]">OCCUPANCY</th>
            <th className="py-3 px-3.5 w-[14%]">CONDITION</th>
            <th className="py-3 px-3.5 pr-4 text-right w-[10%]">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {units.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-16 text-center text-slate-400">
                <DoorClosed className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-xs text-slate-700 dark:text-slate-300">No Room Units Found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your filters or adding a new room</p>
              </td>
            </tr>
          ) : (
            units.map((u) => {
              const isOccupied = Boolean(u.bookings && u.bookings.length > 0 && u.bookings[0].status === 'CHECKED_IN');
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
                  onEditRoom={onEditRoom}
                  onReportIssue={onReportIssue}
                  onDeleteRoom={onDeleteRoom}
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

const RoomsTableRow = React.memo(
  ({
    u,
    isSelected,
    isOccupied,
    activeBooking,
    isManagerOrOwner,
    onSelectOne,
    onRowClick,
    onEditRoom,
    onReportIssue,
    onDeleteRoom,
  }: {
    u: RoomUnit;
    isSelected: boolean;
    isOccupied: boolean;
    activeBooking: any;
    isManagerOrOwner: boolean;
    onSelectOne?: (unitId: string, e: React.MouseEvent) => void;
    onRowClick?: (unit: RoomUnit) => void;
    onEditRoom: (unit: RoomUnit) => void;
    onReportIssue: (unit: RoomUnit) => void;
    onDeleteRoom: (unit: RoomUnit) => void;
  }) => {
    const [openMenu, setOpenMenu] = useState(false);

    useEffect(() => {
      if (!openMenu) return;
      const handleClickOutside = () => setOpenMenu(false);
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }, [openMenu]);

    const isClean = u.cleanlinessStatus === 'CLEAN';
    const isDirty = u.cleanlinessStatus === 'DIRTY';
    const isOutOfOrder = u.cleanlinessStatus === 'OUT_OF_ORDER';

    const guestName = activeBooking?.guest?.fullName || activeBooking?.guestName;

    return (
      <tr
        onClick={() => onRowClick?.(u)}
        className={`hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors cursor-pointer group ${
          isSelected ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
        }`}
      >
        {/* 1. Checkbox */}
        {onSelectOne && (
          <td
            className="py-3 px-3.5 pl-4 text-center align-middle"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelectOne(u.id, e as any)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </td>
        )}

        {/* 2. Room Unit & Door Number */}
        <td className="py-3 px-3.5 align-middle">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200/90 dark:border-emerald-800">
              {u.unitNumber}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-slate-900 dark:text-white truncate block">
                Room {u.unitNumber}
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate block">
                Physical Inventory
              </span>
            </div>
          </div>
        </td>

        {/* 3. Category & Rate */}
        <td className="py-3 px-3.5 align-middle">
          <div className="min-w-0">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate block">
              {u.roomType?.name || 'Standard Category'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              ₹{Number(u.roomType?.basePrice || 0).toLocaleString('en-IN')} / night
            </span>
          </div>
        </td>

        {/* 4. Floor / Location */}
        <td className="py-3 px-3.5 align-middle font-medium text-xs text-slate-700 dark:text-slate-300">
          {u.floor ? `${u.floor}` : 'Ground Floor'}
        </td>

        {/* 5. Occupancy Status & Guest Info */}
        <td className="py-3 px-3.5 align-middle">
          {isOccupied ? (
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span>Occupied</span>
              </span>
              {guestName && (
                <p className="text-[10px] text-slate-700 dark:text-slate-300 font-bold truncate mt-0.5">
                  {guestName}
                </p>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
              <span>Vacant / Ready</span>
            </span>
          )}
        </td>

        {/* 6. Physical Condition */}
        <td className="py-3 px-3.5 align-middle">
          {isClean && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
              <span>Ready</span>
            </span>
          )}
          {isDirty && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>Needs Cleaning</span>
            </span>
          )}
          {isOutOfOrder && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>Maintenance</span>
            </span>
          )}
        </td>

        {/* 7. Inventory & Asset Management Actions */}
        <td
          className="py-3 px-3.5 pr-4 align-middle text-right"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-end gap-1.5">
            {isManagerOrOwner && (
              <button
                onClick={() => onEditRoom(u)}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                title="Edit Room Configuration"
              >
                <Edit3 className="w-3 h-3 text-slate-400" />
                <span>Edit</span>
              </button>
            )}

            {/* More Options Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenu(!openMenu);
                }}
                className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {openMenu && (
                <div className="absolute right-0 top-8 z-50 w-44 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl py-1 text-xs text-left animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      onRowClick?.(u);
                      setOpenMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-semibold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>View Room Details</span>
                  </button>

                  <button
                    onClick={() => {
                      onReportIssue(u);
                      setOpenMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 font-semibold cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5 text-amber-500" />
                    <span>Log Maintenance</span>
                  </button>

                  {isManagerOrOwner && (
                    <button
                      onClick={() => {
                        onDeleteRoom(u);
                        setOpenMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-bold cursor-pointer border-t border-slate-100 dark:border-slate-800 mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Delete Room Unit</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  }
);

RoomsTableRow.displayName = 'RoomsTableRow';
