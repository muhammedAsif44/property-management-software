'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { useGuestsQuery } from '@/features/guests/api/use-guests';
import { useTranslation } from '@/lib/i18n';
import {
  Users,
  Search,
  User,
  MapPin,
  Eye,
  TrendingUp,
  UserCheck,
  Building2,
  Mail,
  Phone,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { formatDisplayName } from '@/lib/utils';

export function getAvatarColor(name: string): string {
  if (!name) return 'bg-emerald-700 text-white';
  const colors = [
    'bg-emerald-700 text-white',
    'bg-teal-700 text-white',
    'bg-blue-700 text-white',
    'bg-indigo-700 text-white',
    'bg-violet-700 text-white',
    'bg-amber-700 text-white',
    'bg-rose-700 text-white',
    'bg-cyan-700 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function getInitials(name: string): string {
  if (!name) return 'G';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function GuestsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  useActivePropertyQuery();
  const activeProperty = usePropertyStore((s) => s.activeProperty);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGuestsQuery(activeProperty?.id || null, {
    search,
    page,
    limit: 50,
  });

  const guestsList = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray((data as any).data?.data)) return (data as any).data.data;
    if (Array.isArray((data as any).data?.guests)) return (data as any).data.guests;
    if (Array.isArray((data as any).data)) return (data as any).data;
    if (Array.isArray((data as any).guests)) return (data as any).guests;
    return [];
  }, [data]);

  // CRM Summary KPIs
  const crmSummary = useMemo(() => {
    let totalSpend = 0;
    let repeatGuestsCount = 0;

    guestsList.forEach((g: any) => {
      totalSpend += Number(g.totalSpend || 0);
      if (Number(g.totalVisits || 0) > 1) {
        repeatGuestsCount += 1;
      }
    });

    const totalCount =
      (data as any)?.data?.meta?.total ??
      (data as any)?.meta?.total ??
      guestsList.length;

    return {
      totalGuests: totalCount,
      repeatGuests: repeatGuestsCount,
      totalSpend,
    };
  }, [guestsList, data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const formatCurrency = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <AppShell
      sectionIcon={Users}
      sectionTitle={t('sectionGuestsCrm')}
      sectionDescription={t('sectionGuestsCrmDesc') || 'Guest directory and relationship management'}
      sectionTabs={[
        {
          label: t('tabGuestDirectory') || 'Guest Directory',
          icon: Users,
          count: crmSummary.totalGuests,
          isActive: true,
          href: '/guests',
        },
      ]}
      layout="wide"
    >
      <div className="space-y-4">
        {/* ─── CRM Summary Metric Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* 1. Total Guest Profiles */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" /> Total Profiles
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {crmSummary.totalGuests}
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {crmSummary.totalGuests}
            </p>
            <p className="text-[10px] font-medium text-slate-400">Unique guest records</p>
          </div>

          {/* 2. Returning Guests */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Returning Guests
              </span>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                {crmSummary.repeatGuests}
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {crmSummary.repeatGuests}
            </p>
            <p className="text-[10px] font-medium text-slate-400">Multiple verified stays</p>
          </div>

          {/* 3. Total Lifetime Spend */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Total Guest Spend
              </span>
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-full">
                Revenue
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {formatCurrency(crmSummary.totalSpend)}
            </p>
            <p className="text-[10px] font-medium text-slate-400">Across current guest list</p>
          </div>
        </div>

        {/* ─── Search & Filter Bar ─── */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              placeholder={t('searchGuests') || 'Search guests by name, phone, email...'}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <span className="text-xs font-medium text-slate-400">
            Showing {guestsList.length} profiles
          </span>
        </div>

        {/* ─── Guests Table — Full Width Zero Horizontal Scroll ─── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3.5 pl-4 w-[28%]">{t('guestName') || 'Guest Name'}</th>
                <th className="py-3 px-3.5 w-[24%]">{t('contact') || 'Contact'}</th>
                <th className="py-3 px-3.5 w-[14%]">{t('totalVisits') || 'Total Visits'}</th>
                <th className="py-3 px-3.5 w-[16%]">{t('totalSpend') || 'Total Spend'}</th>
                <th className="py-3 px-3.5 w-[12%]">{t('lastStay') || 'Last Stay'}</th>
                <th className="py-3 px-3.5 pr-4 text-right w-[6%]">{t('actions') || 'View'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-bold">
                    {t('loading') || 'Loading guests...'}
                  </td>
                </tr>
              ) : guestsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-bold">
                    {t('noGuestsFound') || 'No guests found.'}
                  </td>
                </tr>
              ) : (
                guestsList.map((guest: any) => {
                  const gName = formatDisplayName(guest.fullName || 'Guest');
                  const initials = getInitials(gName);
                  const avatarColor = getAvatarColor(gName);

                  return (
                    <tr key={guest.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3.5 pl-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`h-7 w-7 rounded-full ${avatarColor} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate">{gName}</div>
                            {guest.nationality && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium truncate">
                                <MapPin className="h-2.5 w-2.5" /> {guest.nationality}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="text-slate-900 dark:text-slate-200 truncate">{guest.phone || '—'}</div>
                        <div className="text-[11px] text-slate-400 font-medium truncate">{guest.email || '—'}</div>
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {guest.totalVisits || 1} {Number(guest.totalVisits) === 1 ? 'Stay' : 'Stays'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(Number(guest.totalSpend || 0))}
                      </td>
                      <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400 font-medium">
                        {guest.lastStayAt ? format(new Date(guest.lastStayAt), 'dd MMM yyyy') : 'Recent'}
                      </td>
                      <td className="py-3 px-3.5 pr-4 text-right">
                        <button
                          onClick={() => router.push(`/guests/${guest.id}`)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
