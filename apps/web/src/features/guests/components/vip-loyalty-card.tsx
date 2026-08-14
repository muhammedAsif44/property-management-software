'use client';

import React from 'react';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Star, Award, Crown, Calendar, Phone, Mail, ChevronRight } from 'lucide-react';

export interface VipGuest {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: 'PLATINUM' | 'GOLD' | 'SILVER';
  totalStays: number;
  totalSpent: number;
  lastStayDate: string;
  preferredRoom?: string;
}

export interface VipLoyaltyCardProps {
  guest: VipGuest;
  currency?: string;
  onViewProfile?: (guest: VipGuest) => void;
}

export const VipLoyaltyCard: React.FC<VipLoyaltyCardProps> = ({
  guest,
  currency = '₹',
  onViewProfile,
}) => {
  const getTierBadge = () => {
    if (guest.tier === 'PLATINUM') {
      return {
        label: 'PLATINUM VIP',
        icon: Crown,
        bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
        spotlight: 'rgba(168, 85, 247, 0.16)',
      };
    }
    if (guest.tier === 'GOLD') {
      return {
        label: 'GOLD MEMBER',
        icon: Award,
        bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
        spotlight: 'rgba(245, 158, 11, 0.16)',
      };
    }
    return {
      label: 'SILVER GUEST',
      icon: Star,
      bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      spotlight: 'rgba(16, 185, 129, 0.16)',
    };
  };

  const badge = getTierBadge();
  const TierIcon = badge.icon;

  return (
    <SpotlightCard
      spotlightColor={badge.spotlight}
      className="flex flex-col justify-between border-slate-200/90 dark:border-[#1d3329]"
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
              {guest.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                {guest.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>{guest.email}</span>
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border flex items-center gap-1 shrink-0 ${badge.bg}`}
          >
            <TierIcon className="w-3 h-3" />
            <span>{badge.label}</span>
          </span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 my-3 pt-3 border-t border-slate-100 dark:border-[#1d3329]">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#16241e] border border-slate-100 dark:border-[#1d3329]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Lifetime Revenue
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-white">
              <AnimatedNumber value={guest.totalSpent} currency={currency} />
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#16241e] border border-slate-100 dark:border-[#1d3329]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Stays
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-white">
              <AnimatedNumber value={guest.totalStays} suffix=" Stays" />
            </span>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <button
        type="button"
        onClick={() => onViewProfile?.(guest)}
        className="mt-2 w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-[#16241e] hover:bg-slate-200 dark:hover:bg-[#1d3329] text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <span>View VIP History</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </SpotlightCard>
  );
};
