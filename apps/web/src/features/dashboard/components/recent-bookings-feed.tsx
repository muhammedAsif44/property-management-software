import React from 'react';
import { RecentBookingItem } from '../types/dashboard.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, User, Phone, ArrowUpRight } from 'lucide-react';

interface RecentBookingsFeedProps {
  bookings?: RecentBookingItem[];
  currency?: string;
  loading?: boolean;
}

export function RecentBookingsFeed({
  bookings = [],
  currency = '₹',
  loading = false,
}: RecentBookingsFeedProps) {
  if (loading) {
    return (
      <div className="p-6 bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-xs space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const getStatusBadge = (status: RecentBookingItem['status']) => {
    switch (status) {
      case 'CHECKED_IN':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CHECKED_OUT':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="p-6 bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Recent Reservations Feed</h3>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Real-time feed of guest check-ins, bookings, and balances.
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-600">No recent reservations recorded yet</p>
          <p className="text-[11px] text-slate-400">New guest bookings will appear here automatically.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="pb-3 px-2">Guest</th>
                <th className="pb-3 px-2">Room Category</th>
                <th className="pb-3 px-2">Channel</th>
                <th className="pb-3 px-2">Dates</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2 text-right">Total / Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100/80 text-emerald-800 flex items-center justify-center font-black text-[11px]">
                        {booking.guest.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{booking.guest.fullName}</div>
                        {booking.guest.phone && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" /> {booking.guest.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-slate-700 font-semibold">{booking.roomType.name}</td>
                  <td className="py-3 px-2 text-slate-500 font-bold uppercase text-[10px]">{booking.channel}</td>
                  <td className="py-3 px-2 text-slate-600 text-[11px]">
                    {new Date(booking.checkInDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} -{' '}
                    {new Date(booking.checkOutDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(
                        booking.status
                      )}`}
                    >
                      {booking.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="font-bold text-slate-900">
                      {currency}
                      {booking.totalAmount.toLocaleString('en-IN')}
                    </div>
                    {booking.balanceDue > 0 ? (
                      <div className="text-[10px] font-extrabold text-rose-600">
                        Due: {currency}
                        {booking.balanceDue.toLocaleString('en-IN')}
                      </div>
                    ) : (
                      <div className="text-[10px] font-extrabold text-emerald-600">Paid Full</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
