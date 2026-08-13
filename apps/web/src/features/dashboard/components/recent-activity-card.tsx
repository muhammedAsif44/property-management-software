import React from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowUpRight,
  ShoppingBag,
  LogIn,
  LogOut,
  CreditCard,
  FileText,
  Clock,
} from 'lucide-react';

export interface RecentActivityItem {
  id: string;
  type: 'BOOKING' | 'CHECK_IN' | 'CHECK_OUT' | 'PAYMENT' | 'INVOICE';
  title: string;
  subtitle: string;
  timeAgo: string;
}

interface RecentActivityCardProps {
  activities?: RecentActivityItem[];
  loading?: boolean;
}

export function RecentActivityCard({
  activities,
  loading = false,
}: RecentActivityCardProps) {
  const defaultActivities: RecentActivityItem[] = [
    {
      id: 'act-1',
      type: 'BOOKING',
      title: 'New reservation #BK-000128 for Deluxe Room',
      subtitle: 'Liam Smith',
      timeAgo: '10 min ago',
    },
    {
      id: 'act-2',
      type: 'CHECK_IN',
      title: 'Check-in completed for Executive Suite',
      subtitle: 'Sophia Martinez',
      timeAgo: '25 min ago',
    },
    {
      id: 'act-3',
      type: 'PAYMENT',
      title: 'Payment received $240 from Oliver Brown',
      subtitle: 'Direct Card Settlement',
      timeAgo: '1 hr ago',
    },
    {
      id: 'act-4',
      type: 'CHECK_OUT',
      title: 'Check-out completed for Premium Sea View',
      subtitle: 'Elena Rossi',
      timeAgo: '2 hrs ago',
    },
    {
      id: 'act-5',
      type: 'INVOICE',
      title: 'Invoice #INV-2026-089 issued to Alexander Clark',
      subtitle: '3 Nights Stay Settlement',
      timeAgo: '3 hrs ago',
    },
  ];

  const items = activities && activities.length > 0 ? activities : defaultActivities;

  const getActivityIcon = (type: RecentActivityItem['type']) => {
    switch (type) {
      case 'BOOKING':
        return (
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
        );
      case 'CHECK_IN':
        return (
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60 flex items-center justify-center shrink-0">
            <LogIn className="w-3.5 h-3.5" />
          </div>
        );
      case 'PAYMENT':
        return (
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
        );
      case 'CHECK_OUT':
        return (
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center shrink-0">
            <LogOut className="w-3.5 h-3.5" />
          </div>
        );
      case 'INVOICE':
        return (
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col justify-between h-full">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Recent Activity
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Real-time front desk events stream
          </p>
        </div>
        <Link
          href="/bookings"
          className="text-xs font-bold text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 px-2.5 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Activity List */}
      <div className="p-4 space-y-3.5 flex-1">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ) : (
          items.map((act) => (
            <div
              key={act.id}
              className="flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {getActivityIcon(act.type)}
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate leading-snug">
                    {act.title}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                    {act.subtitle}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 shrink-0 whitespace-nowrap pt-0.5">
                {act.timeAgo}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
