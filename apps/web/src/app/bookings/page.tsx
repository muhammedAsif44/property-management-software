'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { authService } from '@/features/auth';
import {
  useBookingsQuery,
  useCancelBookingMutation,
  useCheckInMutation,
  useCheckOutMutation,
  useDeleteBookingMutation,
  useRequestDeletionMutation,
  useRevertStatusMutation,
} from '@/features/bookings/api/use-bookings';
import { useTranslation, LanguageSwitcher } from '@/lib/i18n';
import { BookingFilters, BookingStatus, BookingChannel, Booking } from '@/features/bookings/types/booking.types';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  XCircle,
  Trash2,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  UserX,
  Building2,
  Plane,
  Phone,
  Globe,
  Users,
  RotateCcw,
  BedDouble,
  CalendarDays,
  IndianRupee,

} from 'lucide-react';

/* ─── Status & Channel Config ─── */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; icon: any }> = {
  CONFIRMED: { label: 'Confirmed', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
  CHECKED_IN: { label: 'Checked In', color: 'text-blue-800', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500', icon: LogIn },
  CHECKED_OUT: { label: 'Checked Out', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-300', dot: 'bg-slate-400', icon: LogOut },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500', icon: Ban },
  NO_SHOW: { label: 'No Show', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', icon: UserX },
};

const CHANNEL_CONFIG: Record<string, { label: string; icon: any }> = {
  WALK_IN: { label: 'Walk-In', icon: Users },
  PHONE: { label: 'Phone', icon: Phone },
  WEBSITE: { label: 'Website', icon: Globe },
  OTA: { label: 'OTA', icon: Globe },
  AGENCY: { label: 'Agency', icon: Plane },
};

export default function BookingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  useActivePropertyQuery();
  const activeProperty = usePropertyStore((s) => s.activeProperty);

  const { data: profileData } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => authService.getProfile(),
    staleTime: 60000,
    retry: false,
  });

  const userRole = profileData?.user?.role || profileData?.data?.user?.role || 'OWNER';
  const isOwnerOrManager = ['OWNER', 'MANAGER', 'SUPER_ADMIN'].includes(userRole);
  const isReception = userRole === 'RECEPTION_STAFF';

  const [filters, setFilters] = useState<BookingFilters>({
    propertyId: activeProperty?.id,
    page: 1,
    limit: 15,
  });
  const [searchInput, setSearchInput] = useState('');
  const [showCancelModal, setShowCancelModal] = useState<Booking | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Booking | null>(null);
  const [showRevertModal, setShowRevertModal] = useState<{ booking: Booking; targetStatus: 'CONFIRMED' | 'CHECKED_IN' } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [refundType, setRefundType] = useState<'REFUND' | 'FORFEIT'>('REFUND');


  const activeFilters = useMemo(() => ({
    ...filters,
    propertyId: activeProperty?.id || filters.propertyId,
  }), [filters, activeProperty?.id]);

  const { data, isLoading, isError, refetch } = useBookingsQuery(activeFilters);
  const cancelMutation = useCancelBookingMutation();
  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();
  const revertMutation = useRevertStatusMutation();
  const deleteMutation = useDeleteBookingMutation();
  const requestDeletionMutation = useRequestDeletionMutation();

  const bookings = data?.bookings || [];
  const pagination = data?.pagination;

  const handleSearch = () => {
    setFilters((f) => ({ ...f, guestSearch: searchInput || undefined, page: 1 }));
  };

  const handleCancelConfirm = () => {
    if (!showCancelModal) return;
    cancelMutation.mutate(
      { id: showCancelModal.id, payload: { cancellationReason: cancelReason, refundType } },
      { onSuccess: () => { setShowCancelModal(null); setCancelReason(''); } },
    );
  };

  const handleDeleteConfirm = () => {
    if (!showDeleteModal) return;
    if (isReception) {
      requestDeletionMutation.mutate(
        { id: showDeleteModal.id, reason: deleteReason },
        { onSuccess: () => { setShowDeleteModal(null); setDeleteReason(''); } },
      );
    } else {
      deleteMutation.mutate(showDeleteModal.id, {
        onSuccess: () => { setShowDeleteModal(null); },
      });
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatCurrency = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

  return (
    <div className="flex min-h-screen bg-slate-50/90 text-slate-900 font-sans antialiased relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      <DashboardSidebar />
      <main className="flex-1 min-w-0 transition-all duration-300 relative z-10 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-emerald-200/80 sticky top-0 z-30 px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100/80 border border-emerald-200 text-emerald-800 shadow-xs">
              <Calendar className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                {t('bookingManagement')}
              </h1>
              <p className="text-[11px] font-bold text-emerald-700/80 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {activeProperty?.name || t('activeManagementHub')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <LanguageSwitcher />

            <button
              onClick={() => router.push('/bookings/occupancy')}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 text-slate-800 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>{t('occupancyCalendar')}</span>
            </button>

            {isOwnerOrManager && (
              <button
                onClick={() => router.push('/bookings/approvals')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{t('approvalQueue')}</span>
              </button>
            )}

            <button
              onClick={() => router.push('/bookings/new')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 active:scale-95 text-white text-xs font-black transition-all duration-200 shadow-md shadow-emerald-700/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-200" />
              <span>{t('newBooking')}</span>
            </button>
          </div>
        </header>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* Filters Bar */}
          <div className="p-4 bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('searchGuestPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                />
              </div>

              <select
                value={filters.status || ''}
                onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value || undefined) as BookingStatus | undefined, page: 1 }))}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer min-w-0"
              >
                <option value="">{t('allStatuses')}</option>
                <option value="CONFIRMED">{t('confirmed')}</option>
                <option value="CHECKED_IN">{t('checkedIn')}</option>
                <option value="CHECKED_OUT">{t('checkedOut')}</option>
                <option value="CANCELLED">{t('cancelled')}</option>
              </select>

              <select
                value={filters.channel || ''}
                onChange={(e) => setFilters((f) => ({ ...f, channel: (e.target.value || undefined) as BookingChannel | undefined, page: 1 }))}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer min-w-0"
              >
                <option value="">{t('allChannels')}</option>
                <option value="WALK_IN">{t('walkIn')}</option>
                <option value="PHONE">{t('phoneBooking')}</option>
                <option value="AGENCY">{t('agencyBooking')}</option>
                <option value="OTA">{t('otaBooking')}</option>
              </select>

              <input
                type="date"
                value={filters.fromDate || ''}
                onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value || undefined, page: 1 }))}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
              />

              <input
                type="date"
                value={filters.toDate || ''}
                onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value || undefined, page: 1 }))}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
              />

              <button
                onClick={handleSearch}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{t('applyFilters')}</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="p-16 text-center">
              <div className="inline-flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                  <Clock className="w-6 h-6 animate-pulse text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-slate-500">{t('loadingBookings')}</p>
              </div>
            </div>
          ) : isError ? (
            <div className="p-16 text-center space-y-4">
              <div className="inline-flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="text-base font-extrabold text-slate-800">Temporary Database Reconnection</h3>
                <p className="text-xs text-slate-500 max-w-md">The system is re-establishing the database connection. Please click retry to reload your bookings.</p>
                <button
                  onClick={() => refetch()}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry Loading Bookings</span>
                </button>
              </div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <div className="inline-flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-base font-extrabold text-slate-800">{t('noBookingsFound')}</h3>
                <p className="text-xs text-slate-500">{t('noBookingsSubtitle')}</p>
                <button
                  onClick={() => router.push('/bookings/new')}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('createFirstBooking')}</span>
                </button>
              </div>
            </div>
          ) : (
            /* ─── Enhanced Premium Booking Cards ─── */
            <div className="space-y-4">
              {bookings.map((b) => {
                const statusCfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.CONFIRMED;
                const channelCfg = CHANNEL_CONFIG[b.channel] || CHANNEL_CONFIG.WALK_IN;
                const ChannelIcon = channelCfg.icon;

                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-emerald-300/70 transition-all duration-300 overflow-hidden group"
                  >
                    {/* ── Top Row: Guest Identity + Status + Amount ── */}
                    <div className="p-5 sm:p-6 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        {/* Guest Identity */}
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-white font-black flex items-center justify-center text-sm shadow-lg shadow-emerald-700/25 shrink-0 uppercase tracking-tight ring-2 ring-emerald-500/20">
                            {b.guest?.fullName ? b.guest.fullName.substring(0, 2) : 'G'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-black text-slate-900 text-base tracking-tight truncate leading-tight">
                              {b.guest?.fullName || 'Guest'}
                            </h3>
                            <p className="text-xs text-slate-500 font-semibold mt-1 truncate">
                              {b.guest?.phone || b.guest?.email || '—'}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge + Amount */}
                        <div className="flex items-start gap-4 shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${statusCfg.bg} ${statusCfg.color}`}>
                            <span className={`w-2 h-2 rounded-full ${statusCfg.dot} animate-pulse`} />
                            {statusCfg.label}
                          </span>
                          <div className="text-right">
                            <p className="font-black text-slate-900 text-lg tracking-tight leading-tight">{formatCurrency(b.totalAmount)}</p>
                            {Number(b.balanceDue) > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-700 text-[11px] font-extrabold mt-1">
                                <IndianRupee className="w-3 h-3" />
                                Due: {Number(b.balanceDue).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Bottom Row: Stay Details + Actions ── */}
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Stay Info Chips */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* Room Type Chip */}
                          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                            <BedDouble className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span className="font-bold text-emerald-900 text-xs">{b.roomType?.name || 'Standard'}</span>
                          </div>

                          {/* Date Range Chip */}
                          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50/60 border border-blue-200/70">
                            <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="font-bold text-blue-900 text-xs">{formatDate(b.checkInDate)}</span>
                            <span className="text-blue-400 font-bold">→</span>
                            <span className="font-bold text-blue-900 text-xs">{formatDate(b.checkOutDate)}</span>
                          </div>

                          {/* Channel Chip */}
                          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80">
                            <ChannelIcon className="w-4 h-4 text-slate-600 shrink-0" />
                            <span className="font-bold text-slate-800 text-xs">{channelCfg.label}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Primary CTA */}
                          {b.status === 'CONFIRMED' && (
                            <button
                              onClick={() => checkInMutation.mutate(b.id)}
                              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs shadow-lg shadow-emerald-700/25 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                            >
                              <LogIn className="w-4 h-4" />
                              {t('checkIn')}
                            </button>
                          )}
                          {b.status === 'CHECKED_IN' && (
                            <button
                              onClick={() => checkOutMutation.mutate(b.id)}
                              className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 active:scale-95 text-white font-black text-xs shadow-lg shadow-indigo-700/25 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                            >
                              <LogOut className="w-4 h-4" />
                              {t('checkOut')}
                            </button>
                          )}

                          {/* Divider */}
                          <div className="w-px h-6 bg-slate-200 mx-0.5 hidden sm:block" />

                          {/* Secondary Actions */}
                          <button
                            onClick={() => router.push(`/bookings/${b.id}`)}
                            className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {t('view')}
                          </button>

                          {b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT' && (
                            <button
                              onClick={() => router.push(`/bookings/${b.id}?edit=true`)}
                              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-blue-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              {t('edit')}
                            </button>
                          )}

                          {(b.status === 'CHECKED_OUT' || b.status === 'CHECKED_IN' || b.status === 'CANCELLED') && (
                            <button
                              onClick={() => setShowRevertModal({
                                booking: b,
                                targetStatus: b.status === 'CHECKED_OUT' ? 'CHECKED_IN' : 'CONFIRMED',
                              })}
                              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-amber-800 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                              {t('revert')}
                            </button>
                          )}

                          {b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT' && (
                            <button
                              onClick={() => setShowCancelModal(b)}
                              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-rose-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              {t('cancel')}
                            </button>
                          )}

                          <button
                            onClick={() => setShowDeleteModal(b)}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-rose-500 hover:text-rose-700 transition-all cursor-pointer"
                            title={isReception ? 'Request Delete' : t('delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/90 shadow-xs">
              <p className="text-xs font-bold text-slate-500">
                {t('showing')} {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} {t('of')} {pagination.total}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-extrabold text-slate-800 px-3">{pagination.page} / {pagination.totalPages}</span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">{t('cancelBooking')}</h3>
              <p className="text-xs text-slate-600 font-medium">
                {t('cancelBookingConfirm')} <strong>{showCancelModal.guest?.fullName}</strong>?
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={t('cancellationReasonPlaceholder')}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium resize-none h-24 focus:outline-none focus:border-emerald-600 transition-all"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setRefundType('REFUND'); }}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${refundType === 'REFUND' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {t('refundAdvance')}
                </button>
                <button
                  onClick={() => { setRefundType('FORFEIT'); }}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${refundType === 'FORFEIT' ? 'bg-rose-50 border-rose-300 text-rose-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {t('forfeitAdvance')}
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowCancelModal(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">{t('close')}</button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={cancelMutation.isPending || !cancelReason}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {cancelMutation.isPending ? t('cancelling') : t('confirmCancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete / Request Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">
                {isReception ? t('requestDeletion') : t('deleteBooking')}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {isReception
                  ? t('requestDeletionConfirm')
                  : t('deleteBookingConfirm')}
                {' '}<strong>{showDeleteModal.guest?.fullName}</strong>
              </p>
              {isReception && (
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder={t('deletionReasonPlaceholder')}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium resize-none h-24 focus:outline-none focus:border-emerald-600 transition-all"
                />
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowDeleteModal(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">{t('close')}</button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={(isReception && deleteReason.length < 5) || deleteMutation.isPending || requestDeletionMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isReception ? t('submitRequest') : t('confirmDelete')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Revert Status Confirmation Modal */}
        {showRevertModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md space-y-4">
              <div className="flex items-center gap-3 text-amber-700">
                <div className="p-2.5 rounded-2xl bg-amber-100 border border-amber-200">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Revert Booking Status</h3>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Did you accidentally change the status for <strong>{showRevertModal.booking.guest?.fullName}</strong>?
                Reverting will restore status from <strong>{showRevertModal.booking.status.replace('_', ' ')}</strong> back to <strong>{showRevertModal.targetStatus.replace('_', ' ')}</strong>.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowRevertModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    revertMutation.mutate(
                      { id: showRevertModal.booking.id, status: showRevertModal.targetStatus },
                      { onSuccess: () => setShowRevertModal(null) }
                    );
                  }}
                  disabled={revertMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50 transition-all cursor-pointer"
                >
                  {revertMutation.isPending ? 'Reverting...' : 'Confirm Revert'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
