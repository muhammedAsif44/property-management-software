'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { useOccupancyQuery } from '@/features/bookings/api/use-bookings';
import { useTranslation } from '@/lib/i18n';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Building2,
  Loader2,
} from 'lucide-react';

export default function OccupancyPage() {
  const router = useRouter();
  const { t } = useTranslation();
  useActivePropertyQuery();
  const activeProperty = usePropertyStore((s) => s.activeProperty);

  // Default 14-day view from today
  const today = new Date();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(today);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  const { data, isLoading } = useOccupancyQuery(activeProperty?.id || '', startDate, endDate);

  const shiftDays = (dir: number) => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    s.setDate(s.getDate() + dir * 7);
    e.setDate(e.getDate() + dir * 7);
    setStartDate(s.toISOString().split('T')[0]);
    setEndDate(e.toISOString().split('T')[0]);
  };

  const formatDayHeader = (d: string) => {
    const dt = new Date(d);
    const day = dt.getDate();
    const dayName = dt.toLocaleDateString('en-US', { weekday: 'short' });
    const isToday = d === today.toISOString().split('T')[0];
    return { day, dayName, isToday };
  };

  return (
    <div className="flex h-screen bg-slate-50/90 text-slate-900 font-sans antialiased relative overflow-hidden">
      {/* Ambient Rich Emerald Glow Elements */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      <DashboardSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto relative z-10">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/bookings')} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  {t('occupancyCalendar')}
                </h1>
                <p className="text-sm text-gray-500">{activeProperty?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => shiftDays(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium text-gray-700 px-2">
                {new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} — {new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <button onClick={() => shiftDays(1)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
            </div>
          ) : !data || !data.roomTypes?.length ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">{t('noRoomTypesConfigured')}</h3>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left font-semibold text-gray-600 border-r border-gray-200 min-w-[160px]">
                      {t('roomType')}
                    </th>
                    {(data.dates || []).map((d) => {
                      const { day, dayName, isToday } = formatDayHeader(d);
                      return (
                        <th key={d} className={`px-2 py-2 text-center border-l border-gray-100 min-w-[52px] ${isToday ? 'bg-emerald-50' : ''}`}>
                          <span className="block text-[10px] text-gray-400 uppercase">{dayName}</span>
                          <span className={`block text-sm font-bold ${isToday ? 'text-emerald-700' : 'text-gray-700'}`}>{day}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {data.roomTypes.map((rt) => (
                    <tr key={rt.id} className="border-t border-gray-100 hover:bg-gray-50/30">
                      <td className="sticky left-0 bg-white z-10 px-4 py-3 border-r border-gray-200">
                        <p className="font-semibold text-gray-900">{rt.name}</p>
                        <p className="text-[10px] text-gray-400">{rt.totalUnits} unit(s)</p>
                      </td>
                      {(data.dates || []).map((d) => {
                        const cell = data.occupancy?.[rt.id]?.[d];
                        const booked = cell?.booked || 0;
                        const total = cell?.total || rt.totalUnits;
                        const pct = total > 0 ? (booked / total) * 100 : 0;
                        const isToday = d === today.toISOString().split('T')[0];
                        const isFull = booked >= total;

                        return (
                          <td
                            key={d}
                            className={`px-1 py-2 text-center border-l border-gray-50 ${isToday ? 'bg-emerald-50/30' : ''}`}
                            title={cell?.bookings?.map((b: any) => b.guestName).join(', ') || ''}
                          >
                            <div className={`mx-auto w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                              isFull
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : pct > 50
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : pct > 0
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-gray-50 text-gray-300'
                            }`}>
                              {booked}/{total}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-gray-50 border border-gray-200" />
              {t('available')}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-emerald-50 border border-emerald-200" />
              {t('partiallyBooked')}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-amber-50 border border-amber-200" />
              {t('mostlyBooked')}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
              {t('fullyBooked')}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
