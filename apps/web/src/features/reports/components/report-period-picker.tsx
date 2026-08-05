import React from 'react';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

export type ReportPeriod = 'monthly' | 'yearly' | 'custom';

interface ReportPeriodPickerProps {
  period: ReportPeriod;
  setPeriod: (period: ReportPeriod) => void;
  from: string;
  setFrom: (date: string) => void;
  to: string;
  setTo: (date: string) => void;
}

export function ReportPeriodPicker({ period, setPeriod, from, setFrom, to, setTo }: ReportPeriodPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row items-end gap-4">
      <div className="space-y-1 w-full sm:w-[200px]">
        <label className="text-sm font-medium">{t('reportPeriod') || 'Report Period'}</label>
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300"
        >
          <option value="monthly">{t('monthly') || 'Monthly (Current)'}</option>
          <option value="yearly">{t('yearly') || 'Yearly (Current)'}</option>
          <option value="custom">{t('customDateRange') || 'Custom Date Range'}</option>
        </select>
      </div>

      {period === 'custom' && (
        <>
          <div className="space-y-1 w-full sm:w-[150px]">
            <label className="text-sm font-medium">{t('fromDate') || 'From Date'}</label>
            <Input 
              type="date" 
              value={from} 
              onChange={(e) => setFrom(e.target.value)}
              max={to || undefined}
            />
          </div>
          <div className="space-y-1 w-full sm:w-[150px]">
            <label className="text-sm font-medium">{t('toDate') || 'To Date'}</label>
            <Input 
              type="date" 
              value={to} 
              onChange={(e) => setTo(e.target.value)}
              min={from || undefined}
            />
          </div>
        </>
      )}
    </div>
  );
}
