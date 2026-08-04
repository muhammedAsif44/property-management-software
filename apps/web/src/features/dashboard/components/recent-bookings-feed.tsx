import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/lib/i18n';
import { Calendar, Phone } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { RecentBookingItem } from '../types/dashboard.types';

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
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-divider shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const getStatusDot = (status: RecentBookingItem['status']) => {
    switch (status) {
      case 'CHECKED_IN':
      case 'CONFIRMED':
        return 'bg-emerald-500';
      case 'CHECKED_OUT':
        return 'bg-slate-400';
      case 'CANCELLED':
        return 'bg-rose-500';
      default:
        return 'bg-amber-500';
    }
  };

  return (
    <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-divider shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{t('recentBookingsFeed')}</h3>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            {t('recentBookingsSubtitle')}
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={t('noRecentBookings')}
          description={t('newBookingsAppearHere')}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-divider text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="pb-3 px-2">Guest</th>
                <th className="pb-3 px-2">Room Category</th>
                <th className="pb-3 px-2">Channel</th>
                <th className="pb-3 px-2">Dates</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2 text-right">Total / Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider font-medium">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-divider flex items-center justify-center font-bold text-[11px]">
                        {booking.guest.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{booking.guest.fullName}</div>
                        {booking.guest.phone && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-slate-400" /> {booking.guest.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-slate-700 dark:text-slate-300 font-medium">{booking.roomType.name}</td>
                  <td className="py-3 px-2 text-slate-500 font-semibold uppercase text-[10px]">{booking.channel}</td>
                  <td className="py-3 px-2 text-slate-600 dark:text-slate-400 text-[11px] tabular-data">
                    {new Date(booking.checkInDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} -{' '}
                    {new Date(booking.checkOutDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-3 px-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 capitalize">
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(booking.status)} shrink-0`} />
                      {booking.status.replace('_', ' ').toLowerCase()}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="font-semibold text-slate-900 dark:text-white tabular-data">
                      {currency}
                      {booking.totalAmount.toLocaleString('en-IN')}
                    </div>
                    {booking.balanceDue > 0 ? (
                      <div className="text-[10px] font-semibold text-amber-600 mt-0.5 tabular-data">
                        Due: {currency}
                        {booking.balanceDue.toLocaleString('en-IN')}
                      </div>
                    ) : (
                      <div className="text-[10px] font-semibold text-emerald-600 mt-0.5">Paid Full</div>
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
