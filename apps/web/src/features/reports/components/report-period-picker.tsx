'use client';

import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { Calendar as CalendarIcon } from 'lucide-react';

export type ReportPeriod = 'today' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

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

  /* ── Compute Resolved Date Range Text ────────────────────────────── */
  const resolvedDateRangeLabel = useMemo(() => {
    const now = new Date();

    const formatDateStr = (d: Date) =>
      d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    if (period === 'today') {
      return formatDateStr(now);
    } else if (period === 'weekly') {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return `${formatDateStr(start)} – ${formatDateStr(now)}`;
    } else if (period === 'monthly') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return `${formatDateStr(start)} – ${formatDateStr(end)}`;
    } else if (period === 'quarterly') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), currentQuarter * 3, 1);
      const end = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
      return `${formatDateStr(start)} – ${formatDateStr(end)}`;
    } else if (period === 'yearly') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return `${formatDateStr(start)} – ${formatDateStr(end)}`;
    } else if (period === 'custom') {
      if (from && to) {
        const s = new Date(`${from}T00:00:00`);
        const e = new Date(`${to}T00:00:00`);
        return `${formatDateStr(s)} – ${formatDateStr(e)}`;
      }
      return t('customDateRange') || 'Custom Range';
    }
    return '';
  }, [period, from, to, t]);

  const presets: { id: ReportPeriod; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'weekly', label: 'Week' },
    { id: 'monthly', label: 'Month' },
    { id: 'quarterly', label: 'Quarter' },
    { id: 'yearly', label: 'Year' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
      {/* Quick Preset Chips */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
        {presets.map((preset) => {
          const isActive = period === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => setPeriod(preset.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Resolved Date Range Text Badge */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs shrink-0">
        <CalendarIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>{resolvedDateRangeLabel}</span>
      </div>

      {/* Custom Date Range Pickers (Rendered only when Custom is active) */}
      {period === 'custom' && (
        <div className="flex items-center gap-2 animate-fadeIn">
          <div className="w-[140px]">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              max={to || undefined}
              className="text-xs h-8"
            />
          </div>
          <span className="text-xs text-slate-400 font-bold">–</span>
          <div className="w-[140px]">
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              min={from || undefined}
              className="text-xs h-8"
            />
          </div>
        </div>
      )}
    </div>
  );
}
