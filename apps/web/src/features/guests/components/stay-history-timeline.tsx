import React from 'react';
import { GuestDetails } from '../api/use-guests';
import { format } from 'date-fns';
import { Calendar, DoorClosed, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils'; // Assumed to exist, otherwise standard currency formatter

interface StayHistoryTimelineProps {
  guest: GuestDetails;
}

export function StayHistoryTimeline({ guest }: StayHistoryTimelineProps) {
  const { t } = useTranslation();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Calendar };
      case 'CHECKED_IN':
        return { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: DoorClosed };
      case 'CHECKED_OUT':
        return { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 };
      case 'CANCELLED':
      case 'NO_SHOW':
        return { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle };
      default:
        return { color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400', icon: Calendar };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm h-full flex flex-col">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-semibold text-lg">{t('stayHistory') || 'Stay History'}</h3>
      </div>
      <div className="p-6 flex-1">
        {guest.bookings && guest.bookings.length > 0 ? (
          <div className="space-y-6">
            {guest.bookings.map((booking, index) => {
              const StatusIcon = getStatusConfig(booking.status).icon;
              return (
                <div key={booking.id} className="relative flex gap-4 pb-6 group">
                  {/* Timeline connector */}
                  {index !== guest.bookings.length - 1 && (
                    <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />
                  )}
                  
                  {/* Timeline Icon */}
                  <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white dark:border-slate-950 ${getStatusConfig(booking.status).color}`}>
                    <StatusIcon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">
                        {format(new Date(booking.checkInDate), 'MMM d, yyyy')} - {format(new Date(booking.checkOutDate), 'MMM d, yyyy')}
                      </div>
                      <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:focus:ring-slate-300 border-transparent ${getStatusConfig(booking.status).color}`}>
                        {booking.status.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {booking.roomType?.name || 'Unknown Room Type'}
                      {booking.roomUnit && ` • Room ${booking.roomUnit.unitNumber}`}
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency ? formatCurrency(Number(booking.totalAmount)) : `₹${Number(booking.totalAmount).toLocaleString('en-IN')}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500">
            {t('noBookingHistory') || 'No booking history found for this guest.'}
          </div>
        )}
      </div>
    </div>
  );
}
