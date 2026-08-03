'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, Wrench, UserCheck } from 'lucide-react';
import { Sparkline } from '@/components/ui/sparkline';

interface RoomsMetricsBarProps {
  totalUnitsCount: number;
  cleanCount: number;
  dirtyCount: number;
  oooCount: number;
  occupiedCount: number;
}

export const RoomsMetricsBar: React.FC<RoomsMetricsBarProps> = ({
  totalUnitsCount,
  cleanCount,
  dirtyCount,
  oooCount,
  occupiedCount,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Rooms</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalUnitsCount}</span>
        </div>
        <Sparkline data={[totalUnitsCount - 2, totalUnitsCount - 1, totalUnitsCount]} changePercentage={+8.5} label="ready" width={70} height={24} />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs border-l-4 border-l-emerald-500">
        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Clean & Ready
        </span>
        <span className="text-2xl font-black text-slate-900 mt-1 block">{cleanCount}</span>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs border-l-4 border-l-rose-500">
        <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Needs Cleaning
        </span>
        <span className="text-2xl font-black text-slate-900 mt-1 block">{dirtyCount}</span>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs border-l-4 border-l-amber-500">
        <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
          <Wrench className="w-3.5 h-3.5 text-amber-600" /> Out of Order
        </span>
        <span className="text-2xl font-black text-slate-900 mt-1 block">{oooCount}</span>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs border-l-4 border-l-indigo-500">
        <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> Guest Occupied
        </span>
        <span className="text-2xl font-black text-slate-900 mt-1 block">{occupiedCount}</span>
      </div>
    </div>
  );
};
