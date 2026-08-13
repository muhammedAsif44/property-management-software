import React from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, BedDouble } from 'lucide-react';

interface RoomStatusBreakdown {
  totalRooms: number;
  occupied: number;
  available: number;
  outOfOrder: number;
  maintenance: number;
}

interface RoomStatusDonutCardProps {
  status?: RoomStatusBreakdown;
  loading?: boolean;
}

export function RoomStatusDonutCard({
  status,
  loading = false,
}: RoomStatusDonutCardProps) {
  const total = status?.totalRooms || 200;
  const occupied = status?.occupied ?? 136;
  const available = status?.available ?? 48;
  const outOfOrder = status?.outOfOrder ?? 8;
  const maintenance = status?.maintenance ?? 8;

  const occupiedPct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const availablePct = total > 0 ? Math.round((available / total) * 100) : 0;
  const outOfOrderPct = total > 0 ? Math.round((outOfOrder / total) * 100) : 0;
  const maintenancePct = total > 0 ? Math.round((maintenance / total) * 100) : 0;

  // SVG Donut calculation
  const size = 160;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate segment stroke-dasharray and stroke-dashoffset
  const segments = [
    { label: 'Occupied', count: occupied, pct: occupiedPct, color: '#0B6E4F', dotClass: 'bg-[#0B6E4F]' },
    { label: 'Available', count: available, pct: availablePct, color: '#2563EB', dotClass: 'bg-blue-600' },
    { label: 'Out of Order', count: outOfOrder, pct: outOfOrderPct, color: '#F59E0B', dotClass: 'bg-amber-500' },
    { label: 'Maintenance', count: maintenance, pct: maintenancePct, color: '#8B5CF6', dotClass: 'bg-purple-500' },
  ];

  let accumulatedPct = 0;
  const renderedSegments = segments.map((seg) => {
    const strokeDasharray = `${(seg.pct / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPct / 100) * circumference);
    accumulatedPct += seg.pct;
    return { ...seg, strokeDasharray, strokeDashoffset };
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col justify-between h-full">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Room Status
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Physical inventory & cleanliness
          </p>
        </div>
        <Link
          href="/housekeeping"
          className="text-xs font-bold text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 px-2.5 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Donut & Legend Container */}
      <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-6 flex-1">
        {loading ? (
          <div className="flex items-center justify-center w-full py-8">
            <Skeleton className="w-36 h-36 rounded-full" />
          </div>
        ) : (
          <>
            {/* SVG Donut Chart */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg width={size} height={size} className="rotate-[-90deg]">
                {/* Background Ring */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  className="text-slate-100 dark:text-slate-800"
                />
                {/* Colored Segments */}
                {renderedSegments.map((seg, idx) => (
                  <circle
                    key={idx}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                ))}
              </svg>

              {/* Center Total Count */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                  {total}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  Total Rooms
                </span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="flex-1 w-full space-y-2.5">
              {segments.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.dotClass}`} />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.label}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {item.count}{' '}
                    <span className="text-slate-400 font-normal text-[11px]">
                      ({item.pct}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
