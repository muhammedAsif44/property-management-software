'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { AppHeader } from '@/components/app-header';
import { useBookingDetailQuery, useCheckInMutation, useCheckOutMutation } from '@/features/bookings/api/use-bookings';
import { useTranslation } from '@/lib/i18n';
import { Booking } from '@/features/bookings/types/booking.types';
import {
  ArrowLeft,
  Calendar,
  User,
  BedDouble,
  CreditCard,
  Clock,
  LogIn,
  LogOut,
  Loader2,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  CalendarDays,
  ArrowRight,
  Edit3,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';

const PaymentEntryModal = dynamic(
  () => import('@/features/payments/components/payment-entry-modal').then((m) => m.PaymentEntryModal),
  { ssr: false }
);
const InvoicePreviewModal = dynamic(
  () => import('@/features/invoices/components/invoice-preview-modal').then((m) => m.InvoicePreviewModal),
  { ssr: false }
);
const AssignRoomUnitModal = dynamic(
  () => import('@/features/bookings/components/assign-room-unit-modal').then((m) => m.AssignRoomUnitModal),
  { ssr: false }
);

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  CONFIRMED: { label: 'Confirmed', color: 'text-emerald-800 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  CHECKED_IN: { label: 'Checked In', color: 'text-blue-800 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
  CHECKED_OUT: { label: 'Checked Out', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700', dot: 'bg-slate-400' },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800', dot: 'bg-rose-500' },
};

/* ─── Skeleton Detail Page ─── */
function DetailSkeleton() {
  return (
    <div className="w-full px-6 py-6 max-w-[1400px] space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
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
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
            <div className="w-12 h-12 skeleton rounded-full" />
            <div className="h-4 w-32 skeleton rounded" />
            <div className="h-3 w-24 skeleton rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Info Field with Muted Fallback for Missing Data ─── */
function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  const isEmpty = value === undefined || value === null || value === '' || value === '—';

  return (
    <div>
      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
        {label}
      </span>
      {isEmpty ? (
        <span className="text-slate-400 dark:text-slate-500 italic text-xs font-normal">Not provided</span>
      ) : (
        <p className="font-extrabold text-slate-900 dark:text-white text-xs min-w-0 truncate">
          {value}
        </p>
      )}
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

  const [showPaymentModal, setShowPaymentModal] = useState<Booking | null>(null);
  const [showInvoicePreviewModal, setShowInvoicePreviewModal] = useState<Booking | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative">
        <DashboardSidebar />
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 skeleton rounded-lg" />
              <div className="space-y-2">
                <div className="h-4 w-40 skeleton rounded" />
                <div className="h-3 w-24 skeleton rounded" />
              </div>
            </div>
          </div>
          <DetailSkeleton />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative">
        <DashboardSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('bookingNotFound')}</h2>
            <button
              onClick={() => router.push('/bookings')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {t('backToBookings')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const formatCurrency = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

  const totalAmount = Number(booking.totalAmount) || 0;
  const advancePaid = Number(booking.advancePaid) || 0;
  const balanceDue = Number(booking.balanceDue) || 0;
  const hasUnpaidBalance = balanceDue > 0;
  const paidPct = totalAmount > 0 ? Math.min(Math.round((advancePaid / totalAmount) * 100), 100) : 0;

  const calculateNights = (checkIn: string, checkOut: string) => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    return Math.max(diff, 1);
  };
  const nights = calculateNights(booking.checkInDate, booking.checkOutDate);

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative">
      {/* Left Navigation Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <AppHeader
          actions={
            <div className="flex items-center gap-2">
              {/* Record Payment Action - Rendered ONLY if there is unpaid balance */}
              {hasUnpaidBalance ? (
                <button
                  onClick={() => setShowPaymentModal(booking)}
                  className="px-3.5 py-1.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Fully Paid
                </span>
              )}

              {/* Invoice Preview Action */}
              <button
                onClick={() => setShowInvoicePreviewModal(booking)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span>Invoice</span>
              </button>

              {/* Primary Check-In / Assign Room / Check-Out */}
              {(() => {
                const hasUnit = (booking as any).unitNumber || (booking as any).roomNumber || (booking as any).unitId || (booking as any).roomUnitId || (booking as any).assignedUnit;

                if (booking.status === 'CONFIRMED') {
                  if (!hasUnit) {
                    return (
                      <button
                        onClick={() => setShowAssignModal(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border border-amber-600"
                        title="Assign a Room Unit before Check-In"
                      >
                        <BedDouble className="w-3.5 h-3.5" />
                        <span>Assign Room Unit</span>
                      </button>
                    );
                  }
                  return (
                    <button
                      onClick={() => checkInMutation.mutate(booking.id)}
                      disabled={checkInMutation.isPending}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {checkInMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                      <span>{t('checkIn')}</span>
                    </button>
                  );
                }

                if (booking.status === 'CHECKED_IN') {
                  return (
                    <button
                      onClick={() => checkOutMutation.mutate(booking.id)}
                      disabled={checkOutMutation.isPending}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {checkOutMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                      <span>{t('checkOut')}</span>
                    </button>
                  );
                }

                return null;
              })()}

              {/* Status Badge */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.bg} ${statusCfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            </div>
          }
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/bookings')}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t('bookingDetails')}
              </h1>
              <p className="text-xs font-medium text-neutral-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                ID: {booking.id.slice(0, 10)}...
              </p>
            </div>
          </div>
        </AppHeader>

        {/* ═══ Content Area (Enterprise 2-Column Grid Layout) ═══ */}
        <main className="w-full px-6 py-6 space-y-6 flex-1 max-w-[1400px]">
          {/* Top Unpaid Balance Banner (If Active Attention Required) */}
          {hasUnpaidBalance && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-300">
                    Payment Action Required
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    This booking has an outstanding balance due of <strong className="font-extrabold">{formatCurrency(balanceDue)}</strong>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPaymentModal(booking)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>Record Payment</span>
              </button>
            </div>
          )}

          {/* Enterprise 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ═══ LEFT COLUMN (2/3 width) ═══ */}
            <div className="lg:col-span-2 space-y-6">
              {/* 
                Payment Summary Card:
                NOTE: Left border (border-l-4 border-l-amber-500) and icon color (text-amber-500) are explicitly CONDITIONAL.
                They are applied ONLY when there is an active balance due (balanceDue > 0), representing a real "attention required" state.
                When fully paid (balanceDue <= 0), the card renders with standard neutral border matching other cards.
              */}
              <div className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-xs p-6 ${
                hasUnpaidBalance
                  ? 'border-slate-200 dark:border-slate-800 border-l-4 border-l-amber-500'
                  : 'border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                    <CreditCard className={`w-4 h-4 ${hasUnpaidBalance ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`} />
                    {t('paymentSummary')}
                  </h3>

                  {hasUnpaidBalance ? (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                      Payment Action Needed
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Fully Paid
                    </span>
                  )}
                </div>

                <div className="space-y-3 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">{t('baseAmount')}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(booking.baseAmount)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">{t('gstAmount')}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(booking.gstAmount)}</span>
                  </div>

                  {booking.bookingFacilities && booking.bookingFacilities.length > 0 && (
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium mb-1.5">{t('facilities')}:</p>
                      <div className="flex flex-wrap gap-2 ml-2">
                        {booking.bookingFacilities.map((f: any, i: number) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200 font-bold">
                            {f.amenity?.name}
                            <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(f.priceAtBooking)}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <hr className="border-slate-200 dark:border-slate-800 my-2" />

                  <div className="flex justify-between items-center text-sm">
                    <span className="font-extrabold text-slate-900 dark:text-white">{t('totalAmount')}</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">{formatCurrency(booking.totalAmount)}</span>
                  </div>

                  {/* Payment Progress Bar */}
                  <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-emerald-600 dark:text-emerald-400">{t('advancePaid')}: {formatCurrency(booking.advancePaid)}</span>
                      <span className="text-slate-400 dark:text-slate-500">{paidPct}% paid</span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold pt-1">
                      <span className="text-slate-500 dark:text-slate-400">{t('balanceDue')}</span>
                      <span className={`font-extrabold text-sm ${hasUnpaidBalance ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatCurrency(booking.balanceDue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stay Details Card — Neutral card border & neutral section icon */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
                <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4 uppercase tracking-wider">
                  <BedDouble className="w-4 h-4 text-slate-400 dark:text-slate-500" />
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

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <span>Total Duration: {nights} Night{nights > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Audit Trail Card — Neutral card border & neutral metadata timeline dots */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
                <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4 uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  {t('auditTrail')}
                </h3>

                <div className="relative pl-5 space-y-3 text-xs">
                  <div className="absolute left-1.5 top-1 bottom-1 w-0.5 bg-slate-200 dark:bg-slate-800" />

                  {/* Metadata dot: neutral gray */}
                  <div className="relative">
                    <div className="absolute -left-3.5 top-1 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">{t('createdBy')}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {booking.createdByUser?.email || <span className="text-slate-400 italic font-normal">System</span>}
                      </span>
                    </div>
                  </div>

                  {/* Metadata dot: neutral gray */}
                  <div className="relative">
                    <div className="absolute -left-3.5 top-1 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">{t('createdAt')}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formatDate(booking.createdAt)}</span>
                    </div>
                  </div>

                  {booking.cancellationReason && (
                    <div className="relative">
                      <div className="absolute -left-3.5 top-1 w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <div className="mt-2 p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 space-y-1">
                        <p className="font-extrabold text-rose-700 dark:text-rose-400">{t('cancellationReason')}:</p>
                        <p className="text-rose-600 dark:text-rose-300 font-medium">{booking.cancellationReason}</p>
                        {booking.refundAmount && (
                          <p className="text-rose-500 dark:text-rose-400 font-bold">{t('refundAmount')}: {formatCurrency(booking.refundAmount)}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ RIGHT SIDEBAR (1/3 width) ═══ */}
            <div className="lg:col-span-1 space-y-6">
              {/* Guest Profile Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
                <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4 uppercase tracking-wider">
                  <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  {t('guestInformation')}
                </h3>

                <div className="flex items-center gap-3.5 mb-5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white font-black flex items-center justify-center text-sm shrink-0 uppercase shadow-2xs">
                    {booking.guest?.fullName ? booking.guest.fullName.substring(0, 2) : 'G'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                      {booking.guest?.fullName || <span className="text-slate-400 italic font-normal">Not provided</span>}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                      {booking.guest?.email || booking.guest?.phone || 'Guest Profile'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs font-semibold">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[11px]">Phone</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {booking.guest?.phone || <span className="text-slate-400 italic font-normal">Not provided</span>}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[11px]">Email</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                      {booking.guest?.email || <span className="text-slate-400 italic font-normal">Not provided</span>}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[11px]">Visits</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                      {booking.guest?.totalVisits || 1} Visit{(booking.guest?.totalVisits || 1) > 1 ? 's' : ''}
                      {(booking.guest?.totalVisits || 1) > 1 && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                          Returning
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-3">
                <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Quick Actions
                </h3>

                {booking.status === 'CONFIRMED' && (
                  <button
                    onClick={() => checkInMutation.mutate(booking.id)}
                    disabled={checkInMutation.isPending}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {checkInMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                    <span>{t('checkIn')}</span>
                  </button>
                )}

                {booking.status === 'CHECKED_IN' && (
                  <button
                    onClick={() => checkOutMutation.mutate(booking.id)}
                    disabled={checkOutMutation.isPending}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {checkOutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    <span>{t('checkOut')}</span>
                  </button>
                )}

                {hasUnpaidBalance ? (
                  <button
                    onClick={() => setShowPaymentModal(booking)}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Record Payment</span>
                  </button>
                ) : (
                  <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 font-extrabold text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Fully Paid (₹0 Balance)</span>
                  </div>
                )}

                <button
                  onClick={() => setShowInvoicePreviewModal(booking)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span>View / Print Invoice</span>
                </button>

                {booking.status !== 'CANCELLED' && booking.status !== 'CHECKED_OUT' && (
                  <button
                    onClick={() => router.push(`/bookings/${booking.id}?edit=true`)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-slate-500" />
                    <span>Edit Booking Details</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* ═══ Modals ═══ */}
        {showPaymentModal && (
          <PaymentEntryModal
            bookingId={showPaymentModal.id}
            isOpen={!!showPaymentModal}
            onClose={() => setShowPaymentModal(null)}
          />
        )}

        {showInvoicePreviewModal && (
          <InvoicePreviewModal
            bookingId={showInvoicePreviewModal.id}
            isOpen={!!showInvoicePreviewModal}
            bookingData={showInvoicePreviewModal}
            onClose={() => setShowInvoicePreviewModal(null)}
          />
        )}
      </div>
      {/* Assign Room Unit Modal */}
      <AssignRoomUnitModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        booking={booking}
      />
    </div>
  );
}
