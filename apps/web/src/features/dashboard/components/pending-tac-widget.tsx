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
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  const totalPendingTac = agencies.reduce((acc, a) => acc + a.pendingTac, 0);

  return (
    <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8.5 h-8.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Agency TAC Settlements</h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Unpaid travel agency commissions requiring settlement.
            </p>
          </div>
        </div>
      </div>

      {totalPendingTac > 0 && (
        <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>Total Pending TAC:</span>
          </div>
          <span className="tabular-data font-extrabold text-sm">{currency}{totalPendingTac.toLocaleString('en-IN')}</span>
        </div>
      )}

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
              className="p-3.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                  {agency.name}
                  {agency.contactPerson && (
                    <span className="text-[11px] font-semibold text-slate-400">({agency.contactPerson})</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Paid: <span className="tabular-data font-semibold">{currency}{agency.tacPaid.toLocaleString('en-IN')}</span> / Total: <span className="tabular-data font-semibold">{currency}{agency.totalTac.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 tabular-data">
                  {currency}{agency.pendingTac.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 justify-end mt-0.5">
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
