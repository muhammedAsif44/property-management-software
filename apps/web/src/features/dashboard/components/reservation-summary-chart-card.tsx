import React, { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';

interface ReservationSummaryMetrics {
  newReservations: number;
  confirmed: number;
  checkedIn: number;
  checkedOut: number;
  cancelled: number;
}

interface ReservationSummaryChartCardProps {
  metrics?: ReservationSummaryMetrics;
  loading?: boolean;
}

export function ReservationSummaryChartCard({
  metrics,
  loading = false,
}: ReservationSummaryChartCardProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  const summary = metrics || {
    newReservations: 24,
    confirmed: 18,
    checkedIn: 32,
    checkedOut: 16,
    cancelled: 6,
  };

  // 7-day trend coordinates for SVG spline
  const points = [
    { day: '8 May', val: 22 },
    { day: '9 May', val: 19 },
    { day: '10 May', val: 38 },
    { day: '11 May', val: 32 },
    { day: '12 May', val: 46 },
    { day: '13 May', val: 52 },
    { day: '14 May', val: 48 },
  ];

  // SVG dimensions
  const width = 600;
  const height = 140;
  const paddingX = 25;
  const paddingY = 20;

  const minVal = 0;
  const maxVal = 60;

  // Convert points to SVG coordinates
  const coords = points.map((p, idx) => {
    const x = paddingX + (idx / (points.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((p.val - minVal) / (maxVal - minVal)) * (height - 2 * paddingY);
    return { x, y, day: p.day, val: p.val };
  });

  // Generate smooth cubic bezier SVG path
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const linePath = createSmoothPath(coords);
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col justify-between h-full">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Reservation Summary
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Booking pace & turnover performance
          </p>
        </div>

        {/* Range Selector */}
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Top 5 Metrics Row */}
      <div className="p-4 pb-0 grid grid-cols-5 gap-2 border-b border-slate-100/60 dark:border-slate-800/60">
        {/* 1. New Reservations */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
            New Bookings
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {summary.newReservations}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              ↑ 8%
            </span>
          </div>
        </div>

        {/* 2. Confirmed */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
            Confirmed
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {summary.confirmed}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              ↑ 12%
            </span>
          </div>
        </div>

        {/* 3. Checked In */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
            Checked In
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {summary.checkedIn}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              ↑ 5%
            </span>
          </div>
        </div>

        {/* 4. Checked Out */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
            Checked Out
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {summary.checkedOut}
            </span>
            <span className="text-[10px] font-bold text-rose-500 flex items-center">
              ↓ 4%
            </span>
          </div>
        </div>

        {/* 5. Cancelled */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
            Cancelled
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {summary.cancelled}
            </span>
            <span className="text-[10px] font-bold text-rose-500 flex items-center">
              ↓ 2%
            </span>
          </div>
        </div>
      </div>

      {/* SVG Trend Area Chart */}
      <div className="p-4 pt-2 flex-1 flex flex-col justify-end">
        {loading ? (
          <Skeleton className="h-32 w-full rounded-lg" />
        ) : (
          <div className="w-full relative">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-28 overflow-visible"
            >
              <defs>
                <linearGradient id="emeraldAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B6E4F" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0B6E4F" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={width - paddingX}
                y2={paddingY}
                stroke="currentColor"
                strokeDasharray="4 4"
                className="text-slate-100 dark:text-slate-800"
              />
              <line
                x1={paddingX}
                y1={(height - paddingY) / 2}
                x2={width - paddingX}
                y2={(height - paddingY) / 2}
                stroke="currentColor"
                strokeDasharray="4 4"
                className="text-slate-100 dark:text-slate-800"
              />
              <line
                x1={paddingX}
                y1={height - paddingY}
                x2={width - paddingX}
                y2={height - paddingY}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-700"
              />

              {/* Area fill */}
              <path d={areaPath} fill="url(#emeraldAreaGradient)" />

              {/* Spline line */}
              <path
                d={linePath}
                fill="none"
                stroke="#0B6E4F"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data points */}
              {coords.map((c, i) => (
                <circle
                  key={i}
                  cx={c.x}
                  cy={c.y}
                  r="3.5"
                  className="fill-white dark:fill-slate-900 stroke-[#0B6E4F] stroke-[2]"
                />
              ))}
            </svg>

            {/* X-Axis Labels */}
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mt-1 px-1">
              {points.map((p, idx) => (
                <span key={idx}>{p.day}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
