'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/lib/i18n';
import {
  Building2,
  X,
  Calendar,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowUpRight,
  TrendingUp,
  FileText,
  DollarSign,
  ShieldAlert,
  Edit3,
  Loader2,
  BarChart3,
  Moon,
} from 'lucide-react';
import { useAgencyDetailQuery, useUpdateAgencyMutation } from '../api/use-agencies';
import { calculateTac, FinancialDecimal } from '@/lib/utils/financial-math';

interface AgencyDetailsDrawerProps {
  agencyId: string;
  initialAgency?: any;
  propertyId: string;
  onClose: () => void;
  onEdit: (agency: any) => void;
  onSettle: (agency: any) => void;
}

export function AgencyDetailsDrawer({
  agencyId,
  initialAgency,
  propertyId,
  onClose,
  onEdit,
  onSettle,
}: AgencyDetailsDrawerProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'bookings' | 'settlements' | 'analytics'>('bookings');

  const { data, isLoading } = useAgencyDetailQuery(agencyId);
  const updateMutation = useUpdateAgencyMutation(propertyId);

  const agency = data?.agency || (data?.name ? data : null) || initialAgency || null;
  const bookings = data?.bookings || agency?.bookings || [];
  const settlements = data?.settlements || agency?.settlements || [];

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Exclude CANCELLED & NO_SHOW bookings from pending TAC financial totals according to Enterprise Rules
  const financialSummary = useMemo(() => {
    if (!agency) return {
      totalBookings: 0,
      grossRevenue: 0,
      totalTac: 0,
      pendingTac: 0,
      settledTac: 0,
      avgBookingValue: 0,
      avgTacPerBooking: 0,
      totalNightsReferred: 0,
      lastBookingDate: null,
      lastSettlementDate: null,
    };

    let validStays = 0;
    let grossDecimal = new FinancialDecimal(0);
    let totalTacDecimal = new FinancialDecimal(0);
    let totalNights = 0;
    let latestBookingTs = 0;
    let latestBookingDateStr: string | null = null;

    for (const b of bookings) {
      if (b.status === 'CANCELLED' || b.status === 'NO_SHOW') continue;
      validStays++;
      const bTotalDecimal = new FinancialDecimal(b.totalAmount || 0);
      const rate = Number(b.tacRateAtBooking || agency.defaultTacRate || 10);
      const { tacAmount } = calculateTac(bTotalDecimal.toNumber(), rate);
      const bTacDecimal = new FinancialDecimal(tacAmount);

      grossDecimal = grossDecimal.plus(bTotalDecimal);
      totalTacDecimal = totalTacDecimal.plus(bTacDecimal);

      // Night count calculation
      if (b.checkInDate && b.checkOutDate) {
        const cin = new Date(b.checkInDate).getTime();
        const cout = new Date(b.checkOutDate).getTime();
        if (cout > cin) {
          totalNights += Math.max(1, Math.ceil((cout - cin) / (86400 * 1000)));
        }
      }

      const bTs = new Date(b.createdAt || b.checkInDate).getTime();
      if (bTs > latestBookingTs) {
        latestBookingTs = bTs;
        latestBookingDateStr = b.checkInDate || b.createdAt;
      }
    }

    const settledTacDecimal = new FinancialDecimal(agency.tacPaid || 0);
    const pendingTacDecimal = grossDecimal.toNumber() > 0 ? grossDecimal.minus(settledTacDecimal) : new FinancialDecimal(0);

    const grossNum = grossDecimal.toNumber();
    const totalTacNum = totalTacDecimal.toNumber();
    const settledTacNum = settledTacDecimal.toNumber();
    const pendingTacNum = Math.max(0, totalTacNum - settledTacNum);

    const avgBookingValue = validStays > 0 ? Math.round(grossNum / validStays) : 0;
    const avgTacPerBooking = validStays > 0 ? Math.round(totalTacNum / validStays) : 0;

    let latestSettlementDateStr: string | null = null;
    if (settlements.length > 0) {
      const sortedSt = [...settlements].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      latestSettlementDateStr = sortedSt[0]?.createdAt || null;
    }

    return {
      totalBookings: validStays,
      grossRevenue: grossNum,
      totalTac: totalTacNum,
      pendingTac: pendingTacNum,
      settledTac: settledTacNum,
      avgBookingValue,
      avgTacPerBooking,
      totalNightsReferred: totalNights,
      lastBookingDate: latestBookingDateStr,
      lastSettlementDate: latestSettlementDateStr,
    };
  }, [agency, bookings, settlements]);

  const toggleActiveStatus = () => {
    if (!agency) return;
    const currentIsActive = agency.isActive !== false && agency.status !== 'INACTIVE';
    updateMutation.mutate({
      agencyId: agency.id,
      payload: { status: currentIsActive ? 'INACTIVE' : 'ACTIVE', isActive: !currentIsActive } as any,
    });
  };

  const isActive = agency ? agency.isActive !== false && agency.status !== 'INACTIVE' : true;

  if (typeof window === 'undefined') return null;

  const content = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-slideLeft cursor-default"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-white dark:bg-slate-950">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/40 dark:to-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black shrink-0 border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
              <Building2 className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-slate-900 dark:text-white truncate">
                  {agency?.name || 'Travel Agency Partner'}
                </h2>
                <span
                  className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                Default Commission: <span className="text-slate-800 dark:text-slate-200 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{agency?.defaultTacRate || 10}% TAC</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => agency && onEdit(agency)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
              title="Edit Agency"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && !agency ? (
            <div className="py-20 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              <span>Loading agency details...</span>
            </div>
          ) : (
            <>
              {/* Agency Information & Contact Bar */}
              <div className="p-5 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <span className="text-slate-400 font-bold text-[10px] uppercase flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Contact Person
                    </span>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate block">
                      {agency?.contactPerson || 'N/A'}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-slate-400 font-bold text-[10px] uppercase flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone
                    </span>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate block">
                      {agency?.phone || 'N/A'}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-slate-400 font-bold text-[10px] uppercase flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </span>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate block">
                      {agency?.email || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {isActive ? 'Active for new reservations' : 'Deactivated for new reservations'}
                  </span>
                  <button
                    onClick={toggleActiveStatus}
                    disabled={updateMutation.isPending}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      isActive
                        ? 'bg-white text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200'
                        : 'bg-white text-emerald-600 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200'
                    }`}
                  >
                    {isActive ? 'Deactivate Agency' : 'Activate Agency'}
                  </button>
                </div>
              </div>

              {/* Financial Metrics Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Total Stays</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{financialSummary.totalBookings}</p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Gross Revenue</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white">₹{financialSummary.grossRevenue.toLocaleString('en-IN')}</p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <TrendingUp className="w-16 h-16 text-amber-500" />
                  </div>
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 relative z-10">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Pending TAC</span>
                  </div>
                  <p className="text-xl font-black text-amber-600 dark:text-amber-400 relative z-10">₹{financialSummary.pendingTac.toLocaleString('en-IN')}</p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 relative z-10">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Settled TAC</span>
                  </div>
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 relative z-10">₹{financialSummary.settledTac.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Sub-Tabs: Booking History, Settlements, Analytics */}
              <div className="flex bg-slate-100/80 dark:bg-slate-800/50 p-1.5 rounded-xl gap-1">
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`flex-1 py-2.5 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'bookings'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-600'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 dark:hover:text-slate-300 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Referred Stays ({bookings.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('settlements')}
                  className={`flex-1 py-2.5 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'settlements'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-600'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 dark:hover:text-slate-300 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Settlements ({settlements.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex-1 py-2.5 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'analytics'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-600'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 dark:hover:text-slate-300 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </button>
              </div>

              {/* Tab 1: Referred Booking History */}
              {activeTab === 'bookings' && (
                <div className="space-y-3">
                  {bookings.length === 0 ? (
                    <div className="p-10 text-center bg-slate-50 dark:bg-slate-850/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center">
                      <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Referred Stays</h3>
                      <p className="text-xs text-slate-500 max-w-xs mt-1 text-center">This agency has not brought in any reservations yet.</p>
                    </div>
                  ) : (
                    bookings.map((b: any) => {
                      const bTotal = Number(b.totalAmount || 0);
                      const rate = Number(b.tacRateAtBooking || agency?.defaultTacRate || 10);
                      const { tacAmount } = calculateTac(bTotal, rate);
                      const isCancelled = b.status === 'CANCELLED' || b.status === 'NO_SHOW';

                      return (
                        <div
                          key={b.id}
                          className={`p-4 rounded-2xl border transition-all space-y-2 text-xs ${
                            isCancelled
                              ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 opacity-75'
                              : 'bg-white dark:bg-slate-850 border-slate-200/90 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono font-black text-slate-900 dark:text-white">
                                #{b.id.slice(0, 8).toUpperCase()}
                              </span>
                              <span className="font-bold text-slate-700 dark:text-slate-300 truncate">
                                {b.guest?.fullName || b.guestName || 'Guest'}
                              </span>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                isCancelled
                                  ? 'bg-rose-100 text-rose-800'
                                  : b.status === 'CHECKED_OUT'
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-500 font-medium text-[11px]">
                            <span>Stay: {b.checkInDate} &rarr; {b.checkOutDate}</span>
                            <span>Room: {b.roomType?.name || 'Accommodations'}</span>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-bold">
                            <span className="text-slate-600 dark:text-slate-400">Gross: ₹{bTotal.toLocaleString('en-IN')}</span>
                            <span className={isCancelled ? 'line-through text-slate-400' : 'text-emerald-700 dark:text-emerald-400 font-black'}>
                              TAC ({rate}%): ₹{tacAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 2: Settlement History Ledger */}
              {activeTab === 'settlements' && (
                <div className="space-y-3">
                  {settlements.length === 0 ? (
                    <div className="p-10 text-center bg-slate-50 dark:bg-slate-850/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center">
                      <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Settlements Yet</h3>
                      <p className="text-xs text-slate-500 max-w-xs mt-1 text-center">There are no commission payout records for this agency.</p>
                    </div>
                  ) : (
                    settlements.map((st: any, idx: number) => (
                      <div
                        key={st.id || idx}
                        className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between font-black text-emerald-900 dark:text-emerald-200">
                          <span>Settlement #{st.id ? st.id.slice(0, 8).toUpperCase() : idx + 1}</span>
                          <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                            + ₹{Number(st.amount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
                          <span>Date: {st.createdAt ? new Date(st.createdAt).toLocaleDateString('en-IN') : 'Recent'}</span>
                          <span>Processed By: {st.createdByUser?.email || 'Reception Staff / Manager'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Extended Analytics */}
              {activeTab === 'analytics' && (
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Booking Value</span>
                      <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                        ₹{financialSummary.avgBookingValue.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Avg TAC per Booking</span>
                      <p className="text-base font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                        ₹{financialSummary.avgTacPerBooking.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Total Room Nights</span>
                      <p className="text-base font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                        <Moon className="w-4 h-4 text-blue-500" />
                        {financialSummary.totalNightsReferred} Nights
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Last Booking Date</span>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                        {financialSummary.lastBookingDate || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950">
          {agency && (financialSummary.pendingTac > 0 ? (
            <button
              onClick={() => onSettle(agency)}
              className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4" />
              <span>Settle Outstanding TAC (₹{financialSummary.pendingTac.toLocaleString('en-IN')})</span>
            </button>
          ) : (
            <div className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              All Commissions Settled
            </div>
          ))}

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
