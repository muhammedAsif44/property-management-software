'use client';

import React, { useId } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SparklineProps {
  data?: number[];
  changePercentage?: number;
  label?: string;
  width?: number;
  height?: number;
  id?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data = [12, 18, 14, 22, 28, 24, 35, 32, 42],
  changePercentage = 14.2,
  label = 'vs last week',
  width = 90,
  height = 28,
  id,
}) => {
  const reactId = useId();
  const strokeGradientId = id || `sparkline-gradient-${reactId.replace(/:/g, '')}`;
  const isPositive = changePercentage >= 0;

  // Calculate SVG polyline points
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const strokeColor = isPositive ? '#10b981' : '#f43f5e';

  const polygonPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <div className="inline-flex items-center gap-2 bg-slate-50/90 px-2.5 py-1 rounded-xl border border-slate-200/80 shrink-0 min-w-0">
      {/* SVG Micro Trend Line with Shaded Area */}
      <svg width={width} height={height} className="overflow-visible shrink-0">
        <defs>
          <linearGradient id={strokeGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polygon points={polygonPoints} fill={`url(#${strokeGradientId})`} />
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>

      {/* Percentage Trend Badge */}
      <div className="flex items-center gap-1 min-w-0 shrink-0">
        <span
          className={`inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md ${
            isPositive
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-rose-100 text-rose-800 border border-rose-200'
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3 text-emerald-700 shrink-0" />
          ) : (
            <TrendingDown className="w-3 h-3 text-rose-600 shrink-0" />
          )}
          <span>{isPositive ? `+${changePercentage}%` : `${changePercentage}%`}</span>
        </span>
        {label && (
          <span className="text-[10px] font-bold text-slate-400 hidden sm:inline truncate">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};
