'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/lib/api/http-client';
import { authService } from '@/features/auth';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { useTranslation, LanguageSwitcher } from '@/lib/i18n';
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
  List,
  LayoutGrid,
} from 'lucide-react';
import { RoomUnit } from '@/features/housekeeping/services/housekeeping.service';
import {
  RoomsMetricsBar,
  RoomsTableView,
  RoomsGridView,
  AddRoomModal,
  EditRoomModal,
  DeleteRoomModal,
  MaintenanceModal,
} from '@/features/rooms/components';

export default function RoomsPage() {
  const { t } = useTranslation();
  useActivePropertyQuery();
  const activeProperty = usePropertyStore((s) => s.activeProperty);

  // Fetch current user profile to verify role (Owners & Managers always get Edit & Delete)
  const { data: profileData } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => authService.getProfile(),
    staleTime: 60000,
    retry: false,
  });

  const userObj = profileData?.user || profileData?.data?.user || profileData;
  const userRole = userObj?.role || 'OWNER';
  const isManagerOrOwner = userRole !== 'HOUSEKEEPING';

  const [activeTab, setActiveTab] = useState<'units' | 'categories'>('units');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('ALL');
  const [selectedCleanliness, setSelectedCleanliness] = useState<string>('ALL');
  const [selectedOccupancy, setSelectedOccupancy] = useState<'ALL' | 'VACANT' | 'OCCUPIED'>('ALL');

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

  const rawUnits: RoomUnit[] = (unitsData as any)?.units || (unitsData as any)?.data?.units || (Array.isArray(unitsData) ? unitsData : []);
  const roomTypes: any[] = propertyData?.property?.roomTypes || propertyData?.roomTypes || activeProperty?.roomTypes || [];

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
      const matchesCleanliness = selectedCleanliness === 'ALL' || u.cleanlinessStatus === selectedCleanliness;

      const isOccupied = u.bookings && u.bookings.length > 0 && u.bookings[0].status === 'CHECKED_IN';
      const matchesOccupancy =
        selectedOccupancy === 'ALL' ||
        (selectedOccupancy === 'OCCUPIED' && isOccupied) ||
        (selectedOccupancy === 'VACANT' && !isOccupied);

      return matchesSearch && matchesCategory && matchesCleanliness && matchesOccupancy;
    });
  }, [rawUnits, searchTerm, selectedRoomType, selectedCleanliness, selectedOccupancy]);

  const totalUnitsCount = rawUnits.length;
  const cleanCount = rawUnits.filter((u) => u.cleanlinessStatus === 'CLEAN').length;
  const dirtyCount = rawUnits.filter((u) => u.cleanlinessStatus === 'DIRTY').length;
  const oooCount = rawUnits.filter((u) => u.cleanlinessStatus === 'OUT_OF_ORDER').length;
  const occupiedCount = rawUnits.filter((u) => u.bookings && u.bookings.length > 0 && u.bookings[0].status === 'CHECKED_IN').length;

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden font-sans text-slate-900">
      <DashboardSidebar />

      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Full-Width Header */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
          <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs">
                  <BedDouble className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 truncate">
                    {t('roomsAndUnits')}
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 truncate">
                    {activeProperty?.name || 'Property Rooms & Live Housekeeping Management'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <LanguageSwitcher />
              <button
                onClick={() => refetch()}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
                title="Refresh Directory"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {isManagerOrOwner && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-xs shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Room</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 flex items-center gap-6 border-t border-slate-100 text-xs font-bold text-slate-500">
            <button
              onClick={() => setActiveTab('units')}
              className={`py-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'units'
                  ? 'border-emerald-600 text-emerald-700 font-extrabold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <DoorClosed className="w-4 h-4" />
              <span>Rooms Directory</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-black">
                {totalUnitsCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'categories'
                  ? 'border-emerald-600 text-emerald-700 font-extrabold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Room Categories & Pricing</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-black">
                {roomTypes.length}
              </span>
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6 space-y-6 w-full">
          {/* Top Summary Metrics */}
          <RoomsMetricsBar
            totalUnitsCount={totalUnitsCount}
            cleanCount={cleanCount}
            dirtyCount={dirtyCount}
            oooCount={oooCount}
            occupiedCount={occupiedCount}
          />

          {activeTab === 'units' ? (
            <div className="space-y-4">
              {/* Filter Controls */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search room name or category..."
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
                    value={selectedCleanliness}
                    onChange={(e) => setSelectedCleanliness(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <option value="ALL">All Cleanliness</option>
                    <option value="CLEAN">Clean Only</option>
                    <option value="DIRTY">Dirty Only</option>
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

                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <List className="w-4 h-4" />
                      <span className="hidden sm:inline">Table</span>
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span className="hidden sm:inline">Cards</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Inventory Table / Grid */}
              {isLoading ? (
                <div className="py-20 text-center text-slate-400 font-semibold animate-pulse text-xs">
                  Loading room inventory...
                </div>
              ) : filteredUnits.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
                  <DoorClosed className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">No rooms found</h3>
                  {isManagerOrOwner && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all cursor-pointer"
                    >
                      + Add Room
                    </button>
                  )}
                </div>
              ) : viewMode === 'table' ? (
                <RoomsTableView
                  units={filteredUnits}
                  isManagerOrOwner={isManagerOrOwner}
                  onMarkClean={(unitId) => updateStatusMutation.mutate({ unitId, status: 'CLEAN' })}
                  onMarkDirty={(unitId) => updateStatusMutation.mutate({ unitId, status: 'DIRTY' })}
                  onEditRoom={(u) => {
                    setEditingUnit(u);
                    setEditRoomName(u.unitNumber);
                    setEditRoomTypeId(u.roomTypeId);
                    setEditRoomFloor(u.floor || '');
                  }}
                  onReportIssue={(u) => setIssueUnit(u)}
                  onDeleteRoom={(u) => setDeletingUnit(u)}
                />
              ) : (
                <RoomsGridView
                  units={filteredUnits}
                  isManagerOrOwner={isManagerOrOwner}
                  onMarkClean={(unitId) => updateStatusMutation.mutate({ unitId, status: 'CLEAN' })}
                  onMarkDirty={(unitId) => updateStatusMutation.mutate({ unitId, status: 'DIRTY' })}
                  onEditRoom={(u) => {
                    setEditingUnit(u);
                    setEditRoomName(u.unitNumber);
                    setEditRoomTypeId(u.roomTypeId);
                    setEditRoomFloor(u.floor || '');
                  }}
                  onDeleteRoom={(u) => setDeletingUnit(u)}
                />
              )}
            </div>
          ) : (
            /* Categories View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomTypes.map((rt: any) => {
                const rtUnitsCount = rawUnits.filter((u) => u.roomTypeId === rt.id).length;
                return (
                  <div key={rt.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4 hover:border-emerald-200 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-black text-slate-900">{rt.name}</h3>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5 line-clamp-2">
                          {rt.description || 'Configured room category'}
                        </p>
                      </div>
                      <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 font-black text-xs">
                        ₹{Number(rt.basePrice || 0).toLocaleString('en-IN')} / night
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Max Capacity</span>
                          <span className="font-extrabold text-slate-800">{rt.maxCapacity || rt.maxOccupancy || 2} Guests</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                        <BedDouble className="w-4 h-4 text-slate-400" />
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Active Rooms</span>
                          <span className="font-extrabold text-slate-800">{rtUnitsCount} Rooms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modular Modals */}
        <AddRoomModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          roomTypes={roomTypes}
          newRoomName={newRoomName}
          setNewRoomName={setNewRoomName}
          newRoomTypeId={newRoomTypeId}
          setNewRoomTypeId={setNewRoomTypeId}
          newRoomFloor={newRoomFloor}
          setNewRoomFloor={setNewRoomFloor}
          onSubmit={handleAddRoom}
          isPending={createRoomMutation.isPending}
        />

        <EditRoomModal
          editingUnit={editingUnit}
          onClose={() => setEditingUnit(null)}
          roomTypes={roomTypes}
          editRoomName={editRoomName}
          setEditRoomName={setEditRoomName}
          editRoomTypeId={editRoomTypeId}
          setEditRoomTypeId={setEditRoomTypeId}
          editRoomFloor={editRoomFloor}
          setEditRoomFloor={setEditRoomFloor}
          onSubmit={handleEditRoom}
          isPending={updateRoomMutation.isPending}
        />

        <DeleteRoomModal
          deletingUnit={deletingUnit}
          onClose={() => setDeletingUnit(null)}
          onSubmit={handleDeleteRoom}
          isPending={deleteRoomMutation.isPending}
        />

        <MaintenanceModal
          issueUnit={issueUnit}
          onClose={() => setIssueUnit(null)}
          issueNotes={issueNotes}
          setIssueNotes={setIssueNotes}
          onSubmit={handleReportIssue}
          isPending={updateStatusMutation.isPending}
        />
      </main>
    </div>
  );
}
