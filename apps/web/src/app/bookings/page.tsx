'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { AppHeader } from '@/components/app-header';
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
import dynamic from 'next/dynamic';
import { QuickHelpDrawer } from '@/components/quick-help-drawer';
import { Sparkline } from '@/components/ui/sparkline';
import { BulkActionBar } from '@/components/ui/bulk-action-bar';
import { useToast } from '@/components/ui/toast';
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
  Download,
  CreditCard,
  FileText,
  MoreHorizontal,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  CONFIRMED: { label: 'Confirmed', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  CHECKED_IN: { label: 'Checked In', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  CHECKED_OUT: { label: 'Checked Out', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-300', dot: 'bg-slate-400' },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
  NO_SHOW: { label: 'No Show', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
};

const CancelBookingModal = dynamic(() => import('@/features/bookings/components/cancel-booking-modal').then(m => m.CancelBookingModal), { ssr: false });
const DeleteBookingModal = dynamic(() => import('@/features/bookings/components/delete-booking-modal').then(m => m.DeleteBookingModal), { ssr: false });
const RevertStatusModal = dynamic(() => import('@/features/bookings/components/revert-status-modal').then(m => m.RevertStatusModal), { ssr: false });
const PaymentEntryModal = dynamic(() => import('@/features/payments/components/payment-entry-modal').then(m => m.PaymentEntryModal), { ssr: false });
const InvoicePreviewModal = dynamic(() => import('@/features/invoices/components/invoice-preview-modal').then(m => m.InvoicePreviewModal), { ssr: false });
const AssignRoomUnitModal = dynamic(() => import('@/features/bookings/components/assign-room-unit-modal').then(m => m.AssignRoomUnitModal), { ssr: false });

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
  const [showPaymentModal, setShowPaymentModal] = useState<Booking | null>(null);
  const [showInvoicePreviewModal, setShowInvoicePreviewModal] = useState<Booking | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<Booking | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Close open dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setOpenDropdownId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

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

  const resData: any = data;
  const bookings: Booking[] = Array.isArray(resData)
    ? resData
    : (resData?.bookings || resData?.data?.bookings || (Array.isArray(resData?.data) ? resData.data : []));
  const pagination = resData?.pagination || resData?.data?.pagination;

  const toast = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(bookings.map((b: Booking) => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const selectedBookings = bookings.filter((b: Booking) => selectedIds.includes(b.id));
    if (selectedBookings.length === 0) return;

    const csvLines = [
      'Booking ID,Guest Name,Channel,Status,Total Amount,Check-In,Check-Out',
      ...selectedBookings.map(
        (b: Booking) =>
          `"${b.id}","${b.guest?.fullName || 'Guest'}","${b.channel}","${b.status}","${
            b.totalAmount
          }","${new Date(b.checkInDate).toLocaleDateString()}","${new Date(b.checkOutDate).toLocaleDateString()}"`
      ),
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orvyn_bookings_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedBookings.length} reservations to CSV!`, 'CSV Exported');
  };

  const handleCheckInWithUndo = (id: string) => {
    const b = bookings.find((item: Booking) => item.id === id);
    const hasUnit = b && (b.unitNumber || (b as any).roomNumber || (b as any).unitId || (b as any).roomUnitId || (b as any).assignedUnit);

    if (b && !hasUnit) {
      setShowAssignModal(b);
      return;
    }

    checkInMutation.mutate(id, {
      onSuccess: () => {
        toast.showUndoToast(
          'Guest checked in successfully!',
          () => {
            revertMutation.mutate({ id, status: 'CONFIRMED' });
            toast.info('Check-in status reverted to Confirmed', 'Reverted');
          },
          'Check-In Complete'
        );
      },
      onError: (err: any) => {
        if (err?.message?.toLowerCase().includes('room unit')) {
          toast.warning('Please assign a room unit to complete check-in.', 'Room Unit Required');
          router.push(`/bookings/${id}`);
        }
      },
    });
  };

  const handleCheckOutWithUndo = (id: string) => {
    checkOutMutation.mutate(id, {
      onSuccess: () => {
        toast.showUndoToast(
          'Guest checked out successfully!',
          () => {
            revertMutation.mutate({ id, status: 'CHECKED_IN' });
            toast.info('Check-out status reverted to Checked In', 'Reverted');
          },
          'Check-Out Complete'
        );
      },
    });
  };

  const activeFilterCount = [filters.status, filters.channel, filters.fromDate, filters.toDate, filters.guestSearch].filter(Boolean).length;

  const handleSearch = useCallback(() => {
    setFilters((f) => ({ ...f, guestSearch: searchInput || undefined, page: 1 }));
  }, [searchInput]);

  const clearAllFilters = useCallback(() => {
    setSearchInput('');
    setFilters((f) => ({ propertyId: f.propertyId, page: 1, limit: 15 }));
  }, []);

  const handleCancelConfirm = () => {};
  const handleDeleteConfirm = () => {};

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatCurrency = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

  const calculateNights = (checkIn: string, checkOut: string) => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative">
      {/* Left Navigation Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* ═══ Top Header Bar ═══ */}
        <AppHeader
          actions={
            <div className="flex items-center gap-2">
              <QuickHelpDrawer />
              <button
                onClick={() => router.push('/bookings/room-calendar')}
                className="h-9 px-3 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline truncate">{t('occupancyCalendar')}</span>
              </button>
              {isOwnerOrManager && (
                <button
                  onClick={() => router.push('/bookings/approvals')}
                  className="interactive h-9 px-3 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-divider text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm" />
                  <span className="hidden sm:inline truncate">{t('approvalQueue')}</span>
                </button>
              )}
              <button
                onClick={() => router.push('/bookings/new')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-md shadow-emerald-900/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('newBooking')}</span>
              </button>
            </div>
          }
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-3 bg-slate-50/90 dark:bg-slate-850 px-4 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-800 shadow-2xs min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate">
                  {activeProperty?.name || 'Azura Resorts & Spa'}
                </h1>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 leading-tight truncate">
                  Bookings Management
                </span>
              </div>
            </div>
          </div>
        </AppHeader>

        <div className="p-4 lg:p-6 space-y-4 flex-1 overflow-y-auto">
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

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={filters.fromDate || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value || undefined, page: 1 }))}
                  className="pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer transition-all"
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={filters.toDate || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value || undefined, page: 1 }))}
                  className="pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer transition-all"
                />
              </div>

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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs min-h-[380px]">
            <div className="overflow-x-auto pb-32">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={
                          bookings.length > 0 && selectedIds.length === bookings.length
                        }
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                        title="Select all reservations"
                      />
                    </th>
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
                      <td colSpan={7} className="p-12 text-center">
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
                      <td colSpan={7} className="p-16 text-center">
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
                    bookings.map((b, idx) => {
                      const isBottomRow = bookings.length > 3 && idx >= bookings.length - 2;
                      const statusCfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.CONFIRMED;
                      const channelCfg = CHANNEL_CONFIG[b.channel] || CHANNEL_CONFIG.WALK_IN;
                      const ChannelIcon = channelCfg.icon;
                      const nights = calculateNights(b.checkInDate, b.checkOutDate);
                      const isSelected = selectedIds.includes(b.id);

                      return (
                        <tr
                          key={b.id}
                          className={`transition-all ${
                            isSelected ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Checkbox Column */}
                          <td
                            className="p-4 text-center"
                            onClick={(e) => handleSelectOne(b.id, e)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                            />
                          </td>
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
                                <span className="ml-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
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

                          {/* 6. Actions — Enterprise SaaS Action Dropdown & Labeled Buttons */}
                          <td className="p-4 pr-5 text-right relative">
                            <div className="inline-flex items-center justify-end gap-1.5 shrink-0">
                              {/* Check-In / Assign Room / Check-Out Contextual Action Button */}
                              {(() => {
                                const hasUnit = b.unitNumber || (b as any).roomNumber || (b as any).unitId || (b as any).roomUnitId || (b as any).assignedUnit;

                                if (b.status === 'CONFIRMED') {
                                  if (!hasUnit) {
                                    return (
                                      <button
                                        onClick={() => handleCheckInWithUndo(b.id)}
                                        className="h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 border border-amber-600"
                                        title="Assign a Room Unit before Check-In"
                                      >
                                        <BedDouble className="w-3.5 h-3.5" />
                                        <span>Assign Room</span>
                                      </button>
                                    );
                                  }
                                  return (
                                    <button
                                      onClick={() => handleCheckInWithUndo(b.id)}
                                      disabled={checkInMutation.isPending}
                                      className="h-8 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 disabled:opacity-50"
                                    >
                                      {checkInMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                                      <span>{t('checkIn')}</span>
                                    </button>
                                  );
                                }

                                if (b.status === 'CHECKED_IN') {
                                  return (
                                    <button
                                      onClick={() => handleCheckOutWithUndo(b.id)}
                                      disabled={checkOutMutation.isPending}
                                      className="h-8 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 disabled:opacity-50"
                                    >
                                      {checkOutMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                                      <span>{t('checkOut')}</span>
                                    </button>
                                  );
                                }

                                return null;
                              })()}

                              {/* Labeled Quick Action 1: Record Payment */}
                              <button
                                onClick={() => setShowPaymentModal(b)}
                                className="h-8 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                                title="Record Payment"
                              >
                                <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Pay</span>
                              </button>

                              {/* Labeled Quick Action 2: Invoice Preview */}
                              <button
                                onClick={() => setShowInvoicePreviewModal(b)}
                                className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                                title="Invoice Preview"
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                                <span>Invoice</span>
                              </button>

                              {/* More Actions Dropdown Toggle (...) */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(openDropdownId === b.id ? null : b.id);
                                  }}
                                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
                                  title="More Actions"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {/* Dropdown Menu (Opens Upward for Bottom Rows to Avoid Table Clipping) */}
                                {openDropdownId === b.id && (
                                  <div
                                    className={`absolute right-0 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1 space-y-0.5 text-left text-xs font-bold ${
                                      isBottomRow ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        router.push(`/bookings/${b.id}`);
                                      }}
                                      className="w-full px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                                      <span>View Details</span>
                                    </button>

                                    {b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT' && (
                                      <button
                                        onClick={() => {
                                          setOpenDropdownId(null);
                                          router.push(`/bookings/${b.id}?edit=true`);
                                        }}
                                        className="w-full px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                                      >
                                        <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                                        <span>Edit Booking</span>
                                      </button>
                                    )}

                                    {(b.status === 'CHECKED_OUT' || b.status === 'CHECKED_IN' || b.status === 'CANCELLED') && (
                                      <button
                                        onClick={() => {
                                          setOpenDropdownId(null);
                                          setShowRevertModal({
                                            booking: b,
                                            targetStatus: b.status === 'CHECKED_OUT' ? 'CHECKED_IN' : 'CONFIRMED',
                                          });
                                        }}
                                        className="w-full px-3 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Revert Status</span>
                                      </button>
                                    )}

                                    {b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT' && (
                                      <button
                                        onClick={() => {
                                          setOpenDropdownId(null);
                                          setShowCancelModal(b);
                                        }}
                                        className="w-full px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-800"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                        <span>Cancel Booking</span>
                                      </button>
                                    )}

                                    <button
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        setShowDeleteModal(b);
                                      }}
                                      className="w-full px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>{isReception ? 'Request Delete' : 'Delete Booking'}</span>
                                    </button>
                                  </div>
                                )}
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
            
            {/* End of List State (When very few bookings exist) */}
            {bookings.length > 0 && bookings.length < 5 && (
              <div className="p-12 border-t border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                <Calendar className="w-8 h-8 text-slate-300 mb-3" />
                <h4 className="text-sm font-bold text-slate-700">End of Bookings List</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">You have reached the end of the matching bookings for this period.</p>
              </div>
            )}
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

        {/* ═══ Lazy Loaded Modals ═══ */}
        {showCancelModal && (
          <CancelBookingModal
            isOpen={!!showCancelModal}
            booking={showCancelModal}
            onClose={() => setShowCancelModal(null)}
            activePropertyId={activeProperty?.id}
          />
        )}
        
        {showDeleteModal && (
          <DeleteBookingModal
            isOpen={!!showDeleteModal}
            booking={showDeleteModal}
            onClose={() => setShowDeleteModal(null)}
            activePropertyId={activeProperty?.id}
            isReception={isReception}
          />
        )}
        
        {showRevertModal && (
          <RevertStatusModal
            isOpen={!!showRevertModal}
            revertData={showRevertModal}
            onClose={() => setShowRevertModal(null)}
            activePropertyId={activeProperty?.id}
          />
        )}

        {showPaymentModal && (
          <PaymentEntryModal
            isOpen={!!showPaymentModal}
            bookingId={showPaymentModal.id}
            onClose={() => setShowPaymentModal(null)}
          />
        )}

        {showInvoicePreviewModal && (
          <InvoicePreviewModal
            isOpen={!!showInvoicePreviewModal}
            bookingId={showInvoicePreviewModal.id}
            onClose={() => setShowInvoicePreviewModal(null)}
          />
        )}

        {/* Floating Bulk Action Bar for Bookings */}
        <BulkActionBar
          selectedCount={selectedIds.length}
          totalCount={bookings.length}
          onClearSelection={() => setSelectedIds([])}
          customActions={[
            {
              label: 'Export Selected to CSV',
              icon: <Download className="w-3.5 h-3.5 text-emerald-200" />,
              variant: 'emerald',
              onClick: handleExportCSV,
            },
          ]}
        />
      </div>
      {/* Assign Room Unit Modal */}
      <AssignRoomUnitModal
        isOpen={!!showAssignModal}
        onClose={() => setShowAssignModal(null)}
        booking={showAssignModal}
      />
    </div>
  );
}
