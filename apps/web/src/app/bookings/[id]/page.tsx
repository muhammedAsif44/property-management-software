'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { useBookingDetailQuery, useCheckInMutation, useCheckOutMutation } from '@/features/bookings/api/use-bookings';
import { useTranslation } from '@/lib/i18n';
import {
  ArrowLeft,
  Calendar,
  User,
  Phone,
  Mail,
  BedDouble,
  CreditCard,
  Clock,
  CheckCircle2,
  LogIn,
  LogOut,
  XCircle,
  Loader2,
  Globe2,
  UtensilsCrossed,
  IndianRupee,
  CalendarDays,
  Users as UsersIcon,
  Baby,
  Utensils,
  Building2,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  CONFIRMED: { label: 'Confirmed', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  CHECKED_IN: { label: 'Checked In', color: 'text-blue-800', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  CHECKED_OUT: { label: 'Checked Out', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-300', dot: 'bg-slate-400' },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
};

/* ─── Skeleton Detail Page ─── */
function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 skeleton rounded-lg" />
            <div className="h-5 w-36 skeleton rounded" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="space-y-2">
                <div className="h-3 w-16 skeleton rounded" />
                <div className="h-4 w-24 skeleton rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Info Field ─── */
function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{label}</span>
      <p className="font-extrabold text-slate-900 text-xs min-w-0 truncate">{value || '—'}</p>
    </div>
  );
}

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.id as string;
  const { t } = useTranslation();

  const { data: booking, isLoading } = useBookingDetailQuery(bookingId);
  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans antialiased">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-100">
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 skeleton rounded-lg" />
                <div className="space-y-2">
                  <div className="h-4 w-40 skeleton rounded" />
                  <div className="h-3 w-24 skeleton rounded" />
                </div>
              </div>
            </div>
          </div>
          <DetailSkeleton />
        </main>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans antialiased">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center bg-slate-100">
          <div className="text-center space-y-4">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h2 className="text-xl font-bold text-slate-800">{t('bookingNotFound')}</h2>
            <button
              onClick={() => router.push('/bookings')}
              className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors"
            >
              {t('backToBookings')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const formatCurrency = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

  const totalAmount = Number(booking.totalAmount) || 0;
  const advancePaid = Number(booking.advancePaid) || 0;
  const paidPct = totalAmount > 0 ? Math.min(Math.round((advancePaid / totalAmount) * 100), 100) : 0;

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans antialiased">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto bg-slate-100">
        {/* ═══ Header ═══ */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/bookings')}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors cursor-pointer btn-press"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-sm font-black text-slate-900 tracking-tight">{t('bookingDetails')}</h1>
                <p className="text-[11px] font-bold text-slate-500 font-mono">ID: {booking.id.slice(0, 10)}...</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {booking.status === 'CONFIRMED' && (
                <button
                  onClick={() => checkInMutation.mutate(booking.id)}
                  disabled={checkInMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer btn-press shadow-xs"
                >
                  {checkInMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  {t('checkIn')}
                </button>
              )}
              {booking.status === 'CHECKED_IN' && (
                <button
                  onClick={() => checkOutMutation.mutate(booking.id)}
                  disabled={checkOutMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-indigo-700 text-white text-xs font-bold hover:bg-indigo-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer btn-press shadow-xs"
                >
                  {checkOutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  {t('checkOut')}
                </button>
              )}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.bg} ${statusCfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ Content Cards ═══ */}
        <div className="max-w-4xl mx-auto p-6 space-y-5 pb-20">
          {/* Guest Information */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 border-l-4 border-l-emerald-600">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 mb-4 uppercase tracking-wider">
              <User className="w-4 h-4 text-emerald-700" />
              {t('guestInformation')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <InfoField label={t('guestName')} value={booking.guest?.fullName} />
              <InfoField label={t('phoneNumber')} value={booking.guest?.phone} />
              <InfoField label={t('email')} value={booking.guest?.email} />
              <InfoField label={t('totalVisits')} value={
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  {booking.guest?.totalVisits || 1}
                  {(booking.guest?.totalVisits || 1) > 1 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Returning</span>}
                </span>
              } />
            </div>
          </div>

          {/* Stay Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 border-l-4 border-l-blue-600">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 mb-4 uppercase tracking-wider">
              <BedDouble className="w-4 h-4 text-blue-700" />
              {t('stayDetails')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <InfoField label={t('roomType')} value={booking.roomType?.name} />
              <InfoField label={t('channel')} value={booking.channel?.replace('_', ' ')} />
              <InfoField label={t('checkInDate')} value={formatDate(booking.checkInDate)} />
              <InfoField label={t('checkOutDate')} value={formatDate(booking.checkOutDate)} />
              <InfoField label={t('adults')} value={booking.adults} />
              <InfoField label={t('children')} value={booking.children} />
              <InfoField label={t('mealPlan')} value={booking.mealPlan || 'EP'} />
              {booking.agency && <InfoField label={t('agency')} value={booking.agency.name} />}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 border-l-4 border-l-amber-600">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 mb-4 uppercase tracking-wider">
              <CreditCard className="w-4 h-4 text-amber-700" />
              {t('paymentSummary')}
            </h3>
            <div className="space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">{t('baseAmount')}</span>
                <span className="font-bold text-slate-900">{formatCurrency(booking.baseAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">{t('gstAmount')}</span>
                <span className="font-bold text-slate-900">{formatCurrency(booking.gstAmount)}</span>
              </div>

              {booking.bookingFacilities && booking.bookingFacilities.length > 0 && (
                <div>
                  <p className="text-slate-500 font-medium mb-1.5">{t('facilities')}:</p>
                  <div className="flex flex-wrap gap-2 ml-2">
                    {booking.bookingFacilities.map((f: any, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded text-slate-800 font-bold">
                        {f.amenity?.name}
                        <span className="text-emerald-700">{formatCurrency(f.priceAtBooking)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <hr className="border-slate-200 my-1" />

              <div className="flex justify-between items-center text-sm">
                <span className="font-black text-slate-900">{t('totalAmount')}</span>
                <span className="font-black text-emerald-700">{formatCurrency(booking.totalAmount)}</span>
              </div>

              {/* Payment Progress Bar */}
              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-emerald-700">{t('advancePaid')}: {formatCurrency(booking.advancePaid)}</span>
                  <span className="text-slate-400">{paidPct}% paid</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    style={{ width: `${paidPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">{t('balanceDue')}</span>
                  <span className={`font-black ${Number(booking.balanceDue) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(booking.balanceDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 border-l-4 border-l-slate-400">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 mb-4 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-slate-600" />
              {t('auditTrail')}
            </h3>

            <div className="relative pl-5 space-y-3 text-xs">
              <div className="absolute left-1.5 top-1 bottom-1 w-0.5 bg-slate-200" />

              <div className="relative">
                <div className="absolute -left-3.5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">{t('createdBy')}</span>
                  <span className="font-bold text-slate-800">{booking.createdByUser?.email}</span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-3.5 top-1 w-2.5 h-2.5 rounded-full bg-blue-500" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">{t('createdAt')}</span>
                  <span className="font-bold text-slate-800">{formatDate(booking.createdAt)}</span>
                </div>
              </div>

              {booking.cancellationReason && (
                <div className="relative">
                  <div className="absolute -left-3.5 top-1 w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="mt-2 p-3 bg-rose-50 rounded-lg border border-rose-200 space-y-1">
                    <p className="font-black text-rose-700">{t('cancellationReason')}:</p>
                    <p className="text-rose-600 font-medium">{booking.cancellationReason}</p>
                    {booking.refundAmount && (
                      <p className="text-rose-500 font-bold">{t('refundAmount')}: {formatCurrency(booking.refundAmount)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
