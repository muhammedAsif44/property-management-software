'use client';

import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';

export type ReportPeriod = 'today' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

interface ReportPeriodPickerProps {
  period: ReportPeriod;
  setPeriod: (period: ReportPeriod) => void;
  from: string;
  setFrom: (date: string) => void;
  to: string;
  setTo: (date: string) => void;
}

export function ReportPeriodPicker({
  period,
  setPeriod,
  from,
  setFrom,
  to,
  setTo,
}: ReportPeriodPickerProps) {
  const { t } = useTranslation();

  /* ── Compute Resolved Date Range Text ────────────────────────────── */
  const resolvedDateRangeLabel = useMemo(() => {
    const now = new Date();

    const formatDateStr = (d: Date) =>
      d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

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
    <div className="flex flex-wrap items-center justify-between gap-3 w-full">
      {/* Left: Quick Preset Pills & Date Dropdown */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Preset Pills */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-full border border-slate-200/90 dark:border-slate-800 shadow-2xs shrink-0">
          {presets.map((preset) => {
            const isActive = period === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setPeriod(preset.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0B6E4F] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Resolved Date Range Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs shrink-0 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CalendarIcon className="w-3.5 h-3.5 text-[#0B6E4F] dark:text-emerald-400 shrink-0" />
          <span>{resolvedDateRangeLabel}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
        </div>
      </div>

      {/* Custom Date Range Inputs (Only visible when Custom is active) */}
      {period === 'custom' && (
        <div className="flex items-center gap-2 animate-fadeIn shrink-0">
          <div className="w-[140px]">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              max={to || undefined}
              className="text-xs h-8 rounded-lg"
            />
          </div>
          <span className="text-xs text-slate-400 font-bold">–</span>
          <div className="w-[140px]">
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              min={from || undefined}
              className="text-xs h-8 rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
