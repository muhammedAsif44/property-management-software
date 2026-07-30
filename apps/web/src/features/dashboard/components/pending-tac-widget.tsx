import React from 'react';
import { PendingTacAgency } from '../types/dashboard.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, AlertCircle } from 'lucide-react';

interface PendingTacWidgetProps {
  agencies?: PendingTacAgency[];
  currency?: string;
  loading?: boolean;
}

export function PendingTacWidget({
  agencies = [],
  currency = '₹',
  loading = false,
}: PendingTacWidgetProps) {
  if (loading) {
    return (
      <div className="p-6 bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-xs space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const totalPendingTac = agencies.reduce((acc, a) => acc + a.pendingTac, 0);

  return (
    <div className="p-6 bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
            <Briefcase className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Travel Agency TAC Settlements</h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Unpaid travel agency commissions requiring settlement.
            </p>
          </div>
        </div>

        {totalPendingTac > 0 && (
          <div className="px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-black">
            Total Pending: {currency}{totalPendingTac.toLocaleString('en-IN')}
          </div>
        )}
      </div>

      {agencies.length === 0 ? (
        <div className="p-6 text-center bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-1">
          <p className="text-xs font-bold text-emerald-800">All Travel Agency Commissions Settled 🎉</p>
          <p className="text-[11px] text-emerald-600">No pending TAC balance payments outstanding.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {agencies.map((agency) => (
            <div
              key={agency.id}
              className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/70 flex items-center justify-between hover:bg-amber-50 transition-colors"
            >
              <div className="space-y-0.5">
                <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  {agency.name}
                  {agency.contactPerson && (
                    <span className="text-[11px] font-normal text-slate-500">({agency.contactPerson})</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold">
                  Paid: {currency}{agency.tacPaid.toLocaleString('en-IN')} / Total: {currency}{agency.totalTac.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-black text-amber-900">
                  {currency}{agency.pendingTac.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] font-bold text-amber-700 flex items-center gap-1 justify-end">
                  <AlertCircle className="w-2.5 h-2.5" /> Pending
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
