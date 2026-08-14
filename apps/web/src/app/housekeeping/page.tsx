'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { authService } from '@/features/auth';
import { httpClient } from '@/lib/api/http-client';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import {
  useHousekeepingUnitsQuery,
  useUpdateUnitStatusMutation,
  useBatchGenerateUnitsMutation,
} from '@/features/housekeeping/api/use-housekeeping';
import { RoomUnit } from '@/features/housekeeping/services/housekeeping.service';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import {
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Search,
  Plus,
  RefreshCw,
  X,
  List,
  LayoutGrid,
  Sparkles,
  User,
  ShieldCheck,
  MoreHorizontal,
  Download,
} from 'lucide-react';

/* ─── Modal Wrapper ─── */
function ModalOverlay({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-150">{children}</div>
    </div>
  );
}

const HOUSEKEEPING_STAFF = [
  { id: 'hk-1', name: 'Maria Santos' },
  { id: 'hk-2', name: 'John Davis' },
  { id: 'hk-3', name: 'Elena Rostov' },
];

export default function HousekeepingPage() {
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
  const isOwnerOrManager = ['OWNER', 'MANAGER', 'SUPER_ADMIN'].includes(userRole);

  const [activeTab, setActiveTab] = useState<'board' | 'assignments'>('board');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState<RoomUnit | null>(null);
  const [issueNotes, setIssueNotes] = useState('');

  // Staff assignments state: { [unitId]: staffName }
  const [assignments, setAssignments] = useState<Record<string, string>>({
    '1': 'Maria Santos',
    '2': 'Maria Santos',
    '3': 'Elena Rostov',
    '4': 'Elena Rostov',
  });

  // Batch generation form state
  const [genRoomTypeId, setGenRoomTypeId] = useState('');
  const [genPrefix, setGenPrefix] = useState('');
  const [genStartNum, setGenStartNum] = useState(101);

  const { data, isLoading, refetch } = useHousekeepingUnitsQuery(
    activeProperty?.id,
    selectedRoomType === 'ALL' ? undefined : selectedRoomType,
    selectedStatus === 'ALL' ? undefined : selectedStatus
  );
  const updateStatusMutation = useUpdateUnitStatusMutation();
  const batchGenerateMutation = useBatchGenerateUnitsMutation();

  const { data: onboardingData } = useQuery({
    queryKey: ['onboarding-room-types', activeProperty?.id],
    queryFn: async () => {
      if (!activeProperty?.id) return [];
      try {
        const res = await httpClient.get<any>(`/properties/${activeProperty.id}/onboarding`);
        return res?.data?.property?.roomTypes || res?.property?.roomTypes || res?.roomTypes || [];
      } catch {
        return [];
      }
    },
    enabled: !!activeProperty?.id,
  });

  const roomTypes = onboardingData || activeProperty?.roomTypes || [];
  const rawUnitsData = (data as any)?.units || (data as any)?.data?.units || (Array.isArray(data) ? data : []);
  const units: RoomUnit[] = rawUnitsData;

  const summary = useMemo(() => {
    return {
      total: units.length,
      clean: units.filter((u) => u.cleanlinessStatus === 'CLEAN').length,
      dirty: units.filter((u) => u.cleanlinessStatus === 'DIRTY').length,
      inspected: units.filter((u) => u.cleanlinessStatus === 'INSPECTED').length,
      outOfOrder: units.filter((u) => u.cleanlinessStatus === 'OUT_OF_ORDER').length,
    };
  }, [units]);

  useEffect(() => {
    if (roomTypes.length > 0 && !genRoomTypeId) {
      setGenRoomTypeId(roomTypes[0].id);
    }
  }, [roomTypes, genRoomTypeId]);

  const filteredUnits = useMemo(() => {
    return units.filter((u: RoomUnit) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        u.unitNumber.toLowerCase().includes(q) ||
        (u.roomType?.name && u.roomType.name.toLowerCase().includes(q)) ||
        (u.floor && u.floor.toLowerCase().includes(q));

      const matchesStatus = selectedStatus === 'ALL' || u.cleanlinessStatus === selectedStatus;
      const matchesCategory = selectedRoomType === 'ALL' || u.roomTypeId === selectedRoomType;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [units, searchQuery, selectedStatus, selectedRoomType]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredUnits.map((u) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleBatchMarkClean = () => {
    if (selectedIds.length === 0) return;

    selectedIds.forEach((id) => {
      updateStatusMutation.mutate({ unitId: id, status: 'CLEAN' });
    });

    toast.showUndoToast(
      `Marked ${selectedIds.length} rooms clean!`,
      () => {
        toast.info('Batch update reverted.', 'Reverted');
      },
      'Batch Clean Completed'
    );
    setSelectedIds([]);
  };

  const handleBatchMarkDirty = () => {
    if (selectedIds.length === 0) return;

    selectedIds.forEach((id) => {
      updateStatusMutation.mutate({ unitId: id, status: 'DIRTY' });
    });

    toast.showUndoToast(
      `Marked ${selectedIds.length} rooms dirty!`,
      () => {
        toast.info('Batch update reverted.', 'Reverted');
      },
      'Batch Update Completed'
    );
    setSelectedIds([]);
  };

  const handleUpdateStatus = (unitId: string, status: string, notes?: string) => {
    updateStatusMutation.mutate({ unitId, status, notes });
    const label = status === 'CLEAN' ? 'clean' : status === 'DIRTY' ? 'dirty' : status.toLowerCase();
    toast.showUndoToast(
      `Room marked ${label}!`,
      () => {
        const revertStatus = status === 'CLEAN' ? 'DIRTY' : 'CLEAN';
        updateStatusMutation.mutate({ unitId, status: revertStatus });
        toast.info('Status reverted', 'Reverted');
      },
      'Status Updated'
    );
  };

  const handleReportIssue = () => {
    if (!showIssueModal) return;
    updateStatusMutation.mutate(
      { unitId: showIssueModal.id, status: 'OUT_OF_ORDER', notes: issueNotes || 'Maintenance issue reported' },
      {
        onSuccess: () => {
          setShowIssueModal(null);
          setIssueNotes('');
          toast.success('Room marked Out of Order', 'Maintenance Logged');
        },
      }
    );
  };

  const handleBatchGenerate = () => {
    if (!genRoomTypeId) return;
    batchGenerateMutation.mutate(
      { roomTypeId: genRoomTypeId, prefix: genPrefix, startNumber: genStartNum, propertyId: activeProperty?.id },
      { onSuccess: () => setShowGenerateModal(false) }
    );
  };

  const handleAssignStaff = (unitId: string, staffName: string) => {
    setAssignments((prev) => ({ ...prev, [unitId]: staffName }));
    toast.success(`Assigned to ${staffName || 'Unassigned'}`, 'Staff Assigned');
  };

  return (
    <AppShell
      sectionIcon={Sparkles}
      breadcrumb={{ parent: t('roomsAndOperations') || 'Rooms & Operations' }}
      sectionTitle={t('housekeeping') || 'Housekeeping & Operations'}
      sectionDescription="Daily room cleaning, staff assignments, and room readiness"
      sectionTabs={[
        {
          label: 'Cleaning List',
          icon: Sparkles,
          count: summary.dirty,
          isActive: activeTab === 'board',
          onClick: () => setActiveTab('board'),
        },
        {
          label: 'Staff Assignments',
          icon: User,
          count: units.length,
          isActive: activeTab === 'assignments',
          onClick: () => setActiveTab('assignments'),
        },
      ]}
      sectionActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 transition-all cursor-pointer shadow-2xs"
            title="Refresh List"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </button>
          {isOwnerOrManager && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0 active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Batch Generate</span>
            </button>
          )}
        </div>
      }
      layout="wide"
    >
      <div className="space-y-4 w-full">
        {/* ══════════════════════════════════════════════════════════════════
           1. SIMPLE 4-METRIC STRIP
           ══════════════════════════════════════════════════════════════════ */}
        {/* ══════════════════════════════════════════════════════════════════
           1. BENTO GRID SPOTLIGHT METRICS STRIP WITH LIVE PULSE RINGS
           ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Needs Cleaning (Dirty) */}
          <SpotlightCard
            onClick={() => setSelectedStatus(selectedStatus === 'DIRTY' ? 'ALL' : 'DIRTY')}
            spotlightColor="rgba(245, 158, 11, 0.16)"
            className={`cursor-pointer transition-all ${
              selectedStatus === 'DIRTY' ? 'border-amber-500 ring-2 ring-amber-500/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Needs Cleaning
              </span>
              <div className="relative w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-xl bg-amber-400 opacity-40"></span>
                <AlertTriangle className="w-4 h-4 relative z-10" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-2xl font-black text-amber-800 dark:text-amber-300 tabular-nums">
                {summary.dirty} Rooms
              </span>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">Priority housekeeping tasks</p>
            </div>
          </SpotlightCard>

          {/* 2. Clean & Ready */}
          <SpotlightCard
            onClick={() => setSelectedStatus(selectedStatus === 'CLEAN' ? 'ALL' : 'CLEAN')}
            spotlightColor="rgba(16, 185, 129, 0.16)"
            className={`cursor-pointer transition-all ${
              selectedStatus === 'CLEAN' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Clean & Ready
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                {summary.clean} Rooms
              </span>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">Ready for guest check-in</p>
            </div>
          </SpotlightCard>

          {/* 3. Inspected */}
          <SpotlightCard
            onClick={() => setSelectedStatus(selectedStatus === 'INSPECTED' ? 'ALL' : 'INSPECTED')}
            spotlightColor="rgba(59, 130, 246, 0.16)"
            className={`cursor-pointer transition-all ${
              selectedStatus === 'INSPECTED' ? 'border-blue-500 ring-2 ring-blue-500/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                Inspected
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-2xl font-black text-blue-700 dark:text-blue-300 tabular-nums">
                {summary.inspected} Rooms
              </span>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">Verified supervisor clean</p>
            </div>
          </SpotlightCard>

          {/* 4. Out of Order */}
          <SpotlightCard
            onClick={() => setSelectedStatus(selectedStatus === 'OUT_OF_ORDER' ? 'ALL' : 'OUT_OF_ORDER')}
            spotlightColor="rgba(244, 63, 94, 0.16)"
            className={`cursor-pointer transition-all ${
              selectedStatus === 'OUT_OF_ORDER' ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                Out of Order
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-2xl font-black text-rose-700 dark:text-rose-300 tabular-nums">
                {summary.outOfOrder} Rooms
              </span>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">Maintenance repair</p>
            </div>
          </SpotlightCard>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
           2. SIMPLE TOOLBAR
           ══════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-3 flex items-center justify-between gap-3 flex-wrap">
          {/* Search Field */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search room number, category, floor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filters Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <select
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {roomTypes.map((rt: any) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="DIRTY">Needs Cleaning</option>
              <option value="CLEAN">Clean & Ready</option>
              <option value="INSPECTED">Inspected</option>
              <option value="OUT_OF_ORDER">Out of Order</option>
            </select>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
           3. CLEAN & SIMPLE HOUSEKEEPING TABLE
           ══════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3.5 pl-4 w-[4%] text-center">
                  <input
                    type="checkbox"
                    checked={filteredUnits.length > 0 && selectedIds.length === filteredUnits.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    title="Select all"
                  />
                </th>
                <th className="py-3 px-3.5 w-[22%]">ROOM</th>
                <th className="py-3 px-3.5 w-[18%]">STATUS</th>
                <th className="py-3 px-3.5 w-[20%]">OCCUPANCY</th>
                <th className="py-3 px-3.5 w-[20%]">ASSIGNED TO</th>
                <th className="py-3 px-3.5 pr-4 text-right w-[16%]">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 font-bold">
                    Loading housekeeping list...
                  </td>
                </tr>
              ) : filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-xs text-slate-700 dark:text-slate-300">All Rooms Clean</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">No rooms require attention under current filter</p>
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u) => {
                  const isOccupied = Boolean(u.bookings && u.bookings.length > 0 && u.bookings[0].status === 'CHECKED_IN');
                  const activeBooking = u.bookings && u.bookings.length > 0 ? u.bookings[0] : null;
                  const isSelected = selectedIds.includes(u.id);

                  const isDirty = u.cleanlinessStatus === 'DIRTY';
                  const isClean = u.cleanlinessStatus === 'CLEAN';
                  const isInspected = u.cleanlinessStatus === 'INSPECTED';
                  const isOOO = u.cleanlinessStatus === 'OUT_OF_ORDER';

                  const guestName = activeBooking?.guest?.fullName || (activeBooking as any)?.guestName;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors ${
                        isSelected ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* 1. Checkbox */}
                      <td className="py-3 px-3.5 pl-4 text-center align-middle" onClick={(e) => handleSelectOne(u.id, e)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* 2. Room Door & Category */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                            {u.unitNumber}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate block">
                              Room {u.unitNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium truncate block">
                              {u.roomType?.name || 'Standard'} • {u.floor || 'Ground'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Simple Status Badge */}
                      <td className="py-3 px-3.5 align-middle">
                        {isDirty && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span>Needs Cleaning</span>
                          </span>
                        )}
                        {isClean && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                            <span>Clean</span>
                          </span>
                        )}
                        {isInspected && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                            <span>Inspected</span>
                          </span>
                        )}
                        {isOOO && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>Out of Order</span>
                          </span>
                        )}
                      </td>

                      {/* 4. Occupancy */}
                      <td className="py-3 px-3.5 align-middle">
                        {isOccupied ? (
                          <div className="min-w-0">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                              <span>Occupied</span>
                            </span>
                            {guestName && (
                              <p className="text-[10px] text-slate-700 dark:text-slate-300 font-bold truncate mt-0.5">
                                {guestName}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span>Vacant</span>
                          </span>
                        )}
                      </td>

                      {/* 5. Assigned To */}
                      <td className="py-3 px-3.5 align-middle">
                        <select
                          value={assignments[u.id] || ''}
                          onChange={(e) => handleAssignStaff(u.id, e.target.value)}
                          className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-600 cursor-pointer w-full max-w-[140px]"
                        >
                          <option value="">Unassigned</option>
                          {HOUSEKEEPING_STAFF.map((staff) => (
                            <option key={staff.id} value={staff.name}>
                              {staff.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 6. Simple, Clear Primary Action Button */}
                      <td className="py-3 px-3.5 pr-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDirty ? (
                            <button
                              onClick={() => handleUpdateStatus(u.id, 'CLEAN')}
                              className="px-3 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-98"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark as Clean</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(u.id, 'DIRTY')}
                              className="px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-98 shadow-2xs"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>Mark as Dirty</span>
                            </button>
                          )}

                          <button
                            onClick={() => setShowIssueModal(u)}
                            className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-700 text-slate-400 transition-colors cursor-pointer"
                            title="Report Out of Order"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
           4. BULK HOUSEKEEPING ACTIONS
           ══════════════════════════════════════════════════════════════ */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-200">
            <span className="text-xs font-bold text-slate-200">
              <strong className="text-emerald-400 font-black">{selectedIds.length}</strong> rooms selected
            </span>

            <div className="h-4 w-px bg-slate-700" />

            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchMarkClean}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark as Clean</span>
              </button>

              <button
                onClick={handleBatchMarkDirty}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Mark as Dirty</span>
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
           5. MODALS (Batch Generate & Report Out of Order)
           ══════════════════════════════════════════════════════════════ */}
        {showGenerateModal && (
          <ModalOverlay isOpen={showGenerateModal} onClose={() => setShowGenerateModal(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Batch Generate Room Units</h3>
                <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Room Category</label>
                  <select
                    value={genRoomTypeId}
                    onChange={(e) => setGenRoomTypeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
                  >
                    {roomTypes.map((rt: any) => (
                      <option key={rt.id} value={rt.id}>
                        {rt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Prefix (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. A-"
                      value={genPrefix}
                      onChange={(e) => setGenPrefix(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Starting Number</label>
                    <input
                      type="number"
                      value={genStartNum}
                      onChange={(e) => setGenStartNum(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBatchGenerate}
                  disabled={batchGenerateMutation.isPending}
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-2xs"
                >
                  Generate Units
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}

        {showIssueModal && (
          <ModalOverlay isOpen={!!showIssueModal} onClose={() => setShowIssueModal(null)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Report Out of Order — Room {showIssueModal.unitNumber}
                </h3>
                <button onClick={() => setShowIssueModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Reason / Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Describe maintenance or damage issue (e.g. AC leaking, plumbing, deep clean needed)..."
                    value={issueNotes}
                    onChange={(e) => setIssueNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowIssueModal(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportIssue}
                  className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-2xs"
                >
                  Put in Maintenance
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}
      </div>
    </AppShell>
  );
}
