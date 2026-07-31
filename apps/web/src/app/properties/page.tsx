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
  Sparkles,
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
} from 'lucide-react';
import { useTranslation, LanguageSwitcher } from '@/lib/i18n';

export default function PropertiesPage() {
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'live' | 'setup'>('all');

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

  // Handle Switch Property
  const handleSwitch = (property: PropertyItem) => {
    if (property.id === activeProperty?.id) return;

    switchMutation.mutate(property.id, {
      onSuccess: () => {
        toast.success(`Switched active workspace to ${property.name}!`, 'Property Switched');
      },
      onError: (err: any) => {
        toast.error(err.message || 'Failed to switch property', 'Switch Failed');
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/90 text-slate-900 font-sans antialiased flex relative overflow-hidden">
      {/* Ambient Rich Emerald Glow */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Left Navigation Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-60 pl-0 pt-14 lg:pt-0 transition-all duration-300 relative z-10 flex flex-col min-h-screen">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-emerald-200/80 sticky top-0 z-30 px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-100/80 border border-emerald-200 text-emerald-800 shadow-xs shrink-0">
              <Building2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-slate-900 tracking-tight truncate">
                {t('propertiesPortfolio')}
              </h1>
              <p className="text-[11px] font-semibold text-emerald-700/80 truncate">
                {t('propertiesPortfolioSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Language Switcher Pill (English ↔ Malayalam) */}
            <LanguageSwitcher />

            {/* Single Primary Add Property Action */}
            {isOwner && (
              <Link
                href="/onboarding/property?new=true"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 active:scale-95 text-white text-xs font-black transition-all duration-200 shadow-md shadow-emerald-700/20 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-emerald-200" />
                <span className="truncate">{t('addProperty')}</span>
              </Link>
            )}
          </div>
        </header>

        {/* Properties Workspace */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1">
          
          {/* Hero Banner & Search Filter Bar */}
          <div className="p-6 rounded-3xl bg-white/95 backdrop-blur-xl border border-emerald-200/90 shadow-xs relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl min-w-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{t('propertiesPortfolio')} ({properties.length})</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 truncate">
                  {t('propertiesPortfolio')}
                </h2>
                <p className="text-xs text-slate-600 font-medium leading-relaxed truncate">
                  {t('propertiesPortfolioSubtitle')}
                </p>
              </div>

              {isOwner && (
                <Link
                  href="/onboarding/property?new=true"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white font-black text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
                >
                  <Plus className="w-4 h-4 text-emerald-200" />
                  <span className="truncate">{t('addProperty')}</span>
                </Link>
              )}
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
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0 scrollbar-none">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'all'
                      ? 'bg-emerald-700 text-white shadow-xs font-black'
                      : 'bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 text-slate-700 font-bold'
                  }`}
                >
                  {t('filterAll')} ({properties.length})
                </button>

                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'active'
                      ? 'bg-emerald-700 text-white shadow-xs font-black'
                      : 'bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 text-slate-700 font-bold'
                  }`}
                >
                  {t('filterActive')}
                </button>

                <button
                  onClick={() => setStatusFilter('live')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'live'
                      ? 'bg-emerald-700 text-white shadow-xs font-black'
                      : 'bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 text-slate-700 font-bold'
                  }`}
                >
                  {t('filterLive')}
                </button>

                <button
                  onClick={() => setStatusFilter('setup')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'setup'
                      ? 'bg-emerald-700 text-white shadow-xs font-black'
                      : 'bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 text-slate-700 font-bold'
                  }`}
                >
                  {t('filterSetup')}
                </button>
              </div>
            </div>
          </div>

          {/* Properties Grid */}
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

        </main>
      </div>
    </div>
  );
}
