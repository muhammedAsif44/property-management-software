import React from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/lib/i18n';
import { Calendar, User, Phone, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { formatDisplayName } from '@/lib/utils';

export interface UpcomingArrivalItem {
  id: string;
  guestName: string;
  phone?: string;
  roomType: string;
  unitNumber?: string;
  checkInDate: string;
  checkInTime?: string;
  nights: number;
  channel: string;
  status: string;
}

interface UpcomingArrivalsCardProps {
  arrivals?: UpcomingArrivalItem[];
  loading?: boolean;
}

export function UpcomingArrivalsCard({
  arrivals = [],
  loading = false,
}: UpcomingArrivalsCardProps) {
  const { t } = useTranslation();

  const getInitials = (name: string) => {
    if (!name) return 'G';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getChannelBadge = (channel: string) => {
    const ch = (channel || 'Direct').toUpperCase();
    if (ch.includes('BOOKING')) {
      return (
        <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
          Booking.com
        </span>
      );
    }
    if (ch.includes('AGODA')) {
      return (
        <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400">
          Agoda
        </span>
      );
    }
    if (ch.includes('AIRBNB')) {
      return (
        <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          Airbnb
        </span>
      );
    }
    return (
      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
        Direct
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col justify-between h-full">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Upcoming Arrivals
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Confirmed guest check-ins scheduled
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

      {/* Content */}
      <div className="flex-1 overflow-x-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ) : arrivals.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-bold">No upcoming arrivals for today</p>
            <p className="text-[11px] text-slate-400">New bookings will appear here automatically.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3 pl-4 w-[32%]">Guest Name</th>
                <th className="py-2.5 px-3 w-[24%]">Room</th>
                <th className="py-2.5 px-3 w-[20%]">Check-in</th>
                <th className="py-2.5 px-2 w-[8%] text-center">Nights</th>
                <th className="py-2.5 px-2 w-[16%] text-right pr-4">Channel & Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold">
              {arrivals.slice(0, 5).map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Guest Name & Avatar */}
                  <td className="py-2.5 px-3 pl-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-black text-[10px] flex items-center justify-center shrink-0">
                        {getInitials(item.guestName)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate text-xs">
                          {formatDisplayName(item.guestName)}
                        </div>
                        {item.phone && (
                          <div className="text-[10px] text-slate-400 font-medium truncate">
                            {item.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Room Category & Unit */}
                  <td className="py-2.5 px-3">
                    <div className="text-slate-800 dark:text-slate-200 font-bold truncate text-xs">
                      {item.roomType}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {item.unitNumber ? `Unit ${item.unitNumber}` : 'Unassigned'}
                    </div>
                  </td>

                  {/* Check-in Date & Time */}
                  <td className="py-2.5 px-3">
                    <div className="text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                      {item.checkInDate ? format(new Date(item.checkInDate), 'dd MMM yyyy') : '—'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {item.checkInTime || '02:00 PM'}
                    </div>
                  </td>

                  {/* Nights */}
                  <td className="py-2.5 px-2 text-center text-slate-700 dark:text-slate-300 font-bold text-xs">
                    {item.nights || 1}
                  </td>

                  {/* Channel & Status */}
                  <td className="py-2.5 px-2 text-right pr-4">
                    <div className="flex flex-col items-end gap-0.5">
                      {getChannelBadge(item.channel)}
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                        {item.status || 'Confirmed'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
