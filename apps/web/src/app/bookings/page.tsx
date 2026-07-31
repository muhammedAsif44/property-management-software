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
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  CONFIRMED: { label: 'Confirmed', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  CHECKED_IN: { label: 'Checked In', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: LogIn },
  CHECKED_OUT: { label: 'Checked Out', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: LogOut },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: Ban },
  NO_SHOW: { label: 'No Show', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: UserX },
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
  const [cancelReason, setCancelReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [refundType, setRefundType] = useState<'REFUND' | 'FORFEIT'>('REFUND');

  const activeFilters = useMemo(() => ({
    ...filters,
    propertyId: activeProperty?.id || filters.propertyId,
  }), [filters, activeProperty?.id]);

  const { data, isLoading } = useBookingsQuery(activeFilters);
  const cancelMutation = useCancelBookingMutation();
  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();
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
    <div className="flex h-screen bg-slate-50/90 text-slate-900 font-sans antialiased relative overflow-hidden">
      {/* Ambient Rich Emerald Glow Elements */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      <DashboardSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto relative z-10">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-emerald-600" />
                {t('bookingManagement')}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5 min-w-0 truncate">{activeProperty?.name || ''}</p>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <button
                onClick={() => router.push('/bookings/occupancy')}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                {t('occupancyCalendar')}
              </button>
              {isOwnerOrManager && (
                <button
                  onClick={() => router.push('/bookings/approvals')}
                  className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {t('approvalQueue')}
                </button>
              )}
              <button
                onClick={() => router.push('/bookings/new')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('newBooking')}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('searchGuestPlaceholder')}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                />
              </div>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value || undefined) as BookingStatus | undefined, page: 1 }))}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white min-w-0"
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
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white min-w-0"
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
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
              />
              <input
                type="date"
                value={filters.toDate || ''}
                onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value || undefined, page: 1 }))}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all flex items-center gap-1.5"
              >
                <Filter className="w-4 h-4" />
                {t('applyFilters')}
              </button>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-3 animate-pulse" />
                <p className="text-sm">{t('loadingBookings')}</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600">{t('noBookingsFound')}</h3>
                <p className="text-sm text-gray-400 mt-1">{t('noBookingsSubtitle')}</p>
                <button
                  onClick={() => router.push('/bookings/new')}
                  className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  {t('createFirstBooking')}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/80 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 min-w-0">{t('guest')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('roomType')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('dates')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('channel')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('amount')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('status')}</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bookings.map((b) => {
                      const statusCfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.CONFIRMED;
                      const channelCfg = CHANNEL_CONFIG[b.channel] || CHANNEL_CONFIG.WALK_IN;
                      const StatusIcon = statusCfg.icon;
                      const ChannelIcon = channelCfg.icon;
                      return (
                        <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{b.guest?.fullName}</p>
                              <p className="text-xs text-gray-400 truncate">{b.guest?.phone || b.guest?.email || '—'}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-700 font-medium">{b.roomType?.name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-700">{formatDate(b.checkInDate)}</p>
                            <p className="text-xs text-gray-400">→ {formatDate(b.checkOutDate)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-gray-600 text-xs">
                              <ChannelIcon className="w-3.5 h-3.5" />
                              {channelCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{formatCurrency(b.totalAmount)}</p>
                            {Number(b.balanceDue) > 0 && (
                              <p className="text-xs text-red-500">Due: {formatCurrency(b.balanceDue)}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${statusCfg.bg} ${statusCfg.color}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => router.push(`/bookings/${b.id}`)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT' && (
                                <>
                                  <button
                                    onClick={() => router.push(`/bookings/${b.id}?edit=true`)}
                                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  {b.status === 'CONFIRMED' && (
                                    <button
                                      onClick={() => checkInMutation.mutate(b.id)}
                                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                                      title="Check In"
                                    >
                                      <LogIn className="w-4 h-4" />
                                    </button>
                                  )}
                                  {b.status === 'CHECKED_IN' && (
                                    <button
                                      onClick={() => checkOutMutation.mutate(b.id)}
                                      className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                                      title="Check Out"
                                    >
                                      <LogOut className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setShowCancelModal(b)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                    title="Cancel"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => setShowDeleteModal(b)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                                title={isReception ? 'Request Delete' : 'Delete'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                <p className="text-xs text-gray-500">
                  {t('showing')} {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} {t('of')} {pagination.total}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-600 px-2">{pagination.page} / {pagination.totalPages}</span>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">{t('cancelBooking')}</h3>
              <p className="text-sm text-gray-500">
                {t('cancelBookingConfirm')} <strong>{showCancelModal.guest?.fullName}</strong>?
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={t('cancellationReasonPlaceholder')}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setRefundType('REFUND'); }}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${refundType === 'REFUND' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {t('refundAdvance')}
                </button>
                <button
                  onClick={() => { setRefundType('FORFEIT'); }}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${refundType === 'FORFEIT' ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {t('forfeitAdvance')}
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowCancelModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-all">{t('close')}</button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={cancelMutation.isPending || !cancelReason}
                  className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-all"
                >
                  {cancelMutation.isPending ? t('cancelling') : t('confirmCancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete / Request Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">
                {isReception ? t('requestDeletion') : t('deleteBooking')}
              </h3>
              <p className="text-sm text-gray-500">
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowDeleteModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-all">{t('close')}</button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={(isReception && deleteReason.length < 5) || deleteMutation.isPending || requestDeletionMutation.isPending}
                  className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-all"
                >
                  {isReception ? t('submitRequest') : t('confirmDelete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
