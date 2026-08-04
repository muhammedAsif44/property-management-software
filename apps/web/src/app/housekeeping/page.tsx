'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { AppHeader } from '@/components/app-header';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { authService } from '@/features/auth';
import { httpClient } from '@/lib/api/http-client';
import { useTranslation, LanguageSwitcher } from '@/lib/i18n';
import { Sparkline } from '@/components/ui/sparkline';
import { BulkActionBar } from '@/components/ui/bulk-action-bar';
import { useToast } from '@/components/ui/toast';
import {
  useHousekeepingUnitsQuery,
  useUpdateUnitStatusMutation,
  useBatchGenerateUnitsMutation,
} from '@/features/housekeeping/api/use-housekeeping';
import { RoomUnit } from '@/features/housekeeping/services/housekeeping.service';
import {
  Droplets,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Building2,
  Search,
  Plus,
  RefreshCw,
  X,
  Loader2,
  UserCheck,
  BedDouble,
  List,
  LayoutGrid,
  DoorClosed,
  Clock,
  Download,
} from 'lucide-react';

/* ─── Modal Wrapper ─── */
function ModalOverlay({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}

export default function HousekeepingPage() {
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

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('ALL');
  const [selectedOccupancy, setSelectedOccupancy] = useState<'ALL' | 'VACANT' | 'OCCUPIED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState<RoomUnit | null>(null);
  const [issueNotes, setIssueNotes] = useState('');

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

  const rawSummary = (data as any)?.summary || (data as any)?.data?.summary;
  const summary = rawSummary || {
    total: units.length,
    clean: units.filter((u) => u.cleanlinessStatus === 'CLEAN').length,
    dirty: units.filter((u) => u.cleanlinessStatus === 'DIRTY').length,
    inspected: units.filter((u) => u.cleanlinessStatus === 'INSPECTED').length,
    outOfOrder: units.filter((u) => u.cleanlinessStatus === 'OUT_OF_ORDER').length,
  };

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

      const isOccupied = u.bookings && u.bookings.length > 0 && u.bookings[0].status === 'CHECKED_IN';
      const matchesOccupancy =
        selectedOccupancy === 'ALL' ||
        (selectedOccupancy === 'OCCUPIED' && isOccupied) ||
        (selectedOccupancy === 'VACANT' && !isOccupied);

      return matchesSearch && matchesStatus && matchesCategory && matchesOccupancy;
    });
  }, [units, searchQuery, selectedStatus, selectedRoomType, selectedOccupancy]);

  const toast = useToast();
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
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const selectedUnits = units.filter((u) => selectedIds.includes(u.id));
    if (selectedUnits.length === 0) return;

    const csvLines = [
      'Room Unit,Category,Floor,Cleanliness Status',
      ...selectedUnits.map(
        (u) => `"${u.unitNumber}","${u.roomType?.name || 'Room'}","${u.floor || ''}","${u.cleanlinessStatus}"`
      ),
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orvyn_housekeeping_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedUnits.length} housekeeping records to CSV!`, 'CSV Exported');
  };

  const handleBatchMarkClean = () => {
    if (selectedIds.length === 0) return;

    selectedIds.forEach((id) => {
      updateStatusMutation.mutate({ unitId: id, status: 'CLEAN' });
    });

    toast.showUndoToast(
      `Marked ${selectedIds.length} rooms clean!`,
      () => {
        toast.info('Batch cleanliness status reverted.', 'Reverted');
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
        toast.info('Batch cleanliness status reverted.', 'Reverted');
      },
      'Batch Dirty Completed'
    );
    setSelectedIds([]);
  };

  const handleUpdateStatus = (unitId: string, status: string, notes?: string) => {
    updateStatusMutation.mutate(
      { unitId, status, notes },
      {
        onSuccess: () => {
          toast.showUndoToast(
            `Room status updated to ${status.toLowerCase().replace('_', ' ')}!`,
            () => {
              toast.info('Room status change reverted', 'Reverted');
            },
            'Status Updated'
          );
        },
      }
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
              <button
                onClick={() => refetch()}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
                title="Refresh Directory"
              >
                <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </button>
              {isOwnerOrManager && (
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="truncate">Setup Rooms</span>
                </button>
              )}
            </div>
          }
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
              <Droplets className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                Housekeeping & Operations
              </h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {activeProperty?.name || t('activeManagementHub')}
              </p>
            </div>
          </div>
        </AppHeader>

        {/* 100% Full-Width Body Content */}
        <div className="p-6 space-y-6 w-full">
          {/* Status Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Clean & Ready
                </span>
                <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {summary.clean}
                </span>
              </div>
              <span className="text-2xl font-black text-slate-900 mt-2 block">{summary.clean}</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Needs Cleaning
                </span>
                <span className="text-xs font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                  {summary.dirty}
                </span>
              </div>
              <span className="text-2xl font-black text-slate-900 mt-2 block">{summary.dirty}</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs border-l-4 border-l-slate-400">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Inspected
                </span>
                <span className="text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">
                  {summary.inspected}
                </span>
              </div>
              <span className="text-2xl font-black text-slate-900 mt-2 block">{summary.inspected}</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs border-l-4 border-l-rose-500">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-rose-600" /> Out of Order
                </span>
                <span className="text-xs font-black text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full">
                  {summary.outOfOrder}
                </span>
              </div>
              <span className="text-2xl font-black text-slate-900 mt-2 block">{summary.outOfOrder}</span>
            </div>
          </div>

          {/* Filter Bar & View Mode Switcher */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search unit number, category, floor..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <select
                value={selectedRoomType}
                onChange={(e) => setSelectedRoomType(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
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
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                <option value="ALL">All Cleanliness</option>
                <option value="CLEAN">Clean Only</option>
                <option value="DIRTY">Dirty Only</option>
                <option value="INSPECTED">Inspected</option>
                <option value="OUT_OF_ORDER">Out of Order</option>
              </select>

              <select
                value={selectedOccupancy}
                onChange={(e) => setSelectedOccupancy(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                <option value="ALL">All Occupancy</option>
                <option value="VACANT">Vacant Only</option>
                <option value="OCCUPIED">Occupied Only</option>
              </select>

              {/* View Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
              </div>
            </div>
          </div>

          {/* Housekeeping Data Table View */}
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 font-semibold animate-pulse text-xs">
              Loading housekeeping units...
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
              <DoorClosed className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No housekeeping units found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No physical room units match your selected filters.
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredUnits.length > 0 && selectedIds.length === filteredUnits.length
                          }
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                          title="Select all housekeeping units"
                        />
                      </th>
                      <th className="py-3.5 px-5">Room Name / Door</th>
                      <th className="py-3.5 px-5">Category & Rate</th>
                      <th className="py-3.5 px-5">Location / Floor</th>
                      <th className="py-3.5 px-5">Cleanliness Status</th>
                      <th className="py-3.5 px-5">Occupancy & Guest</th>
                      <th className="py-3.5 px-5 text-right">Quick Housekeeping Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                    {filteredUnits.map((u) => {
                      const isOccupied = u.bookings && u.bookings.length > 0 && u.bookings[0].status === 'CHECKED_IN';
                      const activeBooking = u.bookings && u.bookings.length > 0 ? u.bookings[0] : null;
                      const isSelected = selectedIds.includes(u.id);

                      return (
                        <tr
                          key={u.id}
                          className={`transition-all ${
                            isSelected ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Checkbox Column */}
                          <td
                            className="py-3.5 px-4 text-center"
                            onClick={(e) => handleSelectOne(u.id, e)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                            />
                          </td>
                          {/* Room Name */}
                          <td className="py-3.5 px-5 font-black text-slate-900 text-sm whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                <DoorClosed className="w-4 h-4" />
                              </span>
                              <span>{u.unitNumber}</span>
                            </div>
                          </td>

                          {/* Category & Rate */}
                          <td className="py-3.5 px-5 whitespace-nowrap">
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-800 truncate">{u.roomType?.name || 'Room'}</p>
                              {u.roomType?.basePrice && (
                                <p className="text-[11px] font-semibold text-emerald-700">
                                  ₹{Number(u.roomType.basePrice).toLocaleString('en-IN')} / night
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Location / Floor */}
                          <td className="py-3.5 px-5 whitespace-nowrap font-medium text-slate-600">
                            {u.floor || <span className="text-slate-400 italic">Unassigned</span>}
                          </td>

                          {/* Cleanliness Status */}
                          <td className="py-3.5 px-5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${
                                u.cleanlinessStatus === 'CLEAN'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : u.cleanlinessStatus === 'DIRTY'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : u.cleanlinessStatus === 'INSPECTED'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {u.cleanlinessStatus === 'CLEAN' && <CheckCircle2 className="w-3 h-3" />}
                              {u.cleanlinessStatus === 'DIRTY' && <AlertTriangle className="w-3 h-3" />}
                              {u.cleanlinessStatus === 'INSPECTED' && <Clock className="w-3 h-3" />}
                              {u.cleanlinessStatus === 'OUT_OF_ORDER' && <Wrench className="w-3 h-3" />}
                              {u.cleanlinessStatus.replace('_', ' ')}
                            </span>
                          </td>

                          {/* Occupancy & Guest */}
                          <td className="py-3.5 px-5 whitespace-nowrap">
                            {isOccupied ? (
                              <div className="flex items-center gap-2">
                                <span className="p-1 rounded-full bg-indigo-100 text-indigo-700">
                                  <UserCheck className="w-3.5 h-3.5" />
                                </span>
                                <div>
                                  <p className="font-extrabold text-indigo-900 text-xs">
                                    {activeBooking?.guest?.fullName || 'Occupied'}
                                  </p>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                                    {activeBooking?.status.replace('_', ' ')}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400 font-semibold text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
                                Vacant
                              </span>
                            )}
                          </td>

                          {/* 1-Tap Housekeeping Actions */}
                          <td className="py-3.5 px-5 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {u.cleanlinessStatus !== 'CLEAN' && (
                                <button
                                  onClick={() => handleUpdateStatus(u.id, 'CLEAN')}
                                  disabled={updateStatusMutation.isPending}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 font-bold text-[11px] rounded-lg transition-all cursor-pointer border border-emerald-200"
                                >
                                  Mark Clean
                                </button>
                              )}
                              {u.cleanlinessStatus !== 'DIRTY' && (
                                <button
                                  onClick={() => handleUpdateStatus(u.id, 'DIRTY')}
                                  disabled={updateStatusMutation.isPending}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 font-bold text-[11px] rounded-lg transition-all cursor-pointer border border-rose-200"
                                >
                                  Mark Dirty
                                </button>
                              )}
                              {u.cleanlinessStatus !== 'INSPECTED' && (
                                <button
                                  onClick={() => handleUpdateStatus(u.id, 'INSPECTED')}
                                  disabled={updateStatusMutation.isPending}
                                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 font-bold text-[11px] rounded-lg transition-all cursor-pointer border border-blue-200"
                                >
                                  Inspected
                                </button>
                              )}
                              <button
                                onClick={() => setShowIssueModal(u)}
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-700 transition-colors cursor-pointer border border-slate-200"
                                title="Report Maintenance Issue"
                              >
                                <Wrench className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Card Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredUnits.map((u) => {
                const isOccupied = u.bookings && u.bookings.length > 0 && u.bookings[0].status === 'CHECKED_IN';

                return (
                  <div
                    key={u.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                          <DoorClosed className="w-4 h-4 text-emerald-600" />
                          {u.unitNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            u.cleanlinessStatus === 'CLEAN'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : u.cleanlinessStatus === 'DIRTY'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {u.cleanlinessStatus.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-500 mt-1 truncate">
                        {u.roomType?.name || 'Room'} {u.floor ? `• ${u.floor}` : ''}
                      </p>

                      <div
                        className={`mt-3 p-3 rounded-xl border text-xs space-y-1 ${
                          isOccupied
                            ? 'bg-indigo-50/70 border-indigo-200/70 text-indigo-900'
                            : 'bg-slate-50 border-slate-200/60 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between font-extrabold text-[11px]">
                          <span>{isOccupied ? 'Occupied' : 'Vacant / Ready'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                      {u.cleanlinessStatus !== 'CLEAN' && (
                        <button
                          onClick={() => handleUpdateStatus(u.id, 'CLEAN')}
                          className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-lg text-center cursor-pointer border border-emerald-200"
                        >
                          Mark Clean
                        </button>
                      )}
                      {u.cleanlinessStatus !== 'DIRTY' && (
                        <button
                          onClick={() => handleUpdateStatus(u.id, 'DIRTY')}
                          className="flex-1 py-1.5 bg-rose-50 text-rose-700 font-bold text-[11px] rounded-lg text-center cursor-pointer border border-rose-200"
                        >
                          Mark Dirty
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══ Maintenance / Out of Order Modal ═══ */}
        <ModalOverlay isOpen={!!showIssueModal} onClose={() => setShowIssueModal(null)}>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                Report Out of Order — Room {showIssueModal?.unitNumber}
              </h3>
              <button onClick={() => setShowIssueModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reason / Maintenance Issue
              </label>
              <textarea
                value={issueNotes}
                onChange={(e) => setIssueNotes(e.target.value)}
                placeholder="Describe maintenance issue..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowIssueModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReportIssue}
                disabled={updateStatusMutation.isPending}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {updateStatusMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Mark Out of Order
              </button>
            </div>
          </div>
        </ModalOverlay>

        {/* ═══ Batch Setup Rooms Modal ═══ */}
        <ModalOverlay isOpen={showGenerateModal} onClose={() => setShowGenerateModal(false)}>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                Setup Physical Room Numbers
              </h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Room Category *
                </label>
                <select
                  value={genRoomTypeId}
                  onChange={(e) => setGenRoomTypeId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                >
                  {roomTypes.map((rt: any) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} ({rt.totalUnits || 1} units configured)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Prefix (Optional)
                </label>
                <input
                  type="text"
                  value={genPrefix}
                  onChange={(e) => setGenPrefix(e.target.value)}
                  placeholder="e.g. Villa or Block A"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Starting Room Number
                </label>
                <input
                  type="number"
                  value={genStartNum}
                  onChange={(e) => setGenStartNum(Number(e.target.value))}
                  placeholder="101"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchGenerate}
                disabled={!genRoomTypeId || batchGenerateMutation.isPending}
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {batchGenerateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Generate Room Numbers
              </button>
            </div>
          </div>
        </ModalOverlay>

        {/* Floating Bulk Action Bar for Housekeeping */}
        <BulkActionBar
          selectedCount={selectedIds.length}
          totalCount={filteredUnits.length}
          onClearSelection={() => setSelectedIds([])}
          customActions={[
            {
              label: 'Mark Selected Clean',
              icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />,
              variant: 'emerald',
              onClick: handleBatchMarkClean,
              isPending: updateStatusMutation.isPending,
            },
            {
              label: 'Mark Selected Dirty',
              icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />,
              variant: 'rose',
              onClick: handleBatchMarkDirty,
              isPending: updateStatusMutation.isPending,
            },
            {
              label: 'Export CSV',
              icon: <Download className="w-3.5 h-3.5 text-slate-400" />,
              variant: 'slate',
              onClick: handleExportCSV,
            },
          ]}
        />
      </div>
    </div>
  );
}
