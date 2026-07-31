'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { useBookingDetailQuery, useCheckInMutation, useCheckOutMutation, useCancelBookingMutation } from '@/features/bookings/api/use-bookings';
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
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CHECKED_IN: 'bg-blue-100 text-blue-800 border-blue-200',
  CHECKED_OUT: 'bg-gray-100 text-gray-600 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

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
      <div className="flex h-screen bg-gray-50">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </main>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex h-screen bg-gray-50">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-700">{t('bookingNotFound')}</h2>
            <button onClick={() => router.push('/bookings')} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm">{t('backToBookings')}</button>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const formatCurrency = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

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
                <h1 className="text-xl font-bold text-gray-900">{t('bookingDetails')}</h1>
                <p className="text-sm text-gray-500">ID: {booking.id.slice(0, 8)}...</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {booking.status === 'CONFIRMED' && (
                <button
                  onClick={() => checkInMutation.mutate(booking.id)}
                  disabled={checkInMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> {t('checkIn')}
                </button>
              )}
              {booking.status === 'CHECKED_IN' && (
                <button
                  onClick={() => checkOutMutation.mutate(booking.id)}
                  disabled={checkOutMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> {t('checkOut')}
                </button>
              )}
              <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${STATUS_COLORS[booking.status] || ''}`}>
                {booking.status}
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Guest Info */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-emerald-600" /> {t('guestInformation')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><span className="text-gray-500">{t('guestName')}</span><p className="font-semibold text-gray-900 min-w-0 truncate">{booking.guest?.fullName}</p></div>
              <div><span className="text-gray-500">{t('phoneNumber')}</span><p className="font-semibold text-gray-900">{booking.guest?.phone || '—'}</p></div>
              <div><span className="text-gray-500">{t('email')}</span><p className="font-semibold text-gray-900 min-w-0 truncate">{booking.guest?.email || '—'}</p></div>
              <div><span className="text-gray-500">{t('totalVisits')}</span><p className="font-semibold text-gray-900">{booking.guest?.totalVisits || 1}</p></div>
            </div>
          </div>

          {/* Stay Details */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <BedDouble className="w-5 h-5 text-emerald-600" /> {t('stayDetails')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><span className="text-gray-500">{t('roomType')}</span><p className="font-semibold text-gray-900">{booking.roomType?.name}</p></div>
              <div><span className="text-gray-500">{t('channel')}</span><p className="font-semibold text-gray-900">{booking.channel}</p></div>
              <div><span className="text-gray-500">{t('checkInDate')}</span><p className="font-semibold text-gray-900">{formatDate(booking.checkInDate)}</p></div>
              <div><span className="text-gray-500">{t('checkOutDate')}</span><p className="font-semibold text-gray-900">{formatDate(booking.checkOutDate)}</p></div>
              <div><span className="text-gray-500">{t('adults')}</span><p className="font-semibold text-gray-900">{booking.adults}</p></div>
              <div><span className="text-gray-500">{t('children')}</span><p className="font-semibold text-gray-900">{booking.children}</p></div>
              <div><span className="text-gray-500">{t('mealPlan')}</span><p className="font-semibold text-gray-900">{booking.mealPlan || 'None'}</p></div>
              {booking.agency && <div><span className="text-gray-500">{t('agency')}</span><p className="font-semibold text-gray-900">{booking.agency.name}</p></div>}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-emerald-600" /> {t('paymentSummary')}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{t('baseAmount')}</span><span className="font-semibold">{formatCurrency(booking.baseAmount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('gstAmount')}</span><span className="font-semibold">{formatCurrency(booking.gstAmount)}</span></div>
              {booking.bookingFacilities && booking.bookingFacilities.length > 0 && (
                <div>
                  <p className="text-gray-500 mb-1">{t('facilities')}:</p>
                  {booking.bookingFacilities.map((f, i) => (
                    <div key={i} className="flex justify-between ml-4"><span className="text-gray-600">{f.amenity?.name}</span><span>{formatCurrency(f.priceAtBooking)}</span></div>
                  ))}
                </div>
              )}
              <hr className="border-gray-200" />
              <div className="flex justify-between text-base"><span className="font-bold text-gray-800">{t('totalAmount')}</span><span className="font-bold text-emerald-700">{formatCurrency(booking.totalAmount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('advancePaid')}</span><span className="font-semibold text-emerald-600">{formatCurrency(booking.advancePaid)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('balanceDue')}</span><span className="font-bold text-red-600">{formatCurrency(booking.balanceDue)}</span></div>
              {booking.tacStatus && (
                <div className="flex justify-between"><span className="text-gray-500">TAC Status</span><span className={`font-semibold ${booking.tacStatus === 'PENDING' ? 'text-amber-600' : 'text-emerald-600'}`}>{booking.tacStatus}</span></div>
              )}
            </div>
          </div>

          {/* Audit */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-emerald-600" /> {t('auditTrail')}
            </h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">{t('createdBy')}</span><span className="font-medium text-gray-700">{booking.createdByUser?.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('createdAt')}</span><span className="font-medium text-gray-700">{formatDate(booking.createdAt)}</span></div>
              {booking.cancellationReason && (
                <div className="mt-2 p-3 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-xs font-semibold text-red-700">{t('cancellationReason')}:</p>
                  <p className="text-sm text-red-600">{booking.cancellationReason}</p>
                  {booking.refundAmount && <p className="text-xs text-red-500 mt-1">{t('refundAmount')}: {formatCurrency(booking.refundAmount)}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
