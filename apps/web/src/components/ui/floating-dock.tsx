'use client';

import React, { useState } from 'react';
import {
  LogIn,
  LogOut,
  KeyRound,
  Star,
  BedDouble,
  Plus,
  Calendar,
  Sparkles,
} from 'lucide-react';

export interface DockItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  color?: string;
  onClick?: () => void;
}

export interface FloatingDockProps {
  activeId?: string;
  onSelect?: (id: string) => void;
  onNewBooking?: () => void;
  arrivalsCount?: number;
  departuresCount?: number;
  inHouseCount?: number;
  unassignedCount?: number;
  className?: string;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  activeId = 'all',
  onSelect,
  onNewBooking,
  arrivalsCount = 5,
  departuresCount = 3,
  inHouseCount = 18,
  unassignedCount = 2,
  className = '',
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const dockItems: DockItem[] = [
    {
      id: 'arrivals',
      label: "Today's Arrivals",
      icon: LogIn,
      count: arrivalsCount,
      color: 'emerald',
    },
    {
      id: 'departures',
      label: "Today's Departures",
      icon: LogOut,
      count: departuresCount,
      color: 'amber',
    },
    {
      id: 'in_house',
      label: 'In-House Guests',
      icon: KeyRound,
      count: inHouseCount,
      color: 'blue',
    },
    {
      id: 'vip',
      label: 'VIP Reservations',
      icon: Star,
      color: 'purple',
    },
    {
      id: 'unassigned',
      label: 'Unassigned Rooms',
      icon: BedDouble,
      count: unassignedCount,
      color: 'rose',
    },
  ];

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-3.5 py-2 rounded-2xl bg-white/90 dark:bg-[#111c17]/95 backdrop-blur-xl border border-slate-200/90 dark:border-[#1d3329] shadow-xl shadow-slate-900/10 dark:shadow-emerald-950/40 flex items-center gap-1.5 transition-all duration-300 ${className}`}
    >
      {/* Label Indicator Header */}
      <div className="hidden md:flex items-center gap-1.5 pr-2.5 mr-1 border-r border-slate-200 dark:border-[#1d3329] text-[11px] font-bold text-slate-500 dark:text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse shrink-0" />
        <span className="whitespace-nowrap">Reception Dock</span>
      </div>

      {/* Dock Action Buttons */}
      <div className="flex items-center gap-1.5">
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          const isHovered = hoveredId === item.id;

          return (
            <div key={item.id} className="relative group">
              {/* Tooltip Label */}
              <div
                className={`absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-emerald-950 text-white dark:text-emerald-200 text-[11px] font-bold whitespace-nowrap shadow-md pointer-events-none transition-all duration-200 ${
                  isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                }`}
              >
                {item.label}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-emerald-950" />
              </div>

              <button
                type="button"
                onClick={() => onSelect?.(item.id)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/30 scale-105'
                    : 'bg-slate-100 dark:bg-[#16241e] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1d3329] hover:scale-110'
                }`}
              >
                <Icon className="w-4 h-4" />

                {/* Badge Count */}
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-black border-2 border-white dark:border-[#111c17] shadow-xs">
                    {item.count}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="w-px h-6 bg-slate-200 dark:bg-[#1d3329] mx-1" />

      {/* Primary Action Button: New Booking */}
      <button
        type="button"
        onClick={onNewBooking}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-md shadow-emerald-800/20 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">New Booking</span>
      </button>
    </div>
  );
};
