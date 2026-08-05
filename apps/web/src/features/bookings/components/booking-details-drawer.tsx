'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import {
  useBookingDetailQuery,
  useCheckInMutation,
  useCheckOutMutation,
} from '../api/use-bookings';
import { calculateTac } from '@/lib/utils/financial-math';
import {
  X,
  User,
  Phone,
  Mail,
  Globe,
  Calendar,
  BedDouble,
  CreditCard,
  CheckCircle2,
  LogOut,
  Receipt,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Tag,
  Clock,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AssignRoomUnitModal } from './assign-room-unit-modal';

interface BookingDetailsDrawerProps {
  bookingId: string | null;
  onClose: () => void;
}

const STATUS_BADGE: Record<string, { label: string; bg: string; dot: string; text: string }> = {
  CONFIRMED: { label: 'Booked', bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800', text: 'text-rose-800 dark:text-rose-300', dot: 'bg-rose-600' },
  CHECKED_IN: { label: 'Checked In', bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800', text: 'text-rose-800 dark:text-rose-300', dot: 'bg-rose-600' },
  CHECKED_OUT: { label: 'Checked Out', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-500' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400' },
  NO_SHOW: { label: 'No Show', bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
};

export function BookingDetailsDrawer({ bookingId, onClose }: BookingDetailsDrawerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: booking, isLoading, isError } = useBookingDetailQuery(bookingId || '');
  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!mounted || !bookingId) return null;

  const formatDate = (d: string) => {
    if (!d) return '—';
    const dateStr = d.includes('T') ? d : `${d}T00:00:00`;
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 1;
    const sStr = checkIn.includes('T') ? checkIn : `${checkIn}T00:00:00`;
    const eStr = checkOut.includes('T') ? checkOut : `${checkOut}T00:00:00`;
    const start = new Date(sStr).getTime();
    const end = new Date(eStr).getTime();
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const badge = STATUS_BADGE[booking?.status || ''] || STATUS_BADGE.CONFIRMED;
  const nights = booking ? calculateNights(booking.checkInDate, booking.checkOutDate) : 1;

  const content = (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-Over Drawer Container */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 animate-in slide-in-from-right duration-250 overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-50/90 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between min-w-0">
          <div className="min-w-0 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
              <BedDouble className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                {t('bookingDetailsDrawerTitle')}
              </h3>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                ID: {bookingId.slice(0, 8)}...
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          ) : isError || !booking ? (
            <div className="text-center py-12 text-slate-500">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
              <p className="text-xs font-bold">{t('bookingNotFound')}</p>
            </div>
          ) : (
            <>
              {/* Status Header Badge Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${badge.bg} ${badge.text}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                    {badge.label}
                  </span>

                  {(booking?.balanceDue || 0) <= 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      PAID IN FULL
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      <CreditCard className="w-3 h-3 text-amber-600" />
                      DUE: ₹{Number(booking?.balanceDue || 0).toLocaleString('en-IN')}
                    </span>
                  )}

                  {((booking as any)?.invoiceIssued || (booking as any)?.isInvoiceIssued) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                      <Receipt className="w-3 h-3 text-blue-600" />
                      INVOICE ISSUED
                    </span>
                  )}
                </div>
              </div>

              {/* Guest Profile Card */}
              <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t('guestProfile')}
                  </h4>
                  {booking.guest?.totalVisits > 0 && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {booking.guest.totalVisits} {t('totalVisits')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {booking.guest?.fullName ? booking.guest.fullName.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {booking.guest?.fullName || booking.guestId}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                      {booking.guest?.phone || 'No phone recorded'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {booking.guest?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{booking.guest.email}</span>
                    </div>
                  )}
                  {booking.guest?.nationality && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{booking.guest.nationality}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stay Timeline & Room Information */}
              <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  {t('stayTimeline')}
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-750">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">{t('checkIn')}</span>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 block mt-0.5">
                      {formatDate(booking.checkInDate)}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-750">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">{t('checkOut')}</span>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 block mt-0.5">
                      {formatDate(booking.checkOutDate)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 font-semibold text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{booking.roomType?.name || t('roomType')}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px]">
                    {nights} {t('nightsCount')}
                  </span>
                </div>

                {booking.channel && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{t('channelOrigin')}: <strong className="text-slate-800 dark:text-slate-200">{booking.channel}</strong></span>
                  </div>
                )}
              </div>

              {/* Financial Ledger Summary */}
              <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  {t('financialLedger')}
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium">
                    <span>{t('totalAmount')}</span>
                    <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                      ₹{booking.totalAmount?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium">
                    <span>{t('advancePaid')}</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      ₹{booking.advancePaid?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-900 dark:text-slate-100 font-black border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span>{t('balanceDue')}</span>
                    <span className={`text-sm ${booking.balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                      ₹{booking.balanceDue?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>

                  {/* TAC Commission Information */}
                  {(booking.channel === 'AGENCY' || booking.agency) && (() => {
                    const rate = Number(booking.tacRateAtBooking || booking.agency?.defaultTacRate || 10);
                    const gross = Number(booking.totalAmount || 0);
                    const { tacAmount, propertyAmount } = calculateTac(gross, rate);

                    return (
                      <div className="p-3 bg-blue-50/90 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-1.5 text-xs mt-3">
                        <div className="flex justify-between font-extrabold text-blue-900 dark:text-blue-300">
                          <span>Booking Source</span>
                          <span className="font-black">Travel Agency (TAC)</span>
                        </div>
                        {booking.agency && (
                          <div className="flex justify-between font-medium text-blue-800 dark:text-blue-400">
                            <span>Travel Agency Partner</span>
                            <span className="font-bold">{booking.agency.name}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium text-blue-800 dark:text-blue-400">
                          <span>TAC Commission ({rate}%)</span>
                          <span className="font-bold">- ₹{tacAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between font-black text-blue-950 dark:text-blue-200 border-t border-blue-200 dark:border-blue-800 pt-1.5">
                          <span>Net Property Amount</span>
                          <span>₹{propertyAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Quick Operational Controls Bar */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('quickActionsTitle')}
                </h4>

                {(() => {
                  const hasUnit = (booking as any).unitNumber || (booking as any).roomNumber || (booking as any).unitId || (booking as any).roomUnitId || (booking as any).assignedUnit;

                  if (booking.status === 'CONFIRMED') {
                    if (!hasUnit) {
                      return (
                        <button
                          onClick={() => setShowAssignModal(true)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 active:scale-98 transition-all cursor-pointer border border-amber-600"
                        >
                          <BedDouble className="w-4 h-4" />
                          <span>Assign Room Unit Before Check-In</span>
                        </button>
                      );
                    }
                    return (
                      <button
                        onClick={() => checkInMutation.mutate(booking.id)}
                        disabled={checkInMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 active:scale-98 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{checkInMutation.isPending ? t('syncing') : t('checkInGuestAction')}</span>
                      </button>
                    );
                  }

                  if (booking.status === 'CHECKED_IN') {
                    return (
                      <button
                        onClick={() => checkOutMutation.mutate(booking.id)}
                        disabled={checkOutMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 active:scale-98 transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{checkOutMutation.isPending ? t('syncing') : t('checkOutGuestAction')}</span>
                      </button>
                    );
                  }

                  return null;
                })()}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      router.push(`/invoices?bookingId=${booking.id}`);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition-all cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{t('issueInvoiceAction')}</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      router.push(`/bookings/${booking.id}`);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{t('view')}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <AssignRoomUnitModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        booking={(booking as Booking) || null}
      />
    </div>
  );

  return createPortal(content, document.body);
}
