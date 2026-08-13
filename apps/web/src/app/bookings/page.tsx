'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { AppShell } from '@/components/app-shell';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { authService } from '@/features/auth';
import {
  useBookingsQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useRevertStatusMutation,
} from '@/features/bookings/api/use-bookings';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import { BookingFilters, BookingStatus, BookingChannel, Booking } from '@/features/bookings/types/booking.types';
import {
  Calendar,
  Plus,
  Search,
  Eye,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Clock,
  Ban,
  Plane,
  Phone,
  Globe,
  Users,
  BedDouble,
  CalendarDays,
  X,
  Download,
  CreditCard,
  FileText,
  MoreHorizontal,
  TrendingUp,
  UserCheck,
  Mail,
  MapPin,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════════
   1. DYNAMIC MODALS
   ══════════════════════════════════════════════════════════════════════════ */
const CancelBookingModal = dynamic(
  () => import('@/features/bookings/components/cancel-booking-modal').then((m) => m.CancelBookingModal),
  { ssr: false }
);
const DeleteBookingModal = dynamic(
  () => import('@/features/bookings/components/delete-booking-modal').then((m) => m.DeleteBookingModal),
  { ssr: false }
);
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

/* ══════════════════════════════════════════════════════════════════════════
   2. UTILITY HELPERS & CONFIGS
   ══════════════════════════════════════════════════════════════════════════ */
export function formatGuestName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ''))
    .join(' ');
}

export function getInitials(name: string): string {
  if (!name) return 'G';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLOR_PALETTES = [
  'bg-emerald-700 text-white',
  'bg-teal-700 text-white',
  'bg-blue-700 text-white',
  'bg-indigo-700 text-white',
  'bg-violet-700 text-white',
  'bg-amber-700 text-white',
  'bg-rose-700 text-white',
  'bg-cyan-700 text-white',
];

export function getAvatarColor(name: string): string {
  if (!name) return AVATAR_COLOR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_COLOR_PALETTES.length;
  return AVATAR_COLOR_PALETTES[idx];
}

export function extractUnitDisplay(b: any): string | null {
  const raw = b?.roomUnit?.unitNumber || b?.unitNumber || b?.roomNumber;
  if (!raw) return null;
  // Prevent long UUID strings from ever rendering in unit tag
  if (typeof raw === 'string' && (raw.length > 8 || raw.includes('-'))) {
    return null;
  }
  return String(raw);
}

const formatDateSpan = (inStr: string, outStr: string) => {
  if (!inStr || !outStr) return '—';
  const d1 = new Date(inStr);
  const d2 = new Date(outStr);
  const fmt1 = d1.toLocaleDateString('en-US', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
  const fmt2 = d2.toLocaleDateString('en-US', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt1} → ${fmt2}`;
};

const calculateNights = (inStr: string, outStr: string): number => {
  if (!inStr || !outStr) return 1;
  const d1 = new Date(inStr);
  const d2 = new Date(outStr);
  const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
};

const formatCurrency = (val: number | string): string => {
  const n = Number(val || 0);
  return `₹${n.toLocaleString('en-IN')}`;
};

const CHANNEL_CONFIG: Record<string, { label: string; icon: React.ElementType; style: string }> = {
  WALK_IN: {
    label: 'Walk-In',
    icon: Users,
    style: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
  PHONE: {
    label: 'Phone',
    icon: Phone,
    style: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  WEBSITE: {
    label: 'Website',
    icon: Globe,
    style: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  OTA: {
    label: 'OTA',
    icon: Globe,
    style: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  AGENCY: {
    label: 'Agency',
    icon: Plane,
    style: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; style: string }> = {
  CONFIRMED: {
    label: 'Confirmed',
    dot: 'bg-amber-500',
    style: 'bg-amber-50/90 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  CHECKED_IN: {
    label: 'Checked In',
    dot: 'bg-emerald-600',
    style: 'bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  CHECKED_OUT: {
    label: 'Checked Out',
    dot: 'bg-slate-500',
    style: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
  CANCELLED: {
    label: 'Cancelled',
    dot: 'bg-rose-500',
    style: 'bg-rose-50/90 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  NO_SHOW: {
    label: 'No Show',
    dot: 'bg-rose-500',
    style: 'bg-rose-50/90 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   3. MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */
export default function BookingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useToast();
  useActivePropertyQuery();
  const activeProperty = usePropertyStore((s) => s.activeProperty);

  const { data: profileData } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => authService.getProfile(),
    staleTime: 60000,
    retry: false,
  });

  const userRole = profileData?.user?.role || profileData?.data?.user?.role || 'OWNER';
  const isReception = userRole === 'RECEPTION_STAFF';

  // Filters state
  const [filters, setFilters] = useState<BookingFilters>({
    propertyId: activeProperty?.id,
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Selected for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Side Drawer detail state
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  // Action Menu dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Modals state
  const [showCancelModal, setShowCancelModal] = useState<Booking | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Booking | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<Booking | null>(null);
  const [showInvoicePreviewModal, setShowInvoicePreviewModal] = useState<Booking | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<Booking | null>(null);

  // Close open dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setOpenDropdownId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Fetch Bookings query
  const activeFilters = useMemo(
    () => ({
      ...filters,
      propertyId: activeProperty?.id || filters.propertyId,
      status: (statusFilter || undefined) as BookingStatus | undefined,
      channel: (channelFilter || undefined) as BookingChannel | undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      guestSearch: searchInput || undefined,
    }),
    [filters, activeProperty?.id, statusFilter, channelFilter, fromDate, toDate, searchInput]
  );

  const { data, isLoading, refetch } = useBookingsQuery(activeFilters);
  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();
  const revertMutation = useRevertStatusMutation();

  const resData: any = data;
  const bookings: Booking[] = useMemo(() => {
    if (!resData) return [];
    if (Array.isArray(resData)) return resData;
    if (Array.isArray(resData?.bookings)) return resData.bookings;
    if (Array.isArray(resData?.data?.bookings)) return resData.data.bookings;
    if (Array.isArray(resData?.data)) return resData.data;
    return [];
  }, [resData]);

  const totalBookingsCount = resData?.pagination?.total || bookings.length;
  const pageSize = filters.limit || 10;
  const currentPage = filters.page || 1;
  const totalPages = Math.max(1, Math.ceil(totalBookingsCount / pageSize));

  // ─── KPI Overview Metrics Summary ───
  const summaryKPIs = useMemo(() => {
    let checkedIn = 0;
    let confirmed = 0;
    let checkedOut = 0;
    let cancelled = 0;
    let totalRevenue = 0;

    bookings.forEach((b) => {
      const st = (b.status || '').toUpperCase();
      if (st === 'CHECKED_IN') checkedIn += 1;
      else if (st === 'CONFIRMED') confirmed += 1;
      else if (st === 'CHECKED_OUT') checkedOut += 1;
      else if (st === 'CANCELLED' || st === 'NO_SHOW') cancelled += 1;

      totalRevenue += Number(b.totalAmount || 0);
    });

    const total = bookings.length || 1;
    return {
      total: totalBookingsCount,
      checkedIn,
      checkedInPct: ((checkedIn / total) * 100).toFixed(1),
      confirmed,
      confirmedPct: ((confirmed / total) * 100).toFixed(1),
      checkedOut,
      checkedOutPct: ((checkedOut / total) * 100).toFixed(1),
      cancelled,
      cancelledPct: ((cancelled / total) * 100).toFixed(1),
      totalRevenue,
    };
  }, [bookings, totalBookingsCount]);

  // ─── Selection Handlers ───
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(bookings.map((b) => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // ─── Check-In Handler ───
  const handleCheckIn = (b: Booking, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const hasUnit = extractUnitDisplay(b);

    if (!hasUnit) {
      setShowAssignModal(b);
      return;
    }

    checkInMutation.mutate(b.id, {
      onSuccess: () => {
        toast.showUndoToast(
          'Guest checked in successfully!',
          () => {
            revertMutation.mutate({ id: b.id, status: 'CONFIRMED' });
            toast.info('Check-in status reverted to Confirmed', 'Reverted');
          },
          'Check-In Complete'
        );
      },
      onError: () => {
        toast.warning('Please assign a room unit to complete check-in.', 'Room Unit Required');
        setShowAssignModal(b);
      },
    });
  };

  // ─── Check-Out Handler ───
  const handleCheckOut = (b: Booking, e?: React.MouseEvent) => {
    e?.stopPropagation();
    checkOutMutation.mutate(b.id, {
      onSuccess: () => {
        toast.showUndoToast(
          'Guest checked out successfully!',
          () => {
            revertMutation.mutate({ id: b.id, status: 'CHECKED_IN' });
            toast.info('Check-out status reverted to Checked In', 'Reverted');
          },
          'Check-Out Complete'
        );
      },
    });
  };

  // ─── CSV Export ───
  const handleExportCSV = () => {
    const exportData = selectedIds.length > 0 ? bookings.filter((b) => selectedIds.includes(b.id)) : bookings;
    if (exportData.length === 0) return;

    const csvLines = [
      'Booking ID,Guest Name,Phone,Room Type,Room Unit,Channel,Status,Check-In,Check-Out,Total Amount,Paid,Balance Due',
      ...exportData.map(
        (b) =>
          `"${b.id}","${b.guest?.fullName || 'Guest'}","${b.guest?.phone || ''}","${b.roomType?.name || ''}","${
            extractUnitDisplay(b) || ''
          }","${b.channel}","${b.status}","${b.checkInDate}","${b.checkOutDate}","${b.totalAmount}","${
            b.advancePaid || 0
          }","${b.balanceDue || 0}"`
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
    toast.success(`Exported ${exportData.length} reservations to CSV!`, 'Export Completed');
  };

  return (
    <AppShell
      sectionIcon={Calendar}
      sectionTitle={t('sectionBookingManagement')}
      sectionDescription={t('sectionBookingManagementDesc') || 'Manage all reservations and bookings'}
      sectionTabs={[
        { label: t('tabReservations') || 'Reservations', icon: Calendar, count: totalBookingsCount, href: '/bookings', isActive: true },
        { label: t('tabNewBooking') || 'New Booking', icon: Plus, href: '/bookings/new' },
      ]}
      sectionActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/bookings/new')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newBooking') || 'New Booking'}</span>
          </button>
        </div>
      }
      layout="wide"
    >
      <div className="space-y-4 w-full">
        {/* ══════════════════════════════════════════════════════════════════
           1. COMPACT MODERN BOOKING KPI OVERVIEW STRIP (Matching Screenshot)
           ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-3.5 flex items-center justify-between gap-2 overflow-x-auto divide-x divide-slate-100 dark:divide-slate-800">
          {/* 1. All Reservations */}
          <div className="flex items-center gap-3 px-3 min-w-[150px]">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">All Reservations</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{summaryKPIs.total}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">Total bookings</p>
            </div>
          </div>

          {/* 2. Checked-in */}
          <div className="flex items-center gap-3 px-3 min-w-[140px]">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Checked-in</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-blue-700 dark:text-blue-400 tabular-nums">{summaryKPIs.checkedIn}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">{summaryKPIs.checkedInPct}% of total</p>
            </div>
          </div>

          {/* 3. Confirmed */}
          <div className="flex items-center gap-3 px-3 min-w-[140px]">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Confirmed</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-amber-800 dark:text-amber-300 tabular-nums">{summaryKPIs.confirmed}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">{summaryKPIs.confirmedPct}% of total</p>
            </div>
          </div>

          {/* 4. Checked-out */}
          <div className="flex items-center gap-3 px-3 min-w-[140px]">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Checked-out</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-slate-800 dark:text-slate-200 tabular-nums">{summaryKPIs.checkedOut}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">{summaryKPIs.checkedOutPct}% of total</p>
            </div>
          </div>

          {/* 5. Cancelled */}
          <div className="flex items-center gap-3 px-3 min-w-[140px]">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
              <Ban className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Cancelled</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-rose-700 dark:text-rose-400 tabular-nums">{summaryKPIs.cancelled}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">{summaryKPIs.cancelledPct}% of total</p>
            </div>
          </div>

          {/* 6. Total Revenue */}
          <div className="flex items-center gap-3 px-3 min-w-[170px]">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Revenue</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-emerald-800 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(summaryKPIs.totalRevenue)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">This period</p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
           2. SMART SEARCH & FILTER BAR (Matching Reference)
           ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-3 flex items-center justify-between gap-3 flex-wrap">
          {/* Left: Prominent Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by guest name, phone, email or booking ID..."
              className="w-full pl-8 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Right: Secondary Dropdowns & Date Range */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Channel Dropdown */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="">All Channels</option>
              <option value="WALK_IN">Walk-in</option>
              <option value="WEBSITE">Website</option>
              <option value="OTA">OTA (Booking.com / Agoda / Expedia)</option>
              <option value="AGENCY">Travel Agency</option>
              <option value="PHONE">Phone</option>
            </select>

            {/* Date Range Selectors */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              />
              <span className="text-slate-400 font-bold">→</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Clear Filters Button */}
            {(searchInput || statusFilter || channelFilter || fromDate || toDate) && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setStatusFilter('');
                  setChannelFilter('');
                  setFromDate('');
                  setToDate('');
                }}
                className="px-2 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
           3. RESERVATION WORKSPACE TABLE
           ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3.5 pl-4 w-[4%] text-center">
                  <input
                    type="checkbox"
                    checked={bookings.length > 0 && selectedIds.length === bookings.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3.5 w-[25%]">GUEST INFORMATION</th>
                <th className="py-3 px-3.5 w-[24%]">ROOM & DATES</th>
                <th className="py-3 px-3.5 w-[14%]">CHANNEL</th>
                <th className="py-3 px-3.5 w-[13%]">STATUS</th>
                <th className="py-3 px-3.5 w-[10%]">TOTAL AMOUNT</th>
                <th className="py-3 px-3.5 pr-4 text-right w-[10%]">ACTIONS</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 font-bold text-xs">
                    Loading reservations...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-xs text-slate-700 dark:text-slate-300">No Reservations Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try clearing filters or search queries</p>
                  </td>
                </tr>
              ) : (
                bookings.map((b, idx) => {
                  const guestName = formatGuestName(b.guest?.fullName || (b as any).guestName || 'Guest');
                  const initials = getInitials(guestName);
                  const avatarColor = getAvatarColor(guestName);
                  const nights = calculateNights(b.checkInDate, b.checkOutDate);
                  const isSelected = selectedIds.includes(b.id);
                  const st = (b.status || 'CONFIRMED').toUpperCase();
                  const ch = (b.channel || 'WALK_IN').toUpperCase();
                  const statusObj = STATUS_CONFIG[st] || STATUS_CONFIG.CONFIRMED;
                  const channelObj = CHANNEL_CONFIG[ch] || CHANNEL_CONFIG.WALK_IN;
                  const ChannelIcon = channelObj.icon;
                  const unitDisplay = extractUnitDisplay(b);
                  const balanceDue = Number(b.balanceDue || 0);
                  const bookingRef = `#BK-10${idx + 1}`;

                  return (
                    <tr
                      key={b.id}
                      onClick={() => setDetailBooking(b)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* 1. Checkbox */}
                      <td
                        className="py-3 px-3.5 pl-4 text-center align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectOne(b.id, e as any)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* 2. Guest Information */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Modern Soft Avatar Circle */}
                          <div
                            className={`w-8 h-8 rounded-full ${avatarColor} font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs ring-2 ring-white dark:ring-slate-800`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate block">
                              {guestName}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium truncate mt-0.5">
                              <span>{b.guest?.phone || '+1 202-555-0143'}</span>
                              <span>•</span>
                              <span className="font-mono text-[9px] text-slate-400 font-semibold">{bookingRef}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Room & Dates */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                            <span>{b.roomType?.name || 'Deluxe Ocean View'}</span>
                            {unitDisplay && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                Room {unitDisplay}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium mt-0.5">
                            <CalendarDays className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{formatDateSpan(b.checkInDate, b.checkOutDate)}</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-600 dark:text-slate-300 shrink-0">
                              {nights}N
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 4. Channel Badge */}
                      <td className="py-3 px-3.5 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${channelObj.style}`}
                        >
                          <ChannelIcon className="w-3 h-3 shrink-0" />
                          <span>{channelObj.label}</span>
                        </span>
                      </td>

                      {/* 5. Status Pill & Due Tag */}
                      <td className="py-3 px-3.5 align-middle">
                        <div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusObj.style}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusObj.dot}`} />
                            <span>{statusObj.label}</span>
                          </span>

                          {balanceDue > 0 && (
                            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                              Due: {formatCurrency(balanceDue)}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 6. Total Amount */}
                      <td className="py-3 px-3.5 align-middle font-bold text-xs text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(b.totalAmount || 0)}
                      </td>

                      {/* 7. Context-Aware Action Buttons */}
                      <td
                        className="py-3 px-3.5 pr-4 align-middle text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Context Action: Check-in */}
                          {st === 'CONFIRMED' && (
                            <button
                              onClick={(e) => handleCheckIn(b, e)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 hover:text-white text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <LogIn className="w-3 h-3" />
                              <span>Check In</span>
                            </button>
                          )}

                          {/* Context Action: Check-out */}
                          {st === 'CHECKED_IN' && (
                            <button
                              onClick={(e) => handleCheckOut(b, e)}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                            >
                              <LogOut className="w-3 h-3" />
                              <span>Check Out</span>
                            </button>
                          )}

                          {/* Context Action: View */}
                          {(st === 'CHECKED_OUT' || st === 'CANCELLED' || st === 'NO_SHOW') && (
                            <button
                              onClick={() => setDetailBooking(b)}
                              className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                          )}

                          {/* Quick Pay Button if Balance Due */}
                          {balanceDue > 0 && st !== 'CANCELLED' && (
                            <button
                              onClick={() => setShowPaymentModal(b)}
                              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold transition-all cursor-pointer shrink-0"
                            >
                              Pay
                            </button>
                          )}

                          {/* Quick Invoice Button if Checked Out */}
                          {st === 'CHECKED_OUT' && (
                            <button
                              onClick={() => setShowInvoicePreviewModal(b)}
                              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold transition-all cursor-pointer shrink-0"
                            >
                              Invoice
                            </button>
                          )}

                          {/* More Options Dropdown Menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === b.id ? null : b.id);
                              }}
                              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>

                            {openDropdownId === b.id && (
                              <div className="absolute right-0 top-8 z-50 w-44 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl py-1 text-xs text-left animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={() => {
                                    setDetailBooking(b);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-semibold cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                                  <span>View Details</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setShowAssignModal(b);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-semibold cursor-pointer"
                                >
                                  <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Assign Room</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setShowPaymentModal(b);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-semibold cursor-pointer"
                                >
                                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Record Payment</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setShowInvoicePreviewModal(b);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-semibold cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                                  <span>View Invoice</span>
                                </button>

                                {st !== 'CANCELLED' && (
                                  <button
                                    onClick={() => {
                                      setShowCancelModal(b);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-bold cursor-pointer border-t border-slate-100 dark:border-slate-800 mt-1"
                                  >
                                    <Ban className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Cancel Booking</span>
                                  </button>
                                )}
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

          {/* ══════════════════════════════════════════════════════════════════
             4. FOOTER PAGINATION & CONTROLS (Matching Screenshot)
             ══════════════════════════════════════════════════════════════════ */}
          <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-850/90 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div>
              Showing{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {Math.min((currentPage - 1) * pageSize + 1, totalBookingsCount)} to{' '}
                {Math.min(currentPage * pageSize, totalBookingsCount)}
              </strong>{' '}
              of <strong className="text-slate-800 dark:text-slate-200">{totalBookingsCount}</strong> reservations
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
                  disabled={currentPage === 1}
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setFilters((f) => ({ ...f, page: pageNum }))}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-emerald-800 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 5 && <span className="text-slate-400 px-0.5">...</span>}
                {totalPages > 5 && (
                  <button
                    onClick={() => setFilters((f) => ({ ...f, page: totalPages }))}
                    className={`w-7 h-7 rounded-lg text-xs font-bold ${
                      currentPage === totalPages
                        ? 'bg-emerald-800 text-white'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700'
                    }`}
                  >
                    {totalPages}
                  </button>
                )}

                <button
                  onClick={() => setFilters((f) => ({ ...f, page: Math.min(totalPages, (f.page || 1) + 1) }))}
                  disabled={currentPage === totalPages}
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Page Size Selector */}
              <select
                value={pageSize}
                onChange={(e) => setFilters((f) => ({ ...f, limit: Number(e.target.value), page: 1 }))}
                className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
           5. BULK ACTION BAR (When 1+ rows selected)
           ══════════════════════════════════════════════════════════════════ */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-200">
            <span className="text-xs font-bold text-slate-200">
              <strong className="text-emerald-400 font-black">{selectedIds.length}</strong> reservations selected
            </span>

            <div className="h-4 w-px bg-slate-700" />

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
           6. RESERVATION DETAIL SIDE-OVER PANEL / DRAWER
           ══════════════════════════════════════════════════════════════════ */}
        {detailBooking && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-150">
            {/* Backdrop */}
            <div
              onClick={() => setDetailBooking(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
            />

            {/* Slide-over Container */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-850/90">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full ${getAvatarColor(
                      detailBooking.guest?.fullName || 'Guest'
                    )} font-bold text-sm flex items-center justify-center shadow-2xs ring-2 ring-white dark:ring-slate-800`}
                  >
                    {getInitials(detailBooking.guest?.fullName || 'Guest')}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {formatGuestName(detailBooking.guest?.fullName || 'Guest')}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400">
                      Booking #BK-{detailBooking.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setDetailBooking(null)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                {/* 1. Guest Information Box */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Guest Information</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{detailBooking.guest?.phone || '+1 202-555-0143'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{detailBooking.guest?.email || 'guest@example.com'}</span>
                    </div>
                    {detailBooking.guest?.nationality && (
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{detailBooking.guest.nationality}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Stay Timeline Details */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stay & Room Details</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Room Category</span>
                      <strong className="text-slate-900 dark:text-white font-bold block truncate">
                        {detailBooking.roomType?.name || 'Deluxe Ocean View'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Room Unit</span>
                      <strong className="text-slate-900 dark:text-white font-bold block">
                        {extractUnitDisplay(detailBooking) ? `Room ${extractUnitDisplay(detailBooking)}` : 'Unassigned'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Check-In Date</span>
                      <strong className="text-slate-900 dark:text-white font-bold block">
                        {new Date(detailBooking.checkInDate).toLocaleDateString('en-US', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Check-Out Date</span>
                      <strong className="text-slate-900 dark:text-white font-bold block">
                        {new Date(detailBooking.checkOutDate).toLocaleDateString('en-US', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' })}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 3. Financial Breakdown */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment & Invoicing</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Total Amount</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(detailBooking.totalAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Advance Paid</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(detailBooking.advancePaid || 0)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                      <span>Balance Due</span>
                      <span className={Number(detailBooking.balanceDue || 0) > 0 ? 'text-rose-600 font-black' : 'text-emerald-600'}>
                        {formatCurrency(detailBooking.balanceDue || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850/90 flex items-center justify-between gap-2">
                <button
                  onClick={() => setShowInvoicePreviewModal(detailBooking)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Invoice</span>
                </button>

                <button
                  onClick={() => setShowPaymentModal(detailBooking)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record Pay</span>
                </button>

                {detailBooking.status === 'CONFIRMED' && (
                  <button
                    onClick={() => {
                      handleCheckIn(detailBooking);
                      setDetailBooking(null);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Check In</span>
                  </button>
                )}

                {detailBooking.status === 'CHECKED_IN' && (
                  <button
                    onClick={() => {
                      handleCheckOut(detailBooking);
                      setDetailBooking(null);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Check Out</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
           7. MODAL DIALOGS (Existing Functional Integrations)
           ══════════════════════════════════════════════════════════════════ */}
        {showCancelModal && (
          <CancelBookingModal
            isOpen={true}
            booking={showCancelModal}
            onClose={() => setShowCancelModal(null)}
            activePropertyId={activeProperty?.id}
          />
        )}

        {showDeleteModal && (
          <DeleteBookingModal
            isOpen={true}
            booking={showDeleteModal}
            onClose={() => setShowDeleteModal(null)}
            activePropertyId={activeProperty?.id}
            isReception={isReception}
          />
        )}

        {showPaymentModal && (
          <PaymentEntryModal
            isOpen={true}
            bookingId={showPaymentModal.id}
            booking={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(null);
              refetch();
            }}
          />
        )}

        {showInvoicePreviewModal && (
          <InvoicePreviewModal
            isOpen={true}
            bookingId={showInvoicePreviewModal.id}
            bookingData={showInvoicePreviewModal}
            onClose={() => setShowInvoicePreviewModal(null)}
          />
        )}

        {showAssignModal && (
          <AssignRoomUnitModal
            isOpen={true}
            booking={showAssignModal}
            onClose={() => setShowAssignModal(null)}
            onSuccess={() => {
              toast.success('Room unit allocated successfully.', 'Unit Assigned');
              setShowAssignModal(null);
              refetch();
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
