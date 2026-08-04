import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/lib/i18n';
import {
  ArrowUpRight,
  BedDouble,
  Calendar,
  Clock,
  DollarSign,
  UserCheck
} from 'lucide-react';
import { DashboardMetrics } from '../types/dashboard.types';

interface RevenueSummaryCardsProps {
  metrics?: DashboardMetrics;
  currency?: string;
  loading?: boolean;
  userRole?: string;
}

export function RevenueSummaryCards({
  metrics,
  currency = '₹',
  loading = false,
  userRole = 'OWNER',
}: RevenueSummaryCardsProps) {
  const { t } = useTranslation();
  const isReception = userRole === 'RECEPTION_STAFF';

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  const formattedTodayRev = isReception
    ? '••••••'
    : metrics
    ? `${currency}${metrics.todayRevenue.toLocaleString('en-IN')}`
    : `${currency}0`;

  const formattedMonthlyRev = isReception
    ? '••••••'
    : metrics
    ? `${currency}${metrics.monthlyRevenue.toLocaleString('en-IN')}`
    : `${currency}0`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Today's Revenue */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-divider shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {t('todayRevenue')}
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-divider flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold tabular-data text-slate-900 dark:text-white">
          {formattedTodayRev}
        </div>
        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live payments collected
        </p>
      </div>

      {/* Card 2: Monthly Revenue */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-divider shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {t('monthlyRevenue')}
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-divider flex items-center justify-center">
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold tabular-data text-slate-900 dark:text-white">
          {formattedMonthlyRev}
        </div>
        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" /> Calendar Month Total
        </p>
      </div>

      {/* Card 3: Check-ins & Check-outs */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-divider shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Today's Movement
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-divider flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-slate-400" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold tabular-data text-slate-900 dark:text-white flex items-baseline gap-2">
          <span>{metrics?.todayCheckIns || 0}</span>
          <span className="text-[11px] font-medium text-slate-400">Ins</span>
          <span className="text-slate-300">/</span>
          <span>{metrics?.todayCheckOuts || 0}</span>
          <span className="text-[11px] font-medium text-slate-400">Outs</span>
        </div>
        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-slate-400" /> Scheduled for today
        </p>
      </div>

      {/* Card 4: Occupancy & Room Status */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-divider shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Booked Rate
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-divider flex items-center justify-center">
            <BedDouble className="w-4 h-4 text-slate-400" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold tabular-data text-slate-900 dark:text-white flex items-baseline gap-2">
          <span>{metrics?.occupancyRate || 0}%</span>
          <span className="text-[11px] font-medium text-slate-400">
            ({metrics?.occupiedRooms || 0}/{metrics?.totalRooms || 0})
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${metrics?.occupancyRate || 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
