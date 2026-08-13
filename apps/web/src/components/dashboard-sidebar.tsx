'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { PropertySwitcher } from '@/features/properties';
import { authService } from '@/features/auth';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import {
  Search,
  LayoutDashboard,
  Calendar,
  CalendarDays,
  ShieldCheck,
  BedDouble,
  Users,
  Globe,
  Building2,
  Receipt,
  Droplets,
  BarChart3,
  Settings,
  ShieldAlert,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  PlusCircle,
  ChevronsUpDown,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Fetch current user profile for role authorizations & avatar badge
  const { data: profileData } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => authService.getProfile(),
    staleTime: 60000,
    retry: false,
  });

  const userObj = profileData?.user || profileData?.data?.user || profileData;
  const userName = userObj?.owner?.fullName || userObj?.fullName || userObj?.email || 'Orvyn Administrator';
  const userEmail = userObj?.email || 'admin@orvynpms.com';

  const userRole = profileData?.user?.role || profileData?.data?.user?.role || userObj?.role || 'OWNER';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isOwner = userRole === 'OWNER';
  const isManager = userRole === 'MANAGER';
  const isManagerOrOwner = isOwner || isManager || isSuperAdmin;
  const isHousekeeping = userRole === 'HOUSEKEEPING';

  // Avatar Initials
  const userInitials = useMemo(() => {
    if (!userName) return 'OP';
    const parts = userName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return userName.slice(0, 2).toUpperCase();
  }, [userName]);

  // Authentic Orvyn PMS Navigation Architecture
  const rawNavigationGroups: Array<{
    id: string;
    title: string;
    icon: any;
    visible: boolean;
    items: Array<{
      name: string;
      href: string;
      icon: any;
      visible: boolean;
    }>;
  }> = useMemo(
    () => [
      {
        id: 'frontDeskOps',
        title: t('frontDeskOperations') || 'Front Desk Operations',
        icon: CalendarDays,
        visible: !isHousekeeping,
        items: [
          {
            name: t('occupancyCalendar') || 'Tape Chart / Room Calendar',
            href: '/bookings/room-calendar',
            icon: CalendarDays,
            visible: true,
          },
          {
            name: t('approvalQueue') || 'Approval Requests',
            href: '/bookings/approvals',
            icon: ShieldCheck,
            visible: isManagerOrOwner,
          },
        ],
      },
      {
        id: 'bookingMgmt',
        title: t('bookingManagement') || 'Booking Management',
        icon: Calendar,
        visible: !isHousekeeping,
        items: [
          {
            name: t('bookings') || 'Reservations Feed',
            href: '/bookings',
            icon: Calendar,
            visible: true,
          },
          {
            name: t('newBooking') || 'New Reservation',
            href: '/bookings/new',
            icon: PlusCircle,
            visible: true,
          },
        ],
      },
      {
        id: 'guestsCrm',
        title: t('guestsAndCrm') || 'Guests & CRM',
        icon: Users,
        visible: !isHousekeeping,
        items: [
          {
            name: t('guests') || 'Guest Directory',
            href: '/guests',
            icon: Users,
            visible: true,
          },
        ],
      },
      {
        id: 'roomsOps',
        title: t('roomsAndOperations') || 'Rooms & Housekeeping',
        icon: BedDouble,
        visible: true,
        items: [
          {
            name: t('roomsAndUnits') || 'Rooms & Physical Units',
            href: '/rooms',
            icon: BedDouble,
            visible: true,
          },
          {
            name: t('housekeeping') || 'Housekeeping Operations',
            href: '/housekeeping',
            icon: Droplets,
            visible: true,
          },
        ],
      },
      {
        id: 'channelsDist',
        title: t('channelManagerTitle') || 'Channel Manager & OTAs',
        icon: Globe,
        visible: isManagerOrOwner && !isHousekeeping,
        items: [
          {
            name: t('channelManager') || 'OTA Channel Sync',
            href: '/settings/channels',
            icon: Globe,
            visible: true,
          },
          {
            name: t('agenciesAndTac') || 'Travel Agencies & TAC',
            href: '/agencies',
            icon: Building2,
            visible: true,
          },
        ],
      },
      {
        id: 'financialsBilling',
        title: t('financialsAndBilling') || 'Financials & Billing',
        icon: Receipt,
        visible: !isHousekeeping,
        items: [
          {
            name: t('invoicesAndBilling') || 'Invoices & Billing',
            href: '/invoices',
            icon: Receipt,
            visible: true,
          },
          {
            name: t('reportsAndAnalytics') || 'Reports & Analytics',
            href: '/reports',
            icon: BarChart3,
            visible: isManagerOrOwner,
          },
        ],
      },
      {
        id: 'sysAdmin',
        title: t('systemAdministration') || 'System Administration',
        icon: Settings,
        visible: !isHousekeeping,
        items: [
          {
            name: t('properties') || 'Properties Portfolio',
            href: '/properties',
            icon: Building2,
            visible: isOwner,
          },
          {
            name: t('staffDirectory') || 'Staff Directory',
            href: '/settings/staff',
            icon: Users,
            visible: isManagerOrOwner,
          },
          {
            name: t('settings') || 'System Settings',
            href: '/settings',
            icon: Settings,
            visible: true,
          },
          {
            name: 'Super Admin Panel',
            href: '/super-admin',
            icon: ShieldAlert,
            visible: isSuperAdmin,
          },
        ],
      },
    ],
    [t, isHousekeeping, isManagerOrOwner, isOwner, isSuperAdmin]
  );

  // Synchronous route matching helper
  const checkSubActive = (href: string) => {
    if (href === '/bookings') return pathname === '/bookings';
    if (href === '/settings') return pathname === '/settings';
    if (href === '/rooms') return pathname === '/rooms';
    if (href === '/guests') return pathname === '/guests';
    if (href === '/invoices') return pathname === '/invoices';
    if (href === '/reports') return pathname === '/reports';
    if (href === '/properties') return pathname === '/properties';
    if (href === '/agencies') return pathname === '/agencies';
    if (href === '/housekeeping') return pathname === '/housekeeping';
    if (href === '/settings/channels') return pathname.startsWith('/settings/channels');
    if (href === '/settings/staff') return pathname.startsWith('/settings/staff');
    if (href === '/super-admin') return pathname.startsWith('/super-admin');
    return pathname === href || pathname.startsWith(href);
  };

  // Compute active expanded group state synchronously during initial render
  const initialActiveGroups = useMemo(() => {
    const activeStates: Record<string, boolean> = {};
    rawNavigationGroups.forEach((g) => {
      const isChildActive = g.items?.some((it) => checkSubActive(it.href));
      if (isChildActive) {
        activeStates[g.id] = true;
      }
    });
    return activeStates;
  }, [pathname, rawNavigationGroups]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(initialActiveGroups);

  // Synchronize when pathname changes
  useEffect(() => {
    setExpandedGroups((prev) => {
      const activeStates: Record<string, boolean> = {};
      let hasActive = false;
      rawNavigationGroups.forEach((g) => {
        const isChildActive = g.items?.some((it) => checkSubActive(it.href));
        if (isChildActive) {
          activeStates[g.id] = true;
          hasActive = true;
        }
      });
      return hasActive ? activeStates : prev;
    });
  }, [pathname, rawNavigationGroups]);

  // Exclusive Accordion Toggle
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const isAlreadyOpen = prev[groupId];
      if (isAlreadyOpen) {
        return {};
      }
      return { [groupId]: true };
    });
  };

  // Deep Search filter
  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return rawNavigationGroups
      .filter((g) => g.visible)
      .map((g) => {
        if (!query) return g;
        const groupMatches = g.title.toLowerCase().includes(query);
        const filteredItems = g.items?.filter(
          (item) => item.visible && item.name.toLowerCase().includes(query)
        );

        if (groupMatches) return g;
        if (filteredItems && filteredItems.length > 0) {
          return {
            ...g,
            items: filteredItems,
          };
        }
        return null;
      })
      .filter(Boolean) as typeof rawNavigationGroups;
  }, [searchQuery, rawNavigationGroups]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('You have been successfully logged out.', 'Logged Out');
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const isDashboardActive = pathname === '/dashboard';

  return (
    <>
      {/* Mobile Top Header (< lg screens) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-2xs">
        <Link
          href="/dashboard"
          prefetch={true}
          onMouseEnter={() => router.prefetch('/dashboard')}
          className="flex items-center gap-2 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
        >
          <Image
            src="/orvyn-logo.png"
            alt="Orvyn PMS"
            width={140}
            height={40}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-slate-700 transition-all cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none"
            aria-label="Toggle Mobile Navigation"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex">
          <div className="bg-white dark:bg-slate-900 w-80 max-w-[88vw] h-full flex flex-col justify-between p-4 shadow-2xl animate-in slide-in-from-left duration-200 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <Link
                  href="/dashboard"
                  prefetch={true}
                  onClick={() => setMobileOpen(false)}
                  className="outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
                >
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
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={t('searchMenus') || 'Search menus...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/40 transition-all"
                />
              </div>

              <div className="pt-1">
                <PropertySwitcher />
              </div>

              <nav className="space-y-1.5 pt-2">
                {!isHousekeeping && (
                  <Link
                    href="/dashboard"
                    prefetch={true}
                    onMouseEnter={() => router.prefetch('/dashboard')}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none border-0 ${
                      isDashboardActive
                        ? 'bg-[#0B6E4F] text-white font-bold shadow-2xs'
                        : 'text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <LayoutDashboard className={`w-4.5 h-4.5 shrink-0 ${isDashboardActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate min-w-0">{t('dashboard') || 'Dashboard Hub'}</span>
                  </Link>
                )}

                {filteredGroups.map((group) => {
                  const GroupIcon = group.icon;
                  const isExpanded = !!expandedGroups[group.id] || !!searchQuery;

                  return (
                    <div key={group.id} className="space-y-1">
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] transition-all duration-200 ease-in-out cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none border-0 ${
                          isExpanded
                            ? 'bg-[#0B6E4F] text-white font-bold shadow-2xs'
                            : 'bg-transparent text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <GroupIcon className={`w-4.5 h-4.5 shrink-0 ${isExpanded ? 'text-white' : 'text-slate-500'}`} />
                          <span className="truncate min-w-0">{group.title}</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 ml-1 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-white' : 'rotate-0 text-slate-400'
                          }`}
                        />
                      </button>

                      {/* Animated Accordion */}
                      <div
                        className={`grid transition-all duration-200 ease-in-out ${
                          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="ml-5 pl-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-1 py-1">
                            {group.items?.map((subItem) => {
                              const SubIcon = subItem.icon;
                              const isSubActive = checkSubActive(subItem.href);

                              return (
                                <Link
                                  key={subItem.name}
                                  href={subItem.href}
                                  prefetch={true}
                                  onMouseEnter={() => router.prefetch(subItem.href)}
                                  onFocus={() => router.prefetch(subItem.href)}
                                  onClick={() => setMobileOpen(false)}
                                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] transition-all duration-150 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none ${
                                    isSubActive
                                      ? 'border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-bold shadow-2xs'
                                      : 'text-slate-600 dark:text-slate-400 font-medium hover:text-[#0B6E4F] dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                                  }`}
                                >
                                  <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-[#0B6E4F] dark:text-emerald-400' : 'text-slate-400'}`} />
                                  <span className="truncate min-w-0">{subItem.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none"
              >
                <LogOut className="w-4 h-4" /> {t('signOut')}
              </button>
            </div>
          </div>

          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop Left Sidebar (>= lg screens, width w-[272px], inheriting app's standard font-sans) */}
      <aside
        className={`hidden lg:flex sticky top-0 h-screen shrink-0 z-40 bg-white dark:bg-[#09100d] border-r border-slate-200/90 dark:border-slate-800 transition-all duration-200 flex-col justify-between overflow-hidden ${
          collapsed ? 'w-20' : 'w-[272px]'
        }`}
      >
        {/* Top Header & Scrollable Nav Area */}
        <div className="p-3.5 space-y-3.5 flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-none">
          {/* Brand Header Logo */}
          <div className="flex items-center justify-between px-1 shrink-0 pt-1">
            {!collapsed ? (
              <Link
                href="/dashboard"
                prefetch={true}
                onMouseEnter={() => router.prefetch('/dashboard')}
                className="flex items-center gap-2 group overflow-hidden outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
              >
                <Image
                  src="/orvyn-logo.png"
                  alt="Orvyn PMS"
                  width={140}
                  height={40}
                  className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                  priority
                />
              </Link>
            ) : (
              <Link
                href="/dashboard"
                prefetch={true}
                onMouseEnter={() => router.prefetch('/dashboard')}
                className="mx-auto outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
              >
                <div className="w-9 h-9 rounded-xl bg-[#0B6E4F] text-white font-bold flex items-center justify-center shadow-xs text-sm">
                  O
                </div>
              </Link>
            )}

            {/* Collapse Toggle Button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-slate-200/80 dark:border-slate-700 cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Search Box Input */}
          {!collapsed && (
            <div className="relative shrink-0 pt-0.5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t('searchMenus') || 'Search menus...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/40 transition-all"
              />
            </div>
          )}

          {/* Property Switcher Integration */}
          {!collapsed && (
            <div className="shrink-0">
              <PropertySwitcher />
            </div>
          )}

          {/* Clean SaaS Navigation Typography & Balanced Hierarchy */}
          <nav className="space-y-1.5 flex-1 overflow-y-auto scrollbar-none pt-1">
            {/* Direct Dashboard Link */}
            {!isHousekeeping && (
              <Link
                href="/dashboard"
                prefetch={true}
                onMouseEnter={() => router.prefetch('/dashboard')}
                onFocus={() => router.prefetch('/dashboard')}
                title={collapsed ? t('dashboard') || 'Dashboard' : undefined}
                className={`interactive flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] transition-all duration-150 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none border-0 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isDashboardActive
                    ? 'bg-[#0B6E4F] text-white font-bold shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 font-semibold hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                }`}
              >
                <LayoutDashboard
                  className={`w-4.5 h-4.5 shrink-0 ${
                    isDashboardActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate min-w-0">{t('dashboard') || 'Dashboard Hub'}</span>
                )}
              </Link>
            )}

            {/* Category Groups & Sub-items */}
            {filteredGroups.map((group) => {
              const GroupIcon = group.icon;
              const isExpanded = !!expandedGroups[group.id] || !!searchQuery;

              return (
                <div key={group.id} className="space-y-1">
                  {/* Category Header Button: font-semibold when inactive, font-bold when expanded/active */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    title={collapsed ? group.title : undefined}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] transition-all duration-200 ease-in-out cursor-pointer border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none ${
                      collapsed ? 'justify-center' : ''
                    } ${
                      isExpanded
                        ? 'bg-[#0B6E4F] text-white font-bold shadow-2xs'
                        : 'bg-transparent text-slate-700 dark:text-slate-300 font-semibold hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <GroupIcon
                        className={`w-4.5 h-4.5 shrink-0 transition-colors duration-150 ${
                          isExpanded
                            ? 'text-white'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      />
                      {!collapsed && (
                        <span className="truncate min-w-0 tracking-tight">{group.title}</span>
                      )}
                    </div>

                    {!collapsed && (
                      <div className="shrink-0 ml-1">
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-white' : 'rotate-0 text-slate-400'
                          }`}
                        />
                      </div>
                    )}
                  </button>

                  {/* Submenu Accordion: font-medium when inactive, font-bold when active */}
                  {!collapsed && (
                    <div
                      className={`grid transition-all duration-200 ease-in-out ${
                        isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="ml-5 pl-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-1 py-1">
                          {group.items?.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = checkSubActive(subItem.href);

                            return (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                prefetch={true}
                                onMouseEnter={() => router.prefetch(subItem.href)}
                                onFocus={() => router.prefetch(subItem.href)}
                                className={`interactive flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] transition-all duration-150 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none ${
                                  isSubActive
                                    ? 'border border-emerald-300 dark:border-emerald-700 bg-emerald-50/90 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-bold shadow-2xs'
                                    : 'text-slate-600 dark:text-slate-400 font-medium hover:text-[#0B6E4F] dark:hover:text-emerald-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 border border-transparent'
                                }`}
                              >
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isSubActive
                                      ? 'text-[#0B6E4F] dark:text-emerald-400'
                                      : 'text-slate-400 dark:text-slate-400'
                                  }`}
                                />
                                <span className="truncate min-w-0">{subItem.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Pinned User Profile Tile */}
        <div className="p-3 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 shrink-0 relative">
          {!collapsed ? (
            <div
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-slate-100 flex items-center justify-between gap-2 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-all shadow-2xs outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none"
            >
              <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                {/* Avatar Initials Badge Box */}
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 border border-emerald-300/80 dark:border-emerald-700 text-xs">
                  {userInitials}
                </div>

                <div className="overflow-hidden text-left min-w-0 flex-1">
                  <p className="text-xs font-bold truncate text-slate-900 dark:text-slate-100 leading-tight">
                    {userName}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                    {userEmail}
                  </p>
                </div>
              </div>

              <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            </div>
          ) : (
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex justify-center p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700 text-xs cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none"
              title={userName}
            >
              {userInitials}
            </button>
          )}

          {/* User Profile Popover */}
          {showUserMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/80 mb-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{userName}</p>
                <p className="text-[11px] text-[#0B6E4F] dark:text-emerald-400 font-semibold capitalize mt-0.5">
                  {userRole}
                </p>
              </div>

              <Link
                href="/settings"
                prefetch={true}
                onMouseEnter={() => router.prefetch('/settings')}
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
              >
                <Settings className="w-4 h-4 text-slate-500" /> {t('settings')}
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer mt-1 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none"
              >
                <LogOut className="w-4 h-4 text-rose-500" /> {t('signOut')}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
