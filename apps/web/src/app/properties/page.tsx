'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  usePropertyStore,
  useMyPropertiesQuery,
  useActivePropertyQuery,
  useSwitchPropertyMutation,
  PropertyItem,
} from '@/features/properties';
import { authService } from '@/features/auth';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { AppHeader } from '@/components/app-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import {
  Building2,
  Plus,
  Check,
  RefreshCw,
  Settings,
  Hotel,
  MapPin,
  Star,
  Search,
  Clock,
  CreditCard,
  BedDouble,
  Layers,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import { useTranslation, LanguageSwitcher } from '@/lib/i18n';
import { Sparkline } from '@/components/ui/sparkline';
import { BulkActionBar } from '@/components/ui/bulk-action-bar';
import dynamic from 'next/dynamic';

const QuickDrawer = dynamic(() => import('@/components/ui/quick-drawer').then(m => m.QuickDrawer), { ssr: false });

export default function PropertiesPage() {
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation();

  // View Mode, Selection & Search Filter State
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'live' | 'setup'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerProperty, setDrawerProperty] = useState<PropertyItem | null>(null);

  // Active property & properties portfolio queries
  const { isLoading: propertiesLoading } = useMyPropertiesQuery();
  const { isLoading: activeLoading } = useActivePropertyQuery();
  const switchMutation = useSwitchPropertyMutation();

  const properties = usePropertyStore((state) => state.properties);
  const activeProperty = usePropertyStore((state) => state.activeProperty);

  // User profile check
  const { data: profileData } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => authService.getProfile(),
    staleTime: 60000,
    retry: false,
  });

  const userRole = profileData?.user?.role || profileData?.data?.user?.role || 'OWNER';
  const isOwner = userRole === 'OWNER' || userRole === 'SUPER_ADMIN';

  // Upfront Role Guard: Only Owners & Super Admins can access Properties Portfolio
  React.useEffect(() => {
    if (profileData) {
      const uRole = profileData?.user?.role || profileData?.data?.user?.role || '';
      if (uRole && uRole !== 'OWNER' && uRole !== 'SUPER_ADMIN') {
        toast.info(
          'Access Restricted: Property Portfolio is reserved for Property Owners.',
          'Restricted Access'
        );
        router.push('/dashboard');
      }
    }
  }, [profileData, router, toast]);

  // Filtered Properties Computation
  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      // Status Filter
      if (statusFilter === 'active' && prop.id !== activeProperty?.id) return false;
      if (statusFilter === 'live' && prop.onboardingStep < 6) return false;
      if (statusFilter === 'setup' && prop.onboardingStep >= 6) return false;

      // Text Query Filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        prop.name.toLowerCase().includes(q) ||
        (prop.city && prop.city.toLowerCase().includes(q)) ||
        (prop.address && prop.address.toLowerCase().includes(q)) ||
        (prop.state && prop.state.toLowerCase().includes(q))
      );
    });
  }, [properties, activeProperty, searchQuery, statusFilter]);

  // Multi-select handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredProperties.map((p) => p.id));
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

  // CSV Export handler
  const handleExportCSV = () => {
    const selectedProps = properties.filter((p) => selectedIds.includes(p.id));
    if (selectedProps.length === 0) return;

    const csvLines = [
      'ID,Property Name,City,Country,Room Types Count,Check-In,Check-Out',
      ...selectedProps.map(
        (p) =>
          `"${p.id}","${p.name.replace(/"/g, '""')}","${p.city || ''}","${p.country || 'IN'}","${
            p._count?.roomTypes || 0
          }","${p.settings?.checkInTime || '14:00'}","${p.settings?.checkOutTime || '11:00'}"`
      ),
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orvyn_properties_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedProps.length} properties to CSV!`, 'CSV Exported');
  };

  // Optimistic UI Switch Property with Undo Toast
  const handleSwitch = (property: PropertyItem) => {
    if (property.id === activeProperty?.id) return;
    const previousActive = activeProperty;

    switchMutation.mutate(property.id, {
      onSuccess: () => {
        toast.showUndoToast(
          `Switched active workspace to ${property.name}!`,
          () => {
            if (previousActive) {
              switchMutation.mutate(previousActive.id);
              toast.info(`Reverted active workspace back to ${previousActive.name}`, 'Reverted');
            }
          },
          'Property Switched'
        );
      },
      onError: (err: any) => {
        toast.error(err.message || 'Failed to switch property', 'Switch Failed');
      },
    });
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
            isOwner ? (
              <Link
                href="/onboarding/property?new=true"
                className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="truncate">{t('addProperty')}</span>
              </Link>
            ) : undefined
          }
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {t('propertiesPortfolio')}
              </h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {t('propertiesPortfolioSubtitle')}
              </p>
            </div>
          </div>
        </AppHeader>

        {/* Properties Workspace */}
        <main className="p-4 lg:p-6 space-y-6 w-full flex-1">
          
          {/* Hero Banner & Search Filter Bar */}
          <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border-l-4 border-emerald-600 border border-divider shadow-[0_1px_2px_rgba(0,0,0,0.02)] relative overflow-hidden space-y-6">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-divider text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                  <span>{t('propertiesPortfolio')} ({properties.length})</span>
                </div>
                {/* Sparkline Micro Trend Graph */}
                <Sparkline changePercentage={+12.4} label="occupancy trend" />
              </div>
            </div>

            {/* Interactive Search Bar & Filter Chips */}
            <div className="relative z-10 pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Box */}
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPropertiesPlaceholder')}
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#16241e] border border-slate-200 dark:border-[#1d3329] text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-[#16241e] focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0 scrollbar-none">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-transparent hover:bg-slate-50 border border-transparent text-slate-600 font-semibold'
                  }`}
                >
                  {t('filterAll')} ({properties.length})
                </button>

                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'active'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-transparent hover:bg-slate-50 border border-transparent text-slate-600 font-semibold'
                  }`}
                >
                  {t('filterActive')}
                </button>

                <button
                  onClick={() => setStatusFilter('live')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'live'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-transparent hover:bg-slate-50 border border-transparent text-slate-600 font-semibold'
                  }`}
                >
                  {t('filterLive')}
                </button>

                <button
                  onClick={() => setStatusFilter('setup')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'setup'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-transparent hover:bg-slate-50 border border-transparent text-slate-600 font-semibold'
                  }`}
                >
                  {t('filterSetup')}
                </button>
              </div>

              {/* View Switcher Pill Group */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-emerald-800 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={t('tableView')}
                >
                  <TableIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden md:inline truncate">{t('tableView')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-emerald-800 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={t('gridView')}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden md:inline truncate">{t('gridView')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Properties Portfolio Display (Table View vs Grid View) */}
          {propertiesLoading || activeLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-2xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full rounded-2xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center bg-white/90 backdrop-blur-xl border border-emerald-200/80 rounded-3xl shadow-sm space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
                <Hotel className="w-8 h-8 text-emerald-700" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">{t('noPropertiesYet')}</h3>
                <p className="text-xs text-slate-500">{t('createFirstProperty')}</p>
              </div>

              {isOwner && (
                <Link
                  href="/onboarding/property?new=true"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> {t('addProperty')}
                </Link>
              )}
            </div>
          ) : viewMode === 'table' ? (
            /* Modern B2B SaaS Data Table Format */
            <div className="bg-white dark:bg-[#0f1814] rounded-3xl border border-emerald-200/90 dark:border-[#1d3329] shadow-sm overflow-hidden min-w-0">
              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-[#16241e]/80 border-b border-slate-200/80 dark:border-[#1d3329] text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      <th className="py-3.5 px-4 w-12 text-center min-w-0">
                        <input
                          type="checkbox"
                          checked={
                            filteredProperties.length > 0 &&
                            selectedIds.length === filteredProperties.length
                          }
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                          title="Select all properties"
                        />
                      </th>
                      <th className="py-3.5 px-5 min-w-0">{t('propertyNameHeader')}</th>
                      <th className="py-3.5 px-4 min-w-0">{t('onboardingStatusHeader')}</th>
                      <th className="py-3.5 px-4 min-w-0">{t('policyHeader')}</th>
                      <th className="py-3.5 px-4 min-w-0">{t('specsHeader')}</th>
                      <th className="py-3.5 px-4 min-w-0">{t('paymentsHeader')}</th>
                      <th className="py-3.5 px-5 text-right min-w-0">{t('actionsHeader')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1d3329] text-xs font-semibold">
                    {filteredProperties.map((prop) => {
                      const isActive = prop.id === activeProperty?.id;
                      const isSelected = selectedIds.includes(prop.id);
                      const isSwitching = switchMutation.isPending && switchMutation.variables === prop.id;
                      const stepPct = Math.min(100, Math.round(((prop.onboardingStep || 1) / 6) * 100));
                      const checkInTime = prop.settings?.checkInTime || '14:00';
                      const checkOutTime = prop.settings?.checkOutTime || '11:00';
                      const hasPaymentSetup = !!(prop.settings?.upiId || prop.settings?.bankAccountDetails);
                      const roomTypesCount = prop._count?.roomTypes ?? (prop.roomTypes?.length || 0);

                      return (
                        <tr
                          key={prop.id}
                          onClick={() => setDrawerProperty(prop)}
                          className={`transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                            isSelected
                              ? 'bg-slate-50/70 border-l-2 border-l-slate-400'
                              : isActive
                              ? 'border-l-2 border-l-emerald-500'
                              : ''
                          }`}
                        >
                          {/* Checkbox Column */}
                          <td
                            className="py-4 px-4 text-center min-w-0"
                            onClick={(e) => handleSelectOne(prop.id, e)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                            />
                          </td>
                          {/* Property Name & Location */}
                          <td className="py-4 px-5 min-w-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-slate-100 dark:bg-slate-800 border border-divider text-slate-500"
                              >
                                {prop.name.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate text-sm" title={prop.name}>
                                    {prop.name}
                                  </span>
                                  {isActive && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-700" /> {t('activePropertyBadge')}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span className="truncate">
                                    {prop.address ? `${prop.address}, ` : ''}
                                    {prop.city ? `${prop.city}, ${prop.country || 'IN'}` : 'Location Unset'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Progress & Onboarding Status */}
                          <td className="py-4 px-4 min-w-0">
                            <div className="space-y-1 max-w-[140px] min-w-0">
                              <div className="flex items-center justify-between text-[10px] font-extrabold">
                                <span className="text-slate-500 truncate">
                                  {prop.onboardingStep >= 6 ? t('filterLive') : t('filterSetup')}
                                </span>
                                <span className="text-emerald-700 font-black shrink-0">{stepPct}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                                  style={{ width: `${stepPct}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Policy Times */}
                          <td className="py-4 px-4 min-w-0 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-700 font-bold text-[11px]">
                              <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                              <span>{checkInTime} - {checkOutTime}</span>
                            </div>
                          </td>

                          {/* Specs (Rooms & Currency) */}
                          <td className="py-4 px-4 min-w-0">
                            <div className="flex flex-col gap-1 min-w-0">
                              <span className="font-extrabold text-slate-800 flex items-center gap-1 text-[11px] truncate">
                                <BedDouble className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span className="truncate">{roomTypesCount} Room Types</span>
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                                {prop.currency || 'INR'} • {prop.timezone || 'Asia/Kolkata'}
                              </span>
                            </div>
                          </td>

                          {/* Banking & Payments Status */}
                          <td className="py-4 px-4 min-w-0 whitespace-nowrap">
                            {hasPaymentSetup ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate">{t('configured')}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-extrabold">
                                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="truncate">{t('pendingSetup')}</span>
                              </span>
                            )}
                          </td>

                          {/* Quick Action Controls */}
                          <td className="py-4 px-5 text-right min-w-0 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleSwitch(prop)}
                                disabled={isActive || isSwitching}
                                className={`py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                  isActive
                                    ? 'bg-slate-50 text-slate-400 border border-divider opacity-70 cursor-default'
                                    : 'interactive bg-white hover:bg-slate-50 border border-divider text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                                } disabled:opacity-70`}
                              >
                                {isSwitching ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : isActive ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                                    <span className="truncate">{t('currentWorkspace')}</span>
                                  </>
                                ) : (
                                  <span className="truncate">{t('switchActiveWorkspace')}</span>
                                )}
                              </button>

                              <Link
                                href={`/settings/property?id=${prop.id}`}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all cursor-pointer shrink-0 active:scale-95"
                                title={t('viewFullSettings')}
                              >
                                <Settings className="w-4 h-4 text-slate-600" />
                              </Link>
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
            /* Detailed Property Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((prop) => {
                const isActive = prop.id === activeProperty?.id;
                const isSwitching = switchMutation.isPending && switchMutation.variables === prop.id;

                const stepPct = Math.min(100, Math.round(((prop.onboardingStep || 1) / 6) * 100));
                const checkInTime = prop.settings?.checkInTime || '14:00';
                const checkOutTime = prop.settings?.checkOutTime || '11:00';
                const hasPaymentSetup = !!(prop.settings?.upiId || prop.settings?.bankAccountDetails);
                const roomTypesCount = prop._count?.roomTypes ?? (prop.roomTypes?.length || 0);

                return (
                  <div
                    key={prop.id}
                    className={`rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between relative overflow-hidden bg-white/95 backdrop-blur-xl border hover:-translate-y-1 ${
                      isActive
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xl'
                        : 'border-slate-200/90 hover:border-emerald-400 hover:shadow-xl'
                    }`}
                  >
                    {/* Glowing Active Ribbon */}
                    {isActive && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-600 to-emerald-700 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-bl-2xl shadow-xs flex items-center gap-1 z-10">
                        <Check className="w-3.5 h-3.5" /> {t('activePropertyBadge')}
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Property Header & Avatar */}
                      <div className="flex items-start gap-3.5 pr-14 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black shrink-0 transition-transform shadow-xs ${
                            isActive
                              ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/30'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {prop.name.charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-base font-black text-slate-900 truncate leading-snug" title={prop.name}>
                            {prop.name}
                          </h3>
                          <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">
                              {prop.address ? `${prop.address}, ` : ''}
                              {prop.city ? `${prop.city}, ${prop.country || 'IN'}` : 'Location Unset'}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Onboarding Progress Bar */}
                      <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-500">{t('onboardingCompletion')}</span>
                          <span className="text-emerald-700 font-black">{stepPct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-700 transition-all duration-500"
                            style={{ width: `${stepPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Property Detailed Specs Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Check In / Out Policy */}
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 min-w-0">
                          <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 truncate">
                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{t('checkInCheckOutPolicy')}</span>
                          </div>
                          <span className="text-xs font-black text-slate-800 truncate block">
                            {checkInTime} - {checkOutTime}
                          </span>
                        </div>

                        {/* Payment Integration */}
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 min-w-0">
                          <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 truncate">
                            <CreditCard className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{t('paymentDetailsConfigured')}</span>
                          </div>
                          <span
                            className={`text-xs font-black truncate block flex items-center gap-1 ${
                              hasPaymentSetup ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {hasPaymentSetup ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate">{t('configured')}</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="truncate">{t('pendingSetup')}</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Room & Currency Metadata */}
                      <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <BedDouble className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span className="font-bold text-slate-900 truncate">{roomTypesCount} Room Types</span>
                        </div>

                        <div className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-700 shrink-0">
                          {prop.currency || 'INR'} • {prop.timezone || 'Asia/Kolkata'}
                        </div>
                      </div>

                      {/* Amenities Preview */}
                      {prop.amenities && prop.amenities.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {prop.amenities.slice(0, 3).map((am, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-[10px] font-extrabold truncate"
                            >
                              {am.name}
                            </span>
                          ))}
                          {prop.amenities.length > 3 && (
                            <span className="text-[10px] font-bold text-slate-400">
                              +{prop.amenities.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Action Buttons */}
                    <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      {/* Set Active Workspace Button */}
                      <button
                        onClick={() => handleSwitch(prop)}
                        disabled={isActive || isSwitching}
                        className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isActive
                            ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-200 cursor-default'
                            : 'bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-900 shadow-2xs active:scale-95'
                        } disabled:opacity-75`}
                      >
                        {isSwitching ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                        ) : isActive ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" /> {t('currentWorkspace')}
                          </>
                        ) : (
                          t('switchActiveWorkspace')
                        )}
                      </button>

                      {/* Configure Settings Button */}
                      <Link
                        href={`/settings/property?id=${prop.id}`}
                        className="py-2.5 px-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/90 text-emerald-900 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 shadow-2xs"
                        title={t('viewFullSettings')}
                      >
                        <Settings className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="hidden sm:inline">{t('viewFullSettings')}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-700" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating Bulk Action Bar */}
          <BulkActionBar
            selectedCount={selectedIds.length}
            totalCount={filteredProperties.length}
            onClearSelection={() => setSelectedIds([])}
            primaryActionLabel="Switch Active Workspace"
            onExportCSV={handleExportCSV}
            onMakeActiveBatch={() => {
              const targetProp = properties.find((p) => selectedIds.includes(p.id) && p.id !== activeProperty?.id);
              if (targetProp) handleSwitch(targetProp);
            }}
            isPending={switchMutation.isPending}
          />

          {/* Slide-Over Quick Drawer Preview */}
          <QuickDrawer
            property={drawerProperty}
            isActive={drawerProperty?.id === activeProperty?.id}
            onClose={() => setDrawerProperty(null)}
            onSwitch={handleSwitch}
            isSwitching={switchMutation.isPending && switchMutation.variables === drawerProperty?.id}
          />
        </main>
      </div>
    </div>
  );
}
