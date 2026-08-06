'use client';

import React, { useState } from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { AppHeader } from '@/components/app-header';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { useGuestsQuery } from '@/features/guests/api/use-guests';
import { useTranslation } from '@/lib/i18n';
import { Users, Search, Eye, User, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { formatDisplayName } from '@/lib/utils';

export default function GuestsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  useActivePropertyQuery();
  const activeProperty = usePropertyStore((s) => s.activeProperty);
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useGuestsQuery(activeProperty?.id || null, { search, page, limit: 15 });

  const guestsList: any[] = React.useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray((data as any)?.data?.data)) return (data as any).data.data;
    if (Array.isArray((data as any)?.data)) return (data as any).data;
    if (Array.isArray((data as any)?.items)) return (data as any).items;
    if (Array.isArray((data as any)?.guests)) return (data as any).guests;
    if (Array.isArray((data as any)?.data?.items)) return (data as any).data.items;
    if (Array.isArray((data as any)?.data?.guests)) return (data as any).data.guests;
    return [];
  }, [data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const formatCurrency = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative bg-slate-50/50 dark:bg-slate-950">
      <DashboardSidebar />
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <AppHeader>
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {t('guestCrm') || 'Guest CRM'}
              </h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {activeProperty?.name || t('activeManagementHub')}
              </p>
            </div>
          </div>
        </AppHeader>

        <main className="p-4 sm:p-6 space-y-6 w-full flex-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {t('guestDirectory') || 'Guest Directory'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {t('returningGuest') || 'Guest profiles, stay timeline & lifetime stay history'}
                  </p>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2 max-w-sm w-full">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="search"
                      placeholder={t('searchGuests') || 'Search guests...'}
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </form>
              </div>
            </div>

            <div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500">
                      <th className="p-3.5 pl-4">{t('guestName') || 'Guest Name'}</th>
                      <th className="p-3.5">{t('contact') || 'Contact'}</th>
                      <th className="p-3.5">{t('totalVisits') || 'Visits'}</th>
                      <th className="p-3.5">{t('totalSpend') || 'Total Spend'}</th>
                      <th className="p-3.5">{t('lastStay') || 'Last Stay'}</th>
                      <th className="p-3.5 pr-4 text-right">{t('actions') || 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">{t('loading') || 'Loading guests...'}</td>
                      </tr>
                    ) : guestsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">
                          {t('noGuestsFound') || 'No guests found.'}
                        </td>
                      </tr>
                    ) : (
                      guestsList.map((guest: any) => (
                        <tr key={guest.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 pl-4 font-semibold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <div>{formatDisplayName(guest.fullName)}</div>
                                {guest.nationality && (
                                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-normal">
                                    <MapPin className="h-3 w-3" /> {guest.nationality}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="text-slate-900 dark:text-slate-200">{guest.phone || '-'}</div>
                            <div className="text-[11px] text-slate-500">{guest.email || '-'}</div>
                          </td>
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                            {guest.totalVisits}
                          </td>
                          <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(Number(guest.totalSpend))}
                          </td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-300">
                            {guest.lastStayAt ? format(new Date(guest.lastStayAt), 'MMM d, yyyy') : '-'}
                          </td>
                          <td className="p-3.5 pr-4 text-right">
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/guests/${guest.id}`)}>
                              <Eye className="h-4 w-4 text-slate-500" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {data?.meta && data.meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-xs">
                  <div className="text-slate-500">
                    {t('showing') || 'Showing'} {((data.meta.page - 1) * data.meta.limit) + 1} {t('to') || 'to'} {Math.min(data.meta.page * data.meta.limit, data.meta.total)} {t('of') || 'of'} {data.meta.total} {t('entries') || 'entries'}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      {t('previous') || 'Previous'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))}
                      disabled={page === data.meta.totalPages}
                    >
                      {t('next') || 'Next'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
