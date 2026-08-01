'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  X,
  Loader2,
  ArrowRight,
  Moon,
} from 'lucide-react';

/* ─── Status & Channel Config ─── */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  CONFIRMED: { label: 'Confirmed', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  CHECKED_IN: { label: 'Checked In', color: 'text-blue-800', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  CHECKED_OUT: { label: 'Checked Out', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-300', dot: 'bg-slate-400' },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
  NO_SHOW: { label: 'No Show', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
};

const CHANNEL_CONFIG: Record<string, { label: string; icon: any }> = {
  WALK_IN: { label: 'Walk-In', icon: Users },
  PHONE: { label: 'Phone', icon: Phone },
  WEBSITE: { label: 'Website', icon: Globe },
  OTA: { label: 'OTA', icon: Globe },
  AGENCY: { label: 'Agency', icon: Plane },
};

/* ─── Skeleton Loading Table Rows ─── */
function TableSkeletonRows() {
  return (
    <>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <tr key={i} className="border-b border-slate-100">
          <td className="p-4 pl-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 skeleton rounded-lg shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-32 skeleton rounded" />
                <div className="h-3 w-24 skeleton rounded" />
              </div>
            </div>
          </td>
          <td className="p-4">
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 skeleton rounded" />
              <div className="h-3 w-36 skeleton rounded" />
            </div>
          </td>
          <td className="p-4">
            <div className="h-6 w-20 skeleton rounded-full" />
          </td>
          <td className="p-4">
            <div className="h-6 w-24 skeleton rounded-full" />
          </td>
          <td className="p-4">
            <div className="space-y-1">
              <div className="h-4 w-20 skeleton rounded" />
              <div className="h-3 w-14 skeleton rounded" />
            </div>
          </td>
          <td className="p-4 pr-5 text-right">
            <div className="inline-flex gap-2">
              <div className="h-8 w-20 skeleton rounded-lg" />
              <div className="h-8 w-24 skeleton rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

/* ─── Elegant Modal Wrapper ─── */
function ModalOverlay({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-enter"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-slate-900/50" />
      <div className="relative modal-card-enter w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

/* ─── Active Filter Chip ─── */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
      {label}
      <button
        onClick={onRemove}
        className="p-0.5 rounded hover:bg-emerald-200 transition-colors cursor-pointer"
        aria-label={`Remove filter: ${label}`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

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

  const activeFilterCount = [filters.status, filters.channel, filters.fromDate, filters.toDate, filters.guestSearch].filter(Boolean).length;

  const handleSearch = useCallback(() => {
    setFilters((f) => ({ ...f, guestSearch: searchInput || undefined, page: 1 }));
  }, [searchInput]);

  const clearAllFilters = useCallback(() => {
    setSearchInput('');
    setFilters((f) => ({ propertyId: f.propertyId, page: 1, limit: 15 }));
  }, []);

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

  const calculateNights = (checkIn: string, checkOut: string) => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans antialiased">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 flex flex-col min-h-screen bg-slate-100">
        {/* ═══ Header Bar ═══ */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
              <Calendar className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                {t('bookingManagement')}
              </h1>
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {activeProperty?.name || t('activeManagementHub')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            <button
              onClick={() => router.push('/bookings/occupancy')}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer btn-press"
            >
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span className="hidden sm:inline">{t('occupancyCalendar')}</span>
            </button>

            {isOwnerOrManager && (
              <button
                onClick={() => router.push('/bookings/approvals')}
                className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer btn-press"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">{t('approvalQueue')}</span>
              </button>
            )}

            <button
              onClick={() => router.push('/bookings/new')}
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer btn-press shadow-xs"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>{t('newBooking')}</span>
            </button>
          </div>
        </header>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* ═══ Filters Bar ═══ */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('searchGuestPlaceholder')}
                  className="w-full pl-9 pr-9 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                />
                {searchInput && (
                  <button
                    onClick={() => { setSearchInput(''); setFilters((f) => ({ ...f, guestSearch: undefined, page: 1 })); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <select
                value={filters.status || ''}
                onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value || undefined) as BookingStatus | undefined, page: 1 }))}
                className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
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
                className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
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
                className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
              />

              <input
                type="date"
                value={filters.toDate || ''}
                onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value || undefined, page: 1 }))}
                className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
              />

              <button
                onClick={handleSearch}
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer btn-press relative"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{t('applyFilters')}</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ml-1">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Active Filter Chips */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('activeFilters') || 'Active'}:</span>
                {filters.status && (
                  <FilterChip label={STATUS_CONFIG[filters.status]?.label || filters.status} onRemove={() => setFilters((f) => ({ ...f, status: undefined, page: 1 }))} />
                )}
                {filters.channel && (
                  <FilterChip label={CHANNEL_CONFIG[filters.channel]?.label || filters.channel} onRemove={() => setFilters((f) => ({ ...f, channel: undefined, page: 1 }))} />
                )}
                {filters.fromDate && (
                  <FilterChip label={`From: ${filters.fromDate}`} onRemove={() => setFilters((f) => ({ ...f, fromDate: undefined, page: 1 }))} />
                )}
                {filters.toDate && (
                  <FilterChip label={`To: ${filters.toDate}`} onRemove={() => setFilters((f) => ({ ...f, toDate: undefined, page: 1 }))} />
                )}
                {filters.guestSearch && (
                  <FilterChip label={`"${filters.guestSearch}"`} onRemove={() => { setSearchInput(''); setFilters((f) => ({ ...f, guestSearch: undefined, page: 1 })); }} />
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer ml-1"
                >
                  {t('clearFilters') || 'Clear All'}
                </button>
              </div>
            )}
          </div>

          {/* ═══ MODERN BOOKINGS DATA TABLE ═══ */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="p-4 pl-5">Guest Information</th>
                    <th className="p-4">Room & Dates</th>
                    <th className="p-4">Channel</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                  {isLoading ? (
                    <TableSkeletonRows />
                  ) : isError ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <div className="inline-flex flex-col items-center gap-3">
                          <AlertTriangle className="w-8 h-8 text-amber-600" />
                          <p className="font-extrabold text-slate-800">Unable to load bookings</p>
                          <button
                            onClick={() => refetch()}
                            className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                          >
                            Retry
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-16 text-center">
                        <div className="inline-flex flex-col items-center gap-3">
                          <Calendar className="w-10 h-10 text-slate-300" />
                          <h3 className="text-base font-extrabold text-slate-800">{t('noBookingsFound')}</h3>
                          <p className="text-xs text-slate-500">{t('noBookingsSubtitle')}</p>
                          <button
                            onClick={() => router.push('/bookings/new')}
                            className="mt-2 px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{t('createFirstBooking')}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => {
                      const statusCfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.CONFIRMED;
                      const channelCfg = CHANNEL_CONFIG[b.channel] || CHANNEL_CONFIG.WALK_IN;
                      const ChannelIcon = channelCfg.icon;
                      const nights = calculateNights(b.checkInDate, b.checkOutDate);

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* 1. Guest Information */}
                          <td className="p-4 pl-5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white font-black flex items-center justify-center text-xs shrink-0 uppercase">
                                {b.guest?.fullName ? b.guest.fullName.substring(0, 2) : 'G'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-900 text-xs truncate leading-tight">
                                  {b.guest?.fullName || 'Guest'}
                                </p>
                                <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                  {b.guest?.phone || b.guest?.email || '—'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* 2. Room & Dates */}
                          <td className="p-4">
                            <div>
                              <span className="font-bold text-slate-800 text-xs block truncate">
                                {b.roomType?.name || 'Standard Room'}
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{formatDate(b.checkInDate)}</span>
                                <ArrowRight className="w-3 h-3 text-slate-300" />
                                <span>{formatDate(b.checkOutDate)}</span>
                                <span className="ml-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                                  {nights}N
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 3. Channel */}
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                              <ChannelIcon className="w-3.5 h-3.5 text-slate-500" />
                              {channelCfg.label}
                            </span>
                          </td>

                          {/* 4. Status */}
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusCfg.bg} ${statusCfg.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                              {statusCfg.label}
                            </span>
                          </td>

                          {/* 5. Total Amount */}
                          <td className="p-4">
                            <div>
                              <p className="font-black text-slate-900 text-xs">{formatCurrency(b.totalAmount)}</p>
                              {Number(b.balanceDue) > 0 && (
                                <span className="inline-block text-[10px] font-extrabold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded mt-0.5">
                                  Due: {Number(b.balanceDue).toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 6. Actions — Modern Clean SaaS Alignment */}
                          <td className="p-4 pr-5 text-right">
                            <div className="inline-flex items-center justify-end gap-2 shrink-0">
                              {/* Primary Action Button */}
                              {b.status === 'CONFIRMED' && (
                                <button
                                  onClick={() => checkInMutation.mutate(b.id)}
                                  disabled={checkInMutation.isPending}
                                  className="h-8 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer btn-press shadow-2xs shrink-0 disabled:opacity-50"
                                >
                                  {checkInMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                                  {t('checkIn')}
                                </button>
                              )}
                              {b.status === 'CHECKED_IN' && (
                                <button
                                  onClick={() => checkOutMutation.mutate(b.id)}
                                  disabled={checkOutMutation.isPending}
                                  className="h-8 px-3 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer btn-press shadow-2xs shrink-0 disabled:opacity-50"
                                >
                                  {checkOutMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                                  {t('checkOut')}
                                </button>
                              )}

                              {/* Secondary Action Toolbar */}
                              <div className="flex items-center gap-0.5 p-0.5 bg-slate-100/90 border border-slate-200/90 rounded-lg shrink-0">
                                <button
                                  onClick={() => router.push(`/bookings/${b.id}`)}
                                  className="w-7 h-7 rounded-md bg-white hover:bg-emerald-50 border border-slate-200/60 hover:border-emerald-200 text-slate-600 hover:text-emerald-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                                  title={t('view')}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT' && (
                                  <button
                                    onClick={() => router.push(`/bookings/${b.id}?edit=true`)}
                                    className="w-7 h-7 rounded-md bg-white hover:bg-blue-50 border border-slate-200/60 hover:border-blue-200 text-slate-600 hover:text-blue-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                                    title={t('edit')}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {(b.status === 'CHECKED_OUT' || b.status === 'CHECKED_IN' || b.status === 'CANCELLED') && (
                                  <button
                                    onClick={() => setShowRevertModal({
                                      booking: b,
                                      targetStatus: b.status === 'CHECKED_OUT' ? 'CHECKED_IN' : 'CONFIRMED',
                                    })}
                                    className="w-7 h-7 rounded-md bg-white hover:bg-amber-50 border border-slate-200/60 hover:border-amber-200 text-slate-600 hover:text-amber-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                                    title={t('revert')}
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT' && (
                                  <button
                                    onClick={() => setShowCancelModal(b)}
                                    className="w-7 h-7 rounded-md bg-white hover:bg-rose-50 border border-slate-200/60 hover:border-rose-200 text-slate-600 hover:text-rose-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                                    title={t('cancel')}
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  onClick={() => setShowDeleteModal(b)}
                                  className="w-7 h-7 rounded-md bg-white hover:bg-rose-50 border border-slate-200/60 hover:border-rose-200 text-slate-400 hover:text-rose-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                                  title={isReception ? 'Request Delete' : t('delete')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══ Pagination ═══ */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">
                {t('showing')} {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} {t('of')} {pagination.total}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setFilters((f) => ({ ...f, page: pageNum }))}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        pagination.page === pageNum
                          ? 'bg-emerald-700 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══ Cancel Modal ═══ */}
        <ModalOverlay isOpen={!!showCancelModal} onClose={() => setShowCancelModal(null)}>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{t('cancelBooking')}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {t('cancelBookingConfirm')} <strong>{showCancelModal?.guest?.fullName}</strong>?
                </p>
              </div>
            </div>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t('cancellationReasonPlaceholder')}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium resize-none h-24 focus:outline-none focus:border-emerald-600"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                onClick={() => { setRefundType('REFUND'); }}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${refundType === 'REFUND' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {t('refundAdvance')}
              </button>
              <button
                onClick={() => { setRefundType('FORFEIT'); }}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${refundType === 'FORFEIT' ? 'bg-rose-50 border-rose-300 text-rose-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {t('forfeitAdvance')}
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setShowCancelModal(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">{t('close')}</button>
              <button
                onClick={handleCancelConfirm}
                disabled={cancelMutation.isPending || !cancelReason}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {cancelMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {cancelMutation.isPending ? t('cancelling') : t('confirmCancel')}
              </button>
            </div>
          </div>
        </ModalOverlay>

        {/* ═══ Delete / Request Delete Modal ═══ */}
        <ModalOverlay isOpen={!!showDeleteModal} onClose={() => setShowDeleteModal(null)}>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {isReception ? t('requestDeletion') : t('deleteBooking')}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {isReception ? t('requestDeletionConfirm') : t('deleteBookingConfirm')}{' '}
                  <strong>{showDeleteModal?.guest?.fullName}</strong>
                </p>
              </div>
            </div>

            {isReception && (
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder={t('deletionReasonPlaceholder')}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium resize-none h-24 focus:outline-none focus:border-emerald-600"
                autoFocus
              />
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setShowDeleteModal(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">{t('close')}</button>
              <button
                onClick={handleDeleteConfirm}
                disabled={(isReception && deleteReason.length < 5) || deleteMutation.isPending || requestDeletionMutation.isPending}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {(deleteMutation.isPending || requestDeletionMutation.isPending) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isReception ? t('submitRequest') : t('confirmDelete')}
              </button>
            </div>
          </div>
        </ModalOverlay>

        {/* ═══ Revert Status Modal ═══ */}
        <ModalOverlay isOpen={!!showRevertModal} onClose={() => setShowRevertModal(null)}>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">{t('revertBookingStatus') || 'Revert Booking Status'}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Did you accidentally change the status for <strong>{showRevertModal?.booking.guest?.fullName}</strong>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_CONFIG[showRevertModal?.booking.status || 'CONFIRMED']?.bg} ${STATUS_CONFIG[showRevertModal?.booking.status || 'CONFIRMED']?.color}`}>
                {showRevertModal?.booking.status?.replace('_', ' ')}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_CONFIG[showRevertModal?.targetStatus || 'CONFIRMED']?.bg} ${STATUS_CONFIG[showRevertModal?.targetStatus || 'CONFIRMED']?.color}`}>
                {showRevertModal?.targetStatus?.replace('_', ' ')}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowRevertModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  if (!showRevertModal) return;
                  revertMutation.mutate(
                    { id: showRevertModal.booking.id, status: showRevertModal.targetStatus },
                    { onSuccess: () => setShowRevertModal(null) }
                  );
                }}
                disabled={revertMutation.isPending}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {revertMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {revertMutation.isPending ? (t('reverting') || 'Reverting...') : (t('confirmRevert') || 'Confirm Revert')}
              </button>
            </div>
          </div>
        </ModalOverlay>
      </main>
    </div>
  );
}
