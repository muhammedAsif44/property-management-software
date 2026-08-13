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
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  const getStatusDot = (status: RecentBookingItem['status']) => {
    switch (status) {
      case 'CHECKED_IN':
      case 'CONFIRMED':
        return 'bg-[#0B6E4F]';
      case 'CHECKED_OUT':
        return 'bg-slate-400';
      case 'CANCELLED':
        return 'bg-rose-500';
      default:
        return 'bg-amber-500';
    }
  };

  return (
    <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">{t('recentBookingsFeed')}</h3>
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
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="pb-3 px-2">Guest</th>
                <th className="pb-3 px-2">Room Category</th>
                <th className="pb-3 px-2">Channel</th>
                <th className="pb-3 px-2">Dates</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2 text-right">Total / Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-semibold">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7.5 h-7.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center font-bold text-xs">
                        {booking.guest.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{booking.guest.fullName}</div>
                        {booking.guest.phone && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-slate-400" /> {booking.guest.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-slate-700 dark:text-slate-300 font-bold">{booking.roomType.name}</td>
                  <td className="py-3 px-2 text-slate-500 font-bold uppercase text-[10px]">{booking.channel}</td>
                  <td className="py-3 px-2 text-slate-600 dark:text-slate-400 text-[11px] tabular-data font-semibold">
                    {new Date(booking.checkInDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} -{' '}
                    {new Date(booking.checkOutDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-3 px-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 capitalize">
                      <span className={`w-2 h-2 rounded-full ${getStatusDot(booking.status)} shrink-0`} />
                      {booking.status.replace('_', ' ').toLowerCase()}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="font-extrabold text-slate-900 dark:text-white tabular-data text-xs">
                      {currency}
                      {booking.totalAmount.toLocaleString('en-IN')}
                    </div>
                    {booking.balanceDue > 0 ? (
                      <div className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 tabular-data">
                        Due: {currency}
                        {booking.balanceDue.toLocaleString('en-IN')}
                      </div>
                    ) : (
                      <div className="text-[10px] font-extrabold text-[#0B6E4F] dark:text-emerald-400 mt-0.5">Paid Full</div>
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
