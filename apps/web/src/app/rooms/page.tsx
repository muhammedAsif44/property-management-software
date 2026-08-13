'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/lib/api/http-client';
import { authService } from '@/features/auth';
import { AppShell } from '@/components/app-shell';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { useTranslation } from '@/lib/i18n';
import {
  useHousekeepingUnitsQuery,
  useUpdateUnitStatusMutation,
  useCreateRoomUnitMutation,
  useUpdateRoomUnitMutation,
  useDeleteRoomUnitMutation,
} from '@/features/housekeeping/api/use-housekeeping';
import {
  BedDouble,
  Search,
  Building2,
  Users,
  Plus,
  RefreshCw,
  DoorClosed,
  Wrench,
  List,
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
  Download,
  X,
  Sparkles,
} from 'lucide-react';
import { RoomUnit } from '@/features/housekeeping/services/housekeeping.service';
import { useToast } from '@/components/ui/toast';
import dynamic from 'next/dynamic';
import {
  RoomsMetricsBar,
  RoomsTableView,
  RoomsGridView,
} from '@/features/rooms/components';

// Dynamic lazy loading for modals and slide-over drawers
const RoomDetailDrawer = dynamic(() => import('@/features/rooms/components/room-detail-drawer').then((mod) => mod.RoomDetailDrawer), { ssr: false }) as any;
const AddRoomModal = dynamic(() => import('@/features/rooms/components/rooms-modals').then((mod) => mod.AddRoomModal), { ssr: false }) as any;
const EditRoomModal = dynamic(() => import('@/features/rooms/components/rooms-modals').then((mod) => mod.EditRoomModal), { ssr: false }) as any;
const DeleteRoomModal = dynamic(() => import('@/features/rooms/components/rooms-modals').then((mod) => mod.DeleteRoomModal), { ssr: false }) as any;
const MaintenanceModal = dynamic(() => import('@/features/rooms/components/rooms-modals').then((mod) => mod.MaintenanceModal), { ssr: false }) as any;

export default function RoomsPage() {
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

  const userObj = profileData?.user || profileData?.data?.user || profileData;
  const userRole = userObj?.role || 'OWNER';
  const isManagerOrOwner = userRole !== 'HOUSEKEEPING';

  const [activeTab, setActiveTab] = useState<'units' | 'categories' | 'maintenance'>('units');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('ALL');
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [selectedOccupancy, setSelectedOccupancy] = useState<'ALL' | 'VACANT' | 'OCCUPIED' | 'MAINTENANCE'>('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomTypeId, setNewRoomTypeId] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState('');

  const [editingUnit, setEditingUnit] = useState<RoomUnit | null>(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomTypeId, setEditRoomTypeId] = useState('');
  const [editRoomFloor, setEditRoomFloor] = useState('');

  const [deletingUnit, setDeletingUnit] = useState<RoomUnit | null>(null);
  const [issueUnit, setIssueUnit] = useState<RoomUnit | null>(null);
  const [issueNotes, setIssueNotes] = useState('');

  // Queries & Mutations
  const { data: unitsData, isLoading, refetch } = useHousekeepingUnitsQuery(activeProperty?.id);
  const updateStatusMutation = useUpdateUnitStatusMutation();
  const createRoomMutation = useCreateRoomUnitMutation();
  const updateRoomMutation = useUpdateRoomUnitMutation();
  const deleteRoomMutation = useDeleteRoomUnitMutation();

  const { data: propertyData } = useQuery({
    queryKey: ['property-room-types', activeProperty?.id],
    queryFn: async () => {
      if (!activeProperty?.id) return null;
      try {
        const res = await httpClient.get<any>(`/properties/${activeProperty.id}/onboarding`);
        return res?.data || res;
      } catch (e) {
        return null;
      }
    },
    enabled: !!activeProperty?.id,
    staleTime: 30000,
  });

  const rawUnits: RoomUnit[] = useMemo(() => {
    if (!unitsData) return [];
    if (Array.isArray(unitsData)) return unitsData;
    if (Array.isArray((unitsData as any).units)) return (unitsData as any).units;
    if (Array.isArray((unitsData as any).data?.units)) return (unitsData as any).data.units;
    return [];
  }, [unitsData]);

  const roomTypes: any[] = propertyData?.property?.roomTypes || propertyData?.roomTypes || activeProperty?.roomTypes || [];

  const availableFloors = useMemo(() => {
    const floors = new Set<string>();
    rawUnits.forEach((u) => {
      if (u.floor && u.floor.trim()) floors.add(u.floor.trim());
    });
    return Array.from(floors);
  }, [rawUnits]);

  useEffect(() => {
    if (roomTypes.length > 0 && !newRoomTypeId) {
      setNewRoomTypeId(roomTypes[0].id);
    }
  }, [roomTypes, newRoomTypeId]);

  const handleAddRoom = async () => {
    if (!newRoomName || !newRoomTypeId) return;
    await createRoomMutation.mutateAsync({
      unitNumber: newRoomName,
      roomTypeId: newRoomTypeId,
      floor: newRoomFloor,
      propertyId: activeProperty?.id,
    });
    setShowAddModal(false);
    setNewRoomName('');
    setNewRoomFloor('');
  };

  const handleEditRoom = async () => {
    if (!editingUnit || !editRoomName || !editRoomTypeId) return;
    await updateRoomMutation.mutateAsync({
      unitId: editingUnit.id,
      data: {
        unitNumber: editRoomName,
        roomTypeId: editRoomTypeId,
        floor: editRoomFloor,
      },
    });
    setEditingUnit(null);
  };

  const handleDeleteRoom = async () => {
    if (!deletingUnit) return;
    await deleteRoomMutation.mutateAsync(deletingUnit.id);
    setDeletingUnit(null);
  };

  const handleReportIssue = async () => {
    if (!issueUnit) return;
    await updateStatusMutation.mutateAsync({
      unitId: issueUnit.id,
      status: 'OUT_OF_ORDER',
      notes: issueNotes || 'Maintenance required',
    });
    setIssueUnit(null);
    setIssueNotes('');
  };

  const filteredUnits = useMemo(() => {
    return rawUnits.filter((u) => {
      const matchesSearch =
        u.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.roomType?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.floor && u.floor.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedRoomType === 'ALL' || u.roomTypeId === selectedRoomType;
      const matchesFloor = selectedFloor === 'ALL' || (u.floor && u.floor.trim() === selectedFloor);

      const isOccupied = u.bookings && u.bookings.length > 0 && u.bookings[0].status === 'CHECKED_IN';
      const isOOO = u.cleanlinessStatus === 'OUT_OF_ORDER';

      const matchesOccupancy =
        selectedOccupancy === 'ALL' ||
        (selectedOccupancy === 'OCCUPIED' && isOccupied) ||
        (selectedOccupancy === 'VACANT' && !isOccupied && !isOOO) ||
        (selectedOccupancy === 'MAINTENANCE' && isOOO);

      return matchesSearch && matchesCategory && matchesFloor && matchesOccupancy;
    });
  }, [rawUnits, searchTerm, selectedRoomType, selectedFloor, selectedOccupancy]);

  const totalUnitsCount = rawUnits.length;
  const cleanCount = rawUnits.filter((u) => u.cleanlinessStatus === 'CLEAN').length;
  const dirtyCount = rawUnits.filter((u) => u.cleanlinessStatus === 'DIRTY').length;
  const oooCount = rawUnits.filter((u) => u.cleanlinessStatus === 'OUT_OF_ORDER').length;
  const occupiedCount = rawUnits.filter((u) => u.bookings && u.bookings.length > 0 && u.bookings[0].status === 'CHECKED_IN').length;

  // Multi-select & Quick Drawer State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerUnit, setDrawerUnit] = useState<RoomUnit | null>(null);

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

  const handleExportCSV = () => {
    const selectedUnits = rawUnits.filter((u) => selectedIds.includes(u.id));
    if (selectedUnits.length === 0) return;

    const csvLines = [
      'Room Door,Room Category,Floor,Occupancy,Base Rate',
      ...selectedUnits.map(
        (u) =>
          `"${u.unitNumber}","${u.roomType?.name || 'Room'}","${u.floor || ''}","${
            u.bookings && u.bookings.length > 0 ? 'Occupied' : 'Vacant'
          }","${u.roomType?.basePrice || 0}"`
      ),
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orvyn_rooms_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedUnits.length} room units to CSV!`, 'CSV Exported');
  };

  return (
    <AppShell
      sectionIcon={BedDouble}
      sectionTitle={t('roomsAndUnits') || 'Rooms & Inventory'}
      sectionDescription="Physical room inventory, categories, floor configurations, and asset management"
      sectionTabs={[
        {
          label: t('tabRoomsDirectory') || 'Rooms Directory',
          icon: DoorClosed,
          count: totalUnitsCount,
          isActive: activeTab === 'units',
          onClick: () => setActiveTab('units'),
        },
        {
          label: t('tabRoomCategories') || 'Room Categories & Pricing',
          icon: Building2,
          count: roomTypes.length,
          isActive: activeTab === 'categories',
          onClick: () => setActiveTab('categories'),
        },
        {
          label: 'Maintenance & OOO',
          icon: Wrench,
          count: oooCount,
          isActive: activeTab === 'maintenance',
          onClick: () => setActiveTab('maintenance'),
        },
      ]}
      sectionActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 transition-all cursor-pointer shadow-2xs"
            title="Refresh Inventory"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </button>
          {isManagerOrOwner && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0 active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('addRoom') || 'Add Room Unit'}</span>
            </button>
          )}
        </div>
      }
      layout="wide"
    >
      <div className="space-y-4 w-full">
        {/* ══════════════════════════════════════════════════════════════════
           1. INVENTORY & ASSET SUMMARY METRICS
           ══════════════════════════════════════════════════════════════════ */}
        <RoomsMetricsBar
          totalUnitsCount={totalUnitsCount}
          cleanCount={cleanCount}
          dirtyCount={dirtyCount}
          oooCount={oooCount}
          occupiedCount={occupiedCount}
          categoriesCount={roomTypes.length}
        />

        {activeTab === 'units' && (
          <div className="space-y-4">
            {/* ══════════════════════════════════════════════════════════════
               2. INVENTORY TOOLBAR
               ══════════════════════════════════════════════════════════════ */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-3 flex items-center justify-between gap-3 flex-wrap">
              {/* Search Field */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by room door number, category, floor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Filters Dropdowns */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* Category Selector */}
                <select
                  value={selectedRoomType}
                  onChange={(e) => setSelectedRoomType(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>

                {/* Floor Selector */}
                <select
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="ALL">All Floors</option>
                  {availableFloors.map((fl) => (
                    <option key={fl} value={fl}>
                      {fl}
                    </option>
                  ))}
                </select>

                {/* Occupancy Selector */}
                <select
                  value={selectedOccupancy}
                  onChange={(e) => setSelectedOccupancy(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="ALL">All Availability</option>
                  <option value="VACANT">Vacant / Ready</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="MAINTENANCE">Under Maintenance</option>
                </select>

                {/* View Switcher */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title="Table View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title="Cards View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
               3. ROOMS DIRECTORY (Table or Cards View)
               ══════════════════════════════════════════════════════════════ */}
            {viewMode === 'table' ? (
              <RoomsTableView
                units={filteredUnits}
                isManagerOrOwner={isManagerOrOwner}
                selectedIds={selectedIds}
                onSelectAll={handleSelectAll}
                onSelectOne={handleSelectOne}
                onRowClick={(unit) => setDrawerUnit(unit)}
                onEditRoom={(unit) => {
                  setEditingUnit(unit);
                  setEditRoomName(unit.unitNumber);
                  setEditRoomTypeId(unit.roomTypeId);
                  setEditRoomFloor(unit.floor || '');
                }}
                onReportIssue={(unit) => {
                  setIssueUnit(unit);
                  setIssueNotes(unit.notes || '');
                }}
                onDeleteRoom={(unit) => setDeletingUnit(unit)}
              />
            ) : (
              <RoomsGridView
                units={filteredUnits}
                isManagerOrOwner={isManagerOrOwner}
                onCardClick={(unit) => setDrawerUnit(unit)}
                onMarkClean={() => {}}
                onMarkDirty={() => {}}
                onEditRoom={(unit) => {
                  setEditingUnit(unit);
                  setEditRoomName(unit.unitNumber);
                  setEditRoomTypeId(unit.roomTypeId);
                  setEditRoomFloor(unit.floor || '');
                }}
                onReportIssue={(unit) => {
                  setIssueUnit(unit);
                  setIssueNotes(unit.notes || '');
                }}
                onDeleteRoom={(unit) => setDeletingUnit(unit)}
              />
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
           4. ROOM CATEGORIES & PRICING TAB
           ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomTypes.map((rt) => {
                const totalUnits = rawUnits.filter((u) => u.roomTypeId === rt.id).length;
                const occupiedUnits = rawUnits.filter(
                  (u) => u.roomTypeId === rt.id && u.bookings && u.bookings.length > 0 && u.bookings[0].status === 'CHECKED_IN'
                ).length;

                return (
                  <div
                    key={rt.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{rt.name}</h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          Capacity: {rt.maxOccupancy || 2} Guests
                        </p>
                      </div>
                      <span className="text-sm font-black text-emerald-800 dark:text-emerald-400">
                        ₹{Number(rt.basePrice || 0).toLocaleString('en-IN')}{' '}
                        <span className="text-[10px] font-normal text-slate-400">/ night</span>
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Total Allocated Units: <strong className="text-slate-800 dark:text-slate-200">{totalUnits}</strong></span>
                      <span className="text-blue-600 font-semibold">{occupiedUnits} Occupied</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
           5. MAINTENANCE & OOO TAB
           ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            {oooCount === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-12 text-center shadow-2xs space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">All Rooms Fully Operational</h3>
                <p className="text-xs text-slate-400">No rooms are currently out of order or under maintenance.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rawUnits
                  .filter((u) => u.cleanlinessStatus === 'OUT_OF_ORDER')
                  .map((u) => (
                    <div
                      key={u.id}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/60 p-5 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Out of Order
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">
                            Room {u.unitNumber}
                          </h4>
                          <p className="text-xs text-slate-400 font-medium">{u.roomType?.name || 'Room'}</p>
                        </div>
                        <Wrench className="w-5 h-5 text-rose-500" />
                      </div>

                      <div className="p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/30 text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-rose-800 dark:text-rose-400 block text-[10px] uppercase">Notes</span>
                        <p>{u.notes || 'Routine maintenance and inspection'}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button
                          onClick={() => updateStatusMutation.mutate({ unitId: u.id, status: 'CLEAN' })}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-2xs"
                        >
                          Release to Inventory
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
           6. BULK ACTION BAR (Export / Batch Operations)
           ══════════════════════════════════════════════════════════════ */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-200">
            <span className="text-xs font-bold text-slate-200">
              <strong className="text-emerald-400 font-black">{selectedIds.length}</strong> rooms selected
            </span>

            <div className="h-4 w-px bg-slate-700" />

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Export Inventory CSV</span>
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
           7. SLIDE-OVER ROOM ASSET DETAIL DRAWER
           ══════════════════════════════════════════════════════════════════ */}
        {drawerUnit && (
          <RoomDetailDrawer
            unit={drawerUnit}
            isOpen={!!drawerUnit}
            onClose={() => setDrawerUnit(null)}
            onMarkClean={() => {}}
            onMarkDirty={() => {}}
            onReportIssue={(unit: any) => {
              setIssueUnit(unit);
              setIssueNotes(unit.notes || '');
            }}
          />
        )}

        {/* ══════════════════════════════════════════════════════════════════
           8. MODALS (Add, Edit, Delete, Maintenance)
           ══════════════════════════════════════════════════════════════ */}
        {showAddModal && (
          <AddRoomModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            newRoomName={newRoomName}
            setNewRoomName={setNewRoomName}
            newRoomTypeId={newRoomTypeId}
            setNewRoomTypeId={setNewRoomTypeId}
            newRoomFloor={newRoomFloor}
            setNewRoomFloor={setNewRoomFloor}
            roomTypes={roomTypes}
            onSubmit={handleAddRoom}
            isPending={createRoomMutation.isPending}
          />
        )}

        {editingUnit && (
          <EditRoomModal
            isOpen={!!editingUnit}
            editingUnit={editingUnit}
            onClose={() => setEditingUnit(null)}
            editRoomName={editRoomName}
            setEditRoomName={setEditRoomName}
            editRoomTypeId={editRoomTypeId}
            setEditRoomTypeId={setEditRoomTypeId}
            editRoomFloor={editRoomFloor}
            setEditRoomFloor={setEditRoomFloor}
            roomTypes={roomTypes}
            onSubmit={handleEditRoom}
            isPending={updateRoomMutation.isPending}
          />
        )}

        {deletingUnit && (
          <DeleteRoomModal
            isOpen={!!deletingUnit}
            deletingUnit={deletingUnit}
            onClose={() => setDeletingUnit(null)}
            onSubmit={handleDeleteRoom}
            isPending={deleteRoomMutation.isPending}
          />
        )}

        {issueUnit && (
          <MaintenanceModal
            isOpen={!!issueUnit}
            issueUnit={issueUnit}
            onClose={() => setIssueUnit(null)}
            issueNotes={issueNotes}
            setIssueNotes={setIssueNotes}
            onSubmit={handleReportIssue}
            isPending={updateStatusMutation.isPending}
          />
        )}
      </div>
    </AppShell>
  );
}
