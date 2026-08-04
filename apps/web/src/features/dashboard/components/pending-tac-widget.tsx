import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Briefcase, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { PendingTacAgency } from '../types/dashboard.types';

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
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-divider shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const totalPendingTac = agencies.reduce((acc, a) => acc + a.pendingTac, 0);

  return (
    <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-divider shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-divider flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Travel Agency TAC Settlements</h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Unpaid travel agency commissions requiring settlement.
            </p>
          </div>
        </div>

        {totalPendingTac > 0 && (
          <div className="px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-divider text-[11px] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            Total Pending: <span className="tabular-data">{currency}{totalPendingTac.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      {agencies.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All Commissions Settled"
          description="No pending TAC balance payments outstanding."
        />
      ) : (
        <div className="space-y-2">
          {agencies.map((agency) => (
            <div
              key={agency.id}
              className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-divider flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="space-y-1">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                  {agency.name}
                  {agency.contactPerson && (
                    <span className="text-[11px] font-medium text-slate-500">({agency.contactPerson})</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Paid: <span className="tabular-data">{currency}{agency.tacPaid.toLocaleString('en-IN')}</span> / Total: <span className="tabular-data">{currency}{agency.totalTac.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-data">
                  {currency}{agency.pendingTac.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5 justify-end mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /> Pending
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
