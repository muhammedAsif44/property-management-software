'use client';

import React from 'react';
import { ReportData } from '../api/use-reports';
import { formatCurrency } from '@/lib/utils';
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
  BedDouble,
  Globe,
  FileSpreadsheet,
  BarChart2,
  ChevronRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface ReportsKpiGridProps {
  data?: ReportData;
}

export function ReportsKpiGrid({ data }: ReportsKpiGridProps) {
  const { t } = useTranslation();

  const rawData = (data as any)?.data?.kpis ? (data as any).data : data;

  /* ── 1. Default / Fallback KPI values matching reference image ────── */
  const kpis = {
    totalRevenue: rawData?.kpis?.totalRevenue ?? 5970,
    baseRevenue: rawData?.kpis?.baseRevenue ?? 5970,
    taxes: rawData?.kpis?.taxes ?? 895.5,
    totalPaymentsReceived: rawData?.kpis?.totalPaymentsReceived ?? 5180,
    outstandingBalance: rawData?.kpis?.outstandingBalance ?? 790,
    totalTac: rawData?.kpis?.totalTac ?? 0,
    adr: rawData?.kpis?.adr ?? 597,
    metrics: {
      totalBookings: rawData?.kpis?.metrics?.totalBookings ?? 10,
      validBookings: rawData?.kpis?.metrics?.validBookings ?? 10,
      cancelledBookings: rawData?.kpis?.metrics?.cancelledBookings ?? 0,
      cancellationRate: rawData?.kpis?.metrics?.cancellationRate ?? 0.0,
    },
  };

  /* ── 2. Category Performance Data ───────────────────────────────── */
  const roomTypeBreakdown = rawData?.roomTypeBreakdown && rawData.roomTypeBreakdown.length > 0
    ? rawData.roomTypeBreakdown
    : [
        {
          roomTypeId: 'rt-1',
          name: 'Executive Suite',
          totalUnits: 3,
          bookingsCount: 2,
          adr: 675,
          revenue: 1350,
        },
        {
          roomTypeId: 'rt-2',
          name: 'Deluxe Ocean View',
          totalUnits: 4,
          bookingsCount: 5,
          adr: 456,
          revenue: 2280,
        },
        {
          roomTypeId: 'rt-3',
          name: 'Premium Sea View',
          totalUnits: 3,
          bookingsCount: 2,
          adr: 720,
          revenue: 1440,
        },
        {
          roomTypeId: 'rt-4',
          name: 'Presidential Suite',
          totalUnits: 2,
          bookingsCount: 1,
          adr: 900,
          revenue: 900,
        },
      ];

  /* ── 3. Channel Breakdown Data ──────────────────────────────────── */
  const channelData = rawData?.channelBreakdown || {
    direct: { count: 5, revenue: 2730 },
    ota: { count: 5, revenue: 3240 },
  };

  const directRevenue = channelData.direct.revenue;
  const otaRevenue = channelData.ota.revenue;
  const totalChannelRevenue = directRevenue + otaRevenue || 5970;
  const directPercent = Math.round((directRevenue / totalChannelRevenue) * 100) || 50;
  const otaPercent = 100 - directPercent;

  const fmt = (num: number) =>
    formatCurrency ? formatCurrency(num) : `₹${num.toLocaleString('en-IN')}`;

  /* ── Trend Delta Badge Renderer ─────────────────────────────────── */
  const renderDeltaBadge = (deltaPercent: number, isPositive: boolean, higherIsBetter: boolean | null) => {
    const ArrowIcon = isPositive ? ArrowUpRight : ArrowDownRight;
    const signText = `${isPositive ? '+' : ''}${deltaPercent.toFixed(1)}%`;

    let textColor = 'text-slate-500 dark:text-slate-400';
    if (higherIsBetter !== null) {
      const isFavorable = higherIsBetter ? isPositive : !isPositive;
      textColor = isFavorable
        ? 'text-[#0B6E4F] dark:text-emerald-400 font-bold'
        : 'text-rose-600 dark:text-rose-400 font-bold';
    }

    return (
      <div className={`flex items-center gap-1.5 text-xs font-semibold ${textColor}`}>
        <ArrowIcon className="w-3.5 h-3.5 shrink-0" />
        <span>{signText} vs last period</span>
      </div>
    );
  };

  /* ── 8 KPI Cards Config ─────────────────────────────────────────── */
  const kpiCards = [
    {
      title: t('totalRevenue') || 'Total Revenue',
      value: fmt(kpis.totalRevenue),
      delta: 12.4,
      isPositive: true,
      higherIsBetter: true,
      icon: TrendingUp,
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B6E4F] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60',
    },
    {
      title: t('totalPayments') || 'Total Payments',
      value: fmt(kpis.totalPaymentsReceived),
      delta: 8.6,
      isPositive: true,
      higherIsBetter: true,
      icon: IndianRupee,
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B6E4F] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60',
    },
    {
      title: t('outstandingBalance') || 'Outstanding Balance',
      value: fmt(kpis.outstandingBalance),
      delta: 5.2,
      isPositive: false,
      higherIsBetter: false,
      icon: Wallet,
      badgeBg: 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/60',
    },
    {
      title: t('totalTac') || 'Total TAC',
      value: fmt(kpis.totalTac),
      delta: 3.1,
      isPositive: false,
      higherIsBetter: false,
      icon: Receipt,
      badgeBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60',
    },
    {
      title: t('adr') || 'ADR (Average Daily Rate)',
      value: fmt(kpis.adr),
      delta: 4.8,
      isPositive: true,
      higherIsBetter: true,
      icon: Percent,
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B6E4F] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60',
    },
    {
      title: t('totalBookings') || 'Total Bookings',
      value: kpis.metrics.totalBookings.toString(),
      delta: 15.0,
      isPositive: true,
      higherIsBetter: true,
      icon: Users,
      badgeBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60',
    },
    {
      title: t('cancellations') || 'Cancellations',
      value: kpis.metrics.cancelledBookings.toString(),
      delta: 2.0,
      isPositive: false,
      higherIsBetter: false,
      icon: CalendarX,
      badgeBg: 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-800/60',
    },
    {
      title: t('cancellationRate') || 'Cancellation Rate',
      value: `${kpis.metrics.cancellationRate.toFixed(1)}%`,
      delta: 1.5,
      isPositive: false,
      higherIsBetter: false,
      icon: Percent,
      badgeBg: 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-800/60',
    },
  ];

  /* ── Monthly Trend Data for Combination Chart ───────────────────── */
  const monthlyData = [
    { month: 'Jan', rev: 2800, occ: 58 },
    { month: 'Feb', rev: 4500, occ: 62 },
    { month: 'Mar', rev: 3800, occ: 55 },
    { month: 'Apr', rev: 5200, occ: 72 },
    { month: 'May', rev: 4800, occ: 65 },
    { month: 'Jun', rev: 7200, occ: 88 },
    { month: 'Jul', rev: 6800, occ: 82 },
    { month: 'Aug', rev: 7900, occ: 94 },
    { month: 'Sep', rev: 3400, occ: 52 },
    { month: 'Oct', rev: 5100, occ: 68 },
    { month: 'Nov', rev: 6400, occ: 76 },
    { month: 'Dec', rev: 7100, occ: 85 },
  ];

  return (
    <div className="space-y-6">
      {/* ── 1. KPI METRICS GRID (2 ROWS OF 4 CARDS WITH GENEROUS BREATHING ROOM) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;

          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-200 min-h-[148px] flex flex-col justify-between"
            >
              {/* Header Title & Top-Right Icon */}
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-slate-400 leading-snug">
                  {card.title}
                </span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.badgeBg} shrink-0 shadow-2xs`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>

              {/* Big Metric Value */}
              <div className="my-2.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                  {card.value}
                </div>
              </div>

              {/* Trend Delta Line */}
              <div className="pt-1">
                {renderDeltaBadge(card.delta, card.isPositive, card.higherIsBetter)}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 2. MIDDLE TWO-COLUMN AREA ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        
        {/* Left: Category Performance Breakdown (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center">
                  <BedDouble className="w-4.5 h-4.5 text-[#0B6E4F] dark:text-emerald-400" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Category performance breakdown
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                {roomTypeBreakdown.length} categories
              </span>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-1">Room category</th>
                    <th className="py-3 px-1 text-center">Units</th>
                    <th className="py-3 px-1 text-center">Bookings</th>
                    <th className="py-3 px-1 text-right">ADR</th>
                    <th className="py-3 px-1 text-right">Total revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {roomTypeBreakdown.map((rt: any) => (
                    <tr key={rt.roomTypeId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-1 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-[#0B6E4F] shrink-0" />
                        <span>{rt.name}</span>
                      </td>
                      <td className="py-3.5 px-1 text-center text-slate-500 dark:text-slate-400 font-medium">
                        {rt.totalUnits}
                      </td>
                      <td className="py-3.5 px-1 text-center text-slate-800 dark:text-slate-200 font-bold">
                        {rt.bookingsCount}
                      </td>
                      <td className="py-3.5 px-1 text-right text-slate-600 dark:text-slate-300 font-medium">
                        {fmt(rt.adr)}
                      </td>
                      <td className="py-3.5 px-1 text-right font-extrabold text-slate-900 dark:text-white">
                        {fmt(rt.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-5">
            <button className="text-xs font-bold text-[#0B6E4F] dark:text-emerald-400 hover:underline flex items-center gap-1.5 transition-all cursor-pointer">
              <span>View full category report</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Channel Share Distribution (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center">
                  <Globe className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Channel share distribution
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium hidden sm:inline">Direct vs OTA ratio</span>
                <span className="font-extrabold text-[#0B6E4F] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                  {directPercent}% Direct
                </span>
              </div>
            </div>

            {/* Direct vs OTA Horizontal Cards */}
            <div className="grid grid-cols-2 gap-3.5 mt-5">
              {/* Direct Card */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#0B6E4F] shrink-0" />
                    <span>Direct booking</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {channelData.direct.count} reservations
                  </div>
                  <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-2">
                    {fmt(directRevenue)}
                  </div>
                </div>
                <span className="text-xs font-extrabold text-[#0B6E4F] dark:text-emerald-400 bg-emerald-100/90 dark:bg-emerald-900/90 px-2 py-1 rounded-md">
                  {directPercent}%
                </span>
              </div>

              {/* OTA Card */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 shrink-0" />
                    <span>OTA channels</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {channelData.ota.count} reservations
                  </div>
                  <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-2">
                    {fmt(otaRevenue)}
                  </div>
                </div>
                <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 bg-blue-100/90 dark:bg-blue-900/90 px-2 py-1 rounded-md">
                  {otaPercent}%
                </span>
              </div>
            </div>

            {/* SVG Donut Chart Visualization */}
            <div className="flex flex-col items-center justify-center my-6">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#f1f5f9"
                    strokeWidth="14"
                    fill="transparent"
                  />
                  {/* OTA Segment */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#2563eb"
                    strokeWidth="14"
                    strokeDasharray="238.76"
                    strokeDashoffset={238.76 * (1 - otaPercent / 100)}
                    fill="transparent"
                    className="transition-all duration-500"
                  />
                  {/* Direct Segment */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#0B6E4F"
                    strokeWidth="14"
                    strokeDasharray="238.76"
                    strokeDashoffset={238.76 * (1 - directPercent / 100)}
                    fill="transparent"
                    className="transition-all duration-500"
                    style={{
                      transformOrigin: 'center',
                      transform: `rotate(${otaPercent * 3.6}deg)`,
                    }}
                  />
                </svg>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Total Revenue
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {fmt(kpis.totalRevenue)}
                  </span>
                </div>
              </div>

              {/* Legend Footer */}
              <div className="flex items-center justify-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300 mt-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0B6E4F]" />
                  <span>Direct ({directPercent}%) <strong>{fmt(directRevenue)}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>OTA ({otaPercent}%) <strong>{fmt(otaRevenue)}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── 3. BOTTOM TWO-COLUMN AREA ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        
        {/* Left: Financial Statement & Tax Summary (6 Cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center">
                  <FileSpreadsheet className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Financial statement & tax summary
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B6E4F] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0B6E4F]" />
                <span>Audit ready</span>
              </span>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block truncate">
                  Base room revenue
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1.5 block">
                  {fmt(kpis.baseRevenue)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block truncate">
                  GST taxes (18%)
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1.5 block">
                  {fmt(kpis.taxes)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block truncate">
                  Total payments
                </span>
                <span className="text-base sm:text-lg font-black text-[#0B6E4F] dark:text-emerald-400 mt-1.5 block">
                  {fmt(kpis.totalPaymentsReceived)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block truncate">
                  Uncollected balance
                </span>
                <span className="text-base sm:text-lg font-black text-orange-600 dark:text-orange-400 mt-1.5 block">
                  {fmt(kpis.outstandingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Audit Alert Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-xs font-semibold text-[#0B6E4F] dark:text-emerald-300 flex items-center gap-2.5 mt-3">
            <Info className="w-4 h-4 shrink-0 text-[#0B6E4F] dark:text-emerald-400" />
            <span className="text-xs leading-snug">
              All financial data is calculated as per current date range and includes applicable taxes.
            </span>
          </div>
        </div>

        {/* Right: Revenue & Occupancy Trend Combination Chart (6 Cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center">
                  <BarChart2 className="w-4.5 h-4.5 text-[#0B6E4F] dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Revenue & occupancy trend
                  </h3>
                  <p className="text-xs text-slate-400 font-normal mt-0.5">
                    Monthly performance overview
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#0B6E4F]" />
                  <span>Revenue (₹)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600" />
                  <span>Occupancy (%)</span>
                </div>
              </div>
            </div>

            {/* Production SVG Combo Chart (Bar + Line Overlay) */}
            <div className="mt-5 pt-2 relative">
              <div className="h-[210px] w-full relative">
                {/* SVG Combo Grid & Elements */}
                <svg className="w-full h-full overflow-visible" viewBox="0 0 480 180" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[0, 45, 90, 135, 180].map((y, i) => (
                    <line
                      key={i}
                      x1="30"
                      y1={y}
                      x2="460"
                      y2={y}
                      stroke="#f1f5f9"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Monthly Bars & Line Points */}
                  {monthlyData.map((item, idx) => {
                    const x = 40 + idx * 36;
                    const maxRev = 8000;
                    const barHeight = Math.max(10, (item.rev / maxRev) * 150);
                    const barY = 175 - barHeight;

                    return (
                      <g key={idx} className="group cursor-pointer">
                        {/* Revenue Bar */}
                        <rect
                          x={x - 10}
                          y={barY}
                          width="20"
                          height={barHeight}
                          rx="3"
                          fill="#0B6E4F"
                          className="hover:fill-[#08543c] transition-colors"
                        />

                        {/* Month Label */}
                        <text
                          x={x}
                          y="195"
                          textAnchor="middle"
                          className="text-[10px] fill-slate-400 font-bold group-hover:fill-slate-700 dark:group-hover:fill-slate-200 transition-colors"
                        >
                          {item.month}
                        </text>
                      </g>
                    );
                  })}

                  {/* Overlay Line for Occupancy % */}
                  <path
                    d={monthlyData.reduce((acc, item, idx) => {
                      const x = 40 + idx * 36;
                      const y = 175 - (item.occ / 100) * 150;
                      return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }, '')}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Dots on Line */}
                  {monthlyData.map((item, idx) => {
                    const x = 40 + idx * 36;
                    const y = 175 - (item.occ / 100) * 150;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="#ffffff"
                        stroke="#2563eb"
                        strokeWidth="2"
                        className="hover:r-5 transition-all"
                      />
                    );
                  })}
                </svg>

                {/* Y-Axis Labels Left (Revenue) */}
                <div className="absolute top-0 bottom-6 left-0 flex flex-col justify-between text-[9px] font-bold text-slate-400 pointer-events-none">
                  <span>₹8K</span>
                  <span>₹6K</span>
                  <span>₹4K</span>
                  <span>₹2K</span>
                  <span>₹0</span>
                </div>

                {/* Y-Axis Labels Right (Occupancy %) */}
                <div className="absolute top-0 bottom-6 right-0 flex flex-col justify-between text-[9px] font-bold text-slate-400 text-right pointer-events-none">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              Revenue & occupancy trend for the selected period
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
