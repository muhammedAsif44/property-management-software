import React from 'react';
import { ReportData } from '../api/use-reports';
import { formatCurrency } from '@/lib/utils';
import { IndianRupee, TrendingUp, Users, CalendarX, Wallet, Receipt, Percent } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface ReportsKpiGridProps {
  data: ReportData;
}

export function ReportsKpiGrid({ data }: ReportsKpiGridProps) {
  const { t } = useTranslation();
  const kpis = data.kpis;

  const cards = [
    {
      title: t('totalRevenue') || 'Total Revenue',
      value: kpis.totalRevenue,
      isCurrency: true,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100 dark:bg-emerald-950',
    },
    {
      title: t('totalPayments') || 'Total Payments',
      value: kpis.totalPaymentsReceived,
      isCurrency: true,
      icon: IndianRupee,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-950',
    },
    {
      title: t('outstandingBalance') || 'Outstanding',
      value: kpis.outstandingBalance,
      isCurrency: true,
      icon: Wallet,
      color: 'text-amber-500',
      bgColor: 'bg-amber-100 dark:bg-amber-950',
    },
    {
      title: t('totalTac') || 'Total TAC',
      value: kpis.totalTac,
      isCurrency: true,
      icon: Receipt,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-950',
    },
    {
      title: t('adr') || 'ADR',
      value: kpis.adr,
      isCurrency: true,
      icon: Percent,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-100 dark:bg-indigo-950',
    },
    {
      title: t('totalBookings') || 'Total Bookings',
      value: kpis.metrics.totalBookings,
      isCurrency: false,
      icon: Users,
      color: 'text-sky-500',
      bgColor: 'bg-sky-100 dark:bg-sky-950',
    },
    {
      title: t('cancellations') || 'Cancellations',
      value: kpis.metrics.cancelledBookings,
      isCurrency: false,
      icon: CalendarX,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-950',
    },
    {
      title: t('cancellationRate') || 'Cancellation Rate',
      value: `${kpis.metrics.cancellationRate.toFixed(1)}%`,
      isCurrency: false,
      icon: Percent,
      color: 'text-rose-500',
      bgColor: 'bg-rose-100 dark:bg-rose-950',
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
      {cards.map((card, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 className="text-sm font-medium text-slate-500">
              {card.title}
            </h3>
            <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
              <card.icon className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {card.isCurrency && typeof card.value === 'number' 
                ? (formatCurrency ? formatCurrency(card.value) : `₹${card.value.toLocaleString('en-IN')}`)
                : card.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
