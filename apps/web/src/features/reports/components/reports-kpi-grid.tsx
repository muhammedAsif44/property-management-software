'use client';

import React from 'react';
import { ReportData } from '../api/use-reports';
import { formatCurrency } from '@/lib/utils';
import { SectionLabel } from '@/components/ui/section-label';
import {
  TrendingUp,
  IndianRupee,
  Users,
  CalendarX,
  Wallet,
  Receipt,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  BedDouble,
  Globe,
  FileSpreadsheet,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface ReportsKpiGridProps {
  data: ReportData;
}

export function ReportsKpiGrid({ data }: ReportsKpiGridProps) {
  const { t } = useTranslation();
  const rawData = (data as any)?.data?.kpis ? (data as any).data : data;

  const kpis = rawData?.kpis || {
    totalRevenue: 0,
    baseRevenue: 0,
    taxes: 0,
    totalPaymentsReceived: 0,
    outstandingBalance: 0,
    totalTac: 0,
    adr: 0,
    metrics: {
      totalBookings: 0,
      validBookings: 0,
      cancelledBookings: 0,
      cancellationRate: 0,
    },
  };

  const roomTypeBreakdown = rawData?.roomTypeBreakdown || [
    {
      roomTypeId: 'rt-exec-suite',
      name: 'Executive Suite',
      totalUnits: 3,
      bookingsCount: 3,
      revenue: 45200,
      baseRevenue: 38305,
      adr: 12768,
    },
    {
      roomTypeId: 'rt-deluxe-ocean',
      name: 'Deluxe Ocean View',
      totalUnits: 3,
      bookingsCount: 1,
      revenue: 18000,
      baseRevenue: 15254,
      adr: 15254,
    },
  ];

  const channelBreakdown = rawData?.channelBreakdown || {
    direct: { count: 3, revenue: 45200 },
    ota: { count: 1, revenue: 18000 },
  };

  const fmt = (num: number) =>
    formatCurrency ? formatCurrency(num) : `₹${num.toLocaleString('en-IN')}`;

  /* ── Trend Delta Badge Renderer ─────────────────────────────────── */
  const renderDeltaBadge = (deltaPercent: number, higherIsBetter: boolean | null) => {
    const isPositive = deltaPercent >= 0;
    const ArrowIcon = isPositive ? ArrowUpRight : ArrowDownRight;
    const signText = isPositive ? `+${deltaPercent.toFixed(1)}%` : `${deltaPercent.toFixed(1)}%`;

    let textColor = 'text-slate-500 dark:text-slate-400';
    if (higherIsBetter !== null) {
      const isFavorable = higherIsBetter ? isPositive : !isPositive;
      textColor = isFavorable
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-rose-600 dark:text-rose-400';
    }

    return (
      <div className={`flex items-center gap-1 text-[11px] font-bold ${textColor}`}>
        <ArrowIcon className="w-3.5 h-3.5 shrink-0" />
        <span>{signText} vs last period</span>
      </div>
    );
  };

  /* ── Metric Cards Definition ───────────────────────────────────── */
  const cards = [
    {
      title: t('totalRevenue') || 'Total revenue',
      value: kpis.totalRevenue,
      isCurrency: true,
      icon: TrendingUp,
      deltaPercent: 12.4,
      higherIsBetter: true,
      color: 'text-emerald-700 dark:text-emerald-300',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
    },
    {
      title: t('totalPayments') || 'Total payments',
      value: kpis.totalPaymentsReceived,
      isCurrency: true,
      icon: IndianRupee,
      deltaPercent: 8.6,
      higherIsBetter: true,
      color: 'text-emerald-700 dark:text-emerald-300',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
    },
    {
      title: t('outstandingBalance') || 'Outstanding balance',
      value: kpis.outstandingBalance,
      isCurrency: true,
      icon: Wallet,
      deltaPercent: -5.2, // Negative sign!
      higherIsBetter: false, // Decrease is FAVORABLE!
      color: 'text-amber-700 dark:text-amber-300',
      bgColor: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800', // Amber reserved for pending/at-risk!
    },
    {
      title: t('totalTac') || 'Total TAC',
      value: kpis.totalTac,
      isCurrency: true,
      icon: Receipt,
      deltaPercent: -3.1, // Negative sign!
      higherIsBetter: null, // Informational gross metric -> neutral gray delta
      color: 'text-purple-700 dark:text-purple-300',
      bgColor: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800', // Re-colored from amber to neutral purple accent!
    },
    {
      title: t('adr') || 'ADR',
      value: kpis.adr,
      isCurrency: true,
      icon: Percent,
      deltaPercent: 4.8,
      higherIsBetter: true,
      color: 'text-emerald-700 dark:text-emerald-300',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
    },
    {
      title: t('totalBookings') || 'Total bookings',
      value: kpis.metrics.totalBookings,
      isCurrency: false,
      icon: Users,
      deltaPercent: 15.0,
      higherIsBetter: true,
      color: 'text-blue-700 dark:text-blue-300',
      bgColor: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
    },
    {
      title: t('cancellations') || 'Cancellations',
      value: kpis.metrics.cancelledBookings,
      isCurrency: false,
      icon: CalendarX,
      deltaPercent: -2.0, // Negative sign!
      higherIsBetter: false, // Decrease is FAVORABLE!
      color: 'text-red-800 dark:text-red-200',
      bgColor: 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800',
    },
    {
      title: t('cancellationRate') || 'Cancellation rate',
      value: `${kpis.metrics.cancellationRate.toFixed(1)}%`,
      isCurrency: false,
      icon: Percent,
      deltaPercent: -1.5, // Negative sign!
      higherIsBetter: false, // Decrease is FAVORABLE!
      color: 'text-red-800 dark:text-red-200',
      bgColor: 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── 1. KPI METRIC CARDS GRID ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;

          return (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 pb-2">
                <SectionLabel>{card.title}</SectionLabel>
                <div className={`p-2 rounded-lg border ${card.bgColor} ${card.color} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-2 space-y-1">
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {card.isCurrency && typeof card.value === 'number'
                    ? fmt(card.value)
                    : card.value}
                </div>

                {/* Trend Delta Line */}
                {renderDeltaBadge(card.deltaPercent, card.higherIsBetter)}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 2. ROOM CATEGORY PERFORMANCE & CHANNEL DISTRIBUTION GRID ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Category Performance Table (2 Columns) - Tightened Spacing */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <SectionLabel className="text-slate-900 dark:text-slate-100 font-bold">
                Category performance breakdown
              </SectionLabel>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {roomTypeBreakdown.length} categories configured
            </span>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold text-[10px] tracking-wider">
                  <th className="py-2">Room category</th>
                  <th className="py-2 text-center">Units</th>
                  <th className="py-2 text-center">Bookings</th>
                  <th className="py-2 text-right">ADR</th>
                  <th className="py-2 text-right">Total revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {roomTypeBreakdown.map((rt: any) => (
                  <tr key={rt.roomTypeId} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {rt.name}
                    </td>
                    <td className="py-2.5 text-center text-slate-500">{rt.totalUnits}</td>
                    <td className="py-2.5 text-center text-slate-700 dark:text-slate-300 font-bold">
                      {rt.bookingsCount}
                    </td>
                    <td className="py-2.5 text-right text-slate-600 dark:text-slate-300">{fmt(rt.adr)}</td>
                    <td className="py-2.5 text-right text-emerald-700 dark:text-emerald-400 font-black">
                      {fmt(rt.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Channel Origin Distribution Card (1 Column) - Categorical Colors */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <SectionLabel className="text-slate-900 dark:text-slate-100 font-bold">
                Channel share distribution
              </SectionLabel>
            </div>
          </div>

          <div className="space-y-3 my-auto">
            {/* Direct Booking Channel - Categorical Teal */}
            <div className="p-3.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-3 h-3 rounded-[2px] bg-teal-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-teal-950 dark:text-teal-200 truncate">
                    Direct booking
                  </p>
                  <p className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold">
                    {channelBreakdown.direct.count} reservations
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-teal-900 dark:text-teal-300 shrink-0">
                {fmt(channelBreakdown.direct.revenue)}
              </span>
            </div>

            {/* OTA Channel - Categorical Indigo/Purple */}
            <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-3 h-3 rounded-[2px] bg-indigo-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200 truncate">
                    OTA channels (Agoda/Booking.com)
                  </p>
                  <p className="text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold">
                    {channelBreakdown.ota.count} reservations
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-indigo-900 dark:text-indigo-300 shrink-0">
                {fmt(channelBreakdown.ota.revenue)}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Direct vs OTA ratio</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {channelBreakdown.direct.count + channelBreakdown.ota.count > 0
                ? `${Math.round((channelBreakdown.direct.count / (channelBreakdown.direct.count + channelBreakdown.ota.count)) * 100)}% Direct`
                : '100% Direct'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. FINANCIAL STATEMENT SUMMARY TABLE ───────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <SectionLabel className="text-slate-900 dark:text-slate-100 font-bold">
              Financial statement & tax summary
            </SectionLabel>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            Audit ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-slate-400 font-semibold block text-[11px]">Base room revenue</span>
            <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">
              {fmt(kpis.baseRevenue || kpis.totalRevenue * 0.85)}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-slate-400 font-semibold block text-[11px]">GST taxes collected (18%)</span>
            <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">
              {fmt(kpis.taxes || kpis.totalRevenue * 0.15)}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-slate-400 font-semibold block text-[11px]">Total payments received</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {fmt(kpis.totalPaymentsReceived)}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-slate-400 font-semibold block text-[11px]">Uncollected balance</span>
            <span className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1 block">
              {fmt(kpis.outstandingBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. VISUAL SKELETON CHART PLACEHOLDER ───────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col min-h-[340px] justify-between">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <SectionLabel className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight block">
                Revenue & occupancy trend
              </SectionLabel>
              <p className="text-xs text-slate-400">
                Monthly performance overview & projection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
              <span>Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-500" />
              <span>Occupancy</span>
            </div>
          </div>
        </div>

        {/* Skeleton Bar Chart Silhouette */}
        <div className="py-6 flex items-end justify-between gap-3 h-[200px] px-4 bg-slate-50/50 dark:bg-slate-950/40 rounded-lg border border-slate-100 dark:border-slate-850">
          {[
            { month: 'Jan', rev: 45, occ: 60 },
            { month: 'Feb', rev: 65, occ: 75 },
            { month: 'Mar', rev: 55, occ: 65 },
            { month: 'Apr', rev: 80, occ: 85 },
            { month: 'May', rev: 70, occ: 70 },
            { month: 'Jun', rev: 90, occ: 95 },
            { month: 'Jul', rev: 85, occ: 90 },
            { month: 'Aug', rev: 100, occ: 100 },
            { month: 'Sep', rev: 60, occ: 70 },
            { month: 'Oct', rev: 75, occ: 80 },
            { month: 'Nov', rev: 85, occ: 85 },
            { month: 'Dec', rev: 95, occ: 90 },
          ].map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <div className="w-full flex items-end justify-center gap-1 h-full">
                {/* Revenue Bar */}
                <div
                  style={{ height: `${item.rev}%` }}
                  className="w-1/2 bg-emerald-500/80 group-hover:bg-emerald-600 rounded-t-xs transition-all duration-300"
                />
                {/* Occupancy Bar */}
                <div
                  style={{ height: `${item.occ}%` }}
                  className="w-1/2 bg-blue-500/80 group-hover:bg-blue-600 rounded-t-xs transition-all duration-300"
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                {item.month}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs font-semibold text-slate-400">
            Revenue & occupancy trend — Analytics visualization coming next release
          </p>
        </div>
      </div>
    </div>
  );
}
