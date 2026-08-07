'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { PropertySwitcher } from '@/features/properties';
import { authService } from '@/features/auth';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  CalendarDays,
  BedDouble,
  Users,
  Receipt,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Menu,
  X,
  Droplets,
  BarChart3,
  Globe,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const DashboardSidebar: React.FC<SidebarProps> = () => {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch current user profile to determine role-based menu items
  const { data: profileData } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => authService.getProfile(),
    staleTime: 60000,
    retry: false,
  });

  const userObj = profileData?.user || profileData?.data?.user || profileData;
  const userName = userObj?.owner?.fullName || userObj?.fullName || userObj?.email || '';

  const userRole = profileData?.user?.role || profileData?.data?.user?.role || userObj?.role || 'OWNER';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isOwner = userRole === 'OWNER';
  const isManager = userRole === 'MANAGER';
  const isManagerOrOwner = isOwner || isManager || isSuperAdmin;
  const isHousekeeping = userRole === 'HOUSEKEEPING';
  const isReceptionist = userRole === 'RECEPTIONIST' || userRole === 'RECEPTION_STAFF';
  const isViewer = userRole === 'VIEWER';

  const rawNavigationItems: Array<{
    name: string;
    href: string;
    icon: any;
    active: boolean;
    visible: boolean;
    badge?: string;
  }> = [
    {
      name: t('dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
      visible: !isHousekeeping,
    },
    {
      name: t('bookings'),
      href: '/bookings',
      icon: Calendar,
      active: pathname === '/bookings',
      visible: !isHousekeeping,
    },
    {
      name: t('occupancyCalendar'),
      href: '/bookings/room-calendar',
      icon: CalendarDays,
      active: pathname.startsWith('/bookings/room-calendar'),
      visible: !isHousekeeping,
    },
    {
      name: t('roomsAndUnits'),
      href: '/rooms',
      icon: BedDouble,
      active: pathname.startsWith('/rooms'),
      visible: true,
    },
    {
      name: t('guests'),
      href: '/guests',
      icon: Users,
      active: pathname.startsWith('/guests'),
      visible: !isHousekeeping,
    },
    {
      name: t('channelManager'),
      href: '/settings/channels',
      icon: Globe,
      active: pathname.startsWith('/settings/channels'),
      visible: isManagerOrOwner && !isHousekeeping,
    },
    {
      name: t('agenciesAndTac'),
      href: '/agencies',
      icon: Building2,
      active: pathname.startsWith('/agencies'),
      visible: isManagerOrOwner && !isHousekeeping,
    },
    {
      name: t('invoicesAndBilling'),
      href: '/invoices',
      icon: Receipt,
      active: pathname.startsWith('/invoices'),
      visible: !isHousekeeping,
    },
    {
      name: t('housekeeping') || 'Housekeeping',
      href: '/housekeeping',
      icon: Droplets,
      active: pathname.startsWith('/housekeeping'),
      visible: true,
    },
    {
      name: t('reportsAndAnalytics') || 'Reports & Analytics',
      href: '/reports',
      icon: BarChart3,
      active: pathname.startsWith('/reports'),
      visible: isManagerOrOwner,
    },
    {
      name: t('properties'),
      href: '/properties',
      icon: Building2,
      active: pathname.startsWith('/properties'),
      visible: isOwner && !isHousekeeping,
    },
    {
      name: t('staffDirectory'),
      href: '/settings/staff',
      icon: Users,
      active: pathname.startsWith('/settings/staff'),
      visible: isManagerOrOwner && !isHousekeeping,
    },
    {
      name: t('settings'),
      href: '/settings',
      icon: Settings,
      active: pathname === '/settings',
      visible: !isHousekeeping,
    },
    {
      name: 'Super Admin',
      href: '/super-admin',
      icon: ShieldAlert,
      active: pathname.startsWith('/super-admin'),
      visible: userRole === 'SUPER_ADMIN',
    },
  ];

  const navigationItems = rawNavigationItems.filter((item) => item.visible);

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('You have been successfully logged out.', 'Logged Out');
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  return (
    <>
      {/* Mobile Top Navigation Header (< lg screens) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-emerald-200/80 px-4 py-2.5 flex items-center justify-between shadow-2xs">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/orvyn-logo.png"
            alt="Orvyn PMS"
            width={130}
            height={36}
            className="h-7 w-auto object-contain"
            priority
          />
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all cursor-pointer"
            aria-label="Toggle Mobile Navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Sliding Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex">
          <div className="bg-white w-72 max-w-[85vw] h-full flex flex-col justify-between p-4 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Image
                    src="/orvyn-logo.png"
                    alt="Orvyn PMS"
                    width={140}
                    height={40}
                    className="h-8 w-auto object-contain"
                  />
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="pt-1">
                <PropertySwitcher />
              </div>

              <nav className="space-y-1 pt-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isClickable = item.href !== '#';

                  return isClickable ? (
                    <Link
                      key={item.name}
                      href={item.href}
                      prefetch={true}
                      onMouseEnter={() => router.prefetch(item.href)}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        item.active
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-emerald-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ) : (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 cursor-not-allowed opacity-75"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate font-bold">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100"
              >
                <LogOut className="w-4 h-4" /> {t('signOut')}
              </button>
            </div>
          </div>

          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop Left Sidebar (>= lg screens) */}
      <aside
        className={`hidden lg:flex sticky top-0 h-screen shrink-0 z-40 bg-[#fbfcfd] dark:bg-[#09100d] border-r border-slate-200/80 dark:border-slate-800 transition-all duration-200 flex-col justify-between overflow-hidden ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* Top Header, Logo & Scrollable Nav Area */}
        <div className="p-3 space-y-3 flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-none">
          <div className="flex items-center justify-between px-1 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2 group overflow-hidden">
              <div className="relative flex items-center justify-center shrink-0">
                <Image
                  src="/orvyn-logo.png"
                  alt="Orvyn PMS"
                  width={140}
                  height={40}
                  className={`h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105 ${
                    collapsed ? 'scale-90' : ''
                  }`}
                  priority
                />
              </div>
            </Link>

            {/* Toggle Button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-slate-200/80 dark:border-slate-700 cursor-pointer"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Property Switcher Integration */}
          {!collapsed && (
            <div className="pt-1 shrink-0">
              <PropertySwitcher />
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1 pt-1 flex-1 overflow-y-auto scrollbar-none">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isClickable = item.href !== '#';

              return isClickable ? (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  onMouseEnter={() => router.prefetch(item.href)}
                  title={collapsed ? item.name : undefined}
                  className={`interactive flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold group relative ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    item.active
                      ? 'bg-slate-200/50 dark:bg-slate-800/60 text-emerald-800 dark:text-emerald-400 shadow-[inset_3px_0_0_0_#059669]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/40 shadow-[inset_3px_0_0_0_transparent]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      item.active ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`}
                  />
                  {!collapsed && <span className="truncate min-w-0">{item.name}</span>}
                </Link>
              ) : (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-not-allowed opacity-85 relative group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                    <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                    {!collapsed && <span className="truncate font-bold">{item.name}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-100/90 text-emerald-800 border border-emerald-200/80 shrink-0 whitespace-nowrap">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom User & Logout Footer - Always Pinned at Bottom */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2 bg-emerald-50/40 dark:bg-slate-900/60 shrink-0">
          {!collapsed && (
            <div className="p-2.5 rounded-xl bg-emerald-100/70 dark:bg-slate-800/60 border border-emerald-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-300/40 dark:border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div className="overflow-hidden text-left min-w-0 flex-1">
                <p className="text-[11px] font-extrabold truncate text-emerald-950 dark:text-slate-100 capitalize">
                  {userName || (isSuperAdmin ? 'Super Admin Portal' : isOwner ? t('ownerPortal') : userRole)}
                </p>
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="truncate">
                    {isSuperAdmin && 'Super Admin Portal'}
                    {isOwner && t('ownerPortal')}
                    {isManager && t('managerPortal')}
                    {isReceptionist && t('receptionPortal')}
                    {isHousekeeping && 'Housekeeping Portal'}
                    {isViewer && t('viewerPortal')}
                  </span>
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-all duration-200 border border-rose-100 hover:border-rose-200 cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
            title={t('signOut')}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0 text-rose-500" />
            {!collapsed && <span>{t('signOut')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
