import React from 'react';
import { GuestDetails } from '../api/use-guests';
import { format } from 'date-fns';
import { MapPin, Mail, Phone, Calendar, IndianRupee } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface GuestProfileCardProps {
  guest: GuestDetails;
}

export function GuestProfileCard({ guest }: GuestProfileCardProps) {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="flex flex-row items-center gap-4 border-b border-slate-100 dark:border-slate-800 p-6">
        <div className="relative flex h-16 w-16 shrink-0 overflow-hidden rounded-full">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white">
            {guest.fullName.substring(0, 2).toUpperCase()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-xl tracking-tight truncate">{guest.fullName}</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {guest.totalVisits > 1 ? (
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:focus:ring-slate-300 border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                {t('returningGuest') || 'Returning Guest'}
              </div>
            ) : (
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:focus:ring-slate-300 border-slate-200 dark:border-slate-800">
                {t('newGuest') || 'New Guest'}
              </div>
            )}
            {guest.nationality && (
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:focus:ring-slate-300 border-slate-200 dark:border-slate-800 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {guest.nationality}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-500 mb-3">{t('contactInfo') || 'Contact Information'}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{guest.phone || t('notProvided') || 'Not Provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="truncate">{guest.email || t('notProvided') || 'Not Provided'}</span>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-medium text-slate-500 mb-3">{t('lifetimeStatistics') || 'Lifetime Statistics'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">{t('totalVisits') || 'Total Visits'}</div>
                <div className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {guest.totalVisits}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">{t('totalSpend') || 'Total Spend'}</div>
                <div className="text-lg font-semibold flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-green-500" />
                  {Number(guest.totalSpend).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
          
          {(guest.firstStayAt || guest.lastStayAt) && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex justify-between">
              {guest.firstStayAt && (
                <span>{t('firstStay') || 'First stay'}: {format(new Date(guest.firstStayAt), 'PP')}</span>
              )}
              {guest.lastStayAt && (
                <span>{t('lastStay') || 'Last stay'}: {format(new Date(guest.lastStayAt), 'PP')}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
