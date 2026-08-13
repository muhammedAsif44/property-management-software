'use client';

import React from 'react';
import { DoorClosed, Building2, Users, Wrench, UserCheck } from 'lucide-react';

interface RoomsMetricsBarProps {
  totalUnitsCount: number;
  cleanCount: number;
  dirtyCount: number;
  oooCount: number;
  occupiedCount: number;
  categoriesCount?: number;
  totalCapacity?: number;
}

export const RoomsMetricsBar: React.FC<RoomsMetricsBarProps> = ({
  totalUnitsCount,
  oooCount,
  occupiedCount,
  categoriesCount = 4,
  totalCapacity = 28,
}) => {
  const total = totalUnitsCount || 1;
  const occupancyPct = Math.round((occupiedCount / total) * 100);
  const vacantCount = Math.max(0, totalUnitsCount - occupiedCount - oooCount);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-3.5 flex items-center justify-between gap-2 overflow-x-auto divide-x divide-slate-100 dark:divide-slate-800">
      {/* 1. Total Inventory */}
      <div className="flex items-center gap-3 px-3 min-w-[140px]">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
          <DoorClosed className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Inventory</p>
          <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{totalUnitsCount} Units</span>
          <p className="text-[10px] text-slate-400 font-medium truncate">Physical rooms</p>
        </div>
      </div>

      {/* 2. Occupancy Rate */}
      <div className="flex items-center gap-3 px-3 min-w-[140px]">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
          <UserCheck className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Current Occupancy</p>
          <span className="text-lg font-black text-blue-700 dark:text-blue-400 tabular-nums">
            {occupiedCount} / {totalUnitsCount}
          </span>
          <p className="text-[10px] text-slate-400 font-medium truncate">{occupancyPct}% occupied</p>
        </div>
      </div>

      {/* 3. Available / Vacant */}
      <div className="flex items-center gap-3 px-3 min-w-[140px]">
        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
          <DoorClosed className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Available Rooms</p>
          <span className="text-lg font-black text-teal-800 dark:text-teal-300 tabular-nums">{vacantCount} Vacant</span>
          <p className="text-[10px] text-slate-400 font-medium truncate">Ready for allocation</p>
        </div>
      </div>

      {/* 4. Active Room Categories */}
      <div className="flex items-center gap-3 px-3 min-w-[140px]">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Room Categories</p>
          <span className="text-lg font-black text-indigo-700 dark:text-indigo-400 tabular-nums">
            {categoriesCount} Types
          </span>
          <p className="text-[10px] text-slate-400 font-medium truncate">Configured tiers</p>
        </div>
      </div>

      {/* 5. Out of Order / Maintenance */}
      <div className="flex items-center gap-3 px-3 min-w-[150px]">
        <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
          <Wrench className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Maintenance / OOO</p>
          <span className="text-lg font-black text-rose-700 dark:text-rose-400 tabular-nums">{oooCount} Units</span>
          <p className="text-[10px] text-slate-400 font-medium truncate">
            {oooCount === 0 ? 'All fully operational' : 'Under repair'}
          </p>
        </div>
      </div>
    </div>
  );
};
