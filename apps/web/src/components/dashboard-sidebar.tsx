'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { PropertySwitcher } from '@/features/properties';
import { authService } from '@/features/auth';
import { useToast } from '@/components/ui/toast';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  BedDouble,
  Users,
  Receipt,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const DashboardSidebar: React.FC<SidebarProps> = () => {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [collapsed, setCollapsed] = useState(false);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      name: 'Properties',
      href: '/settings/property',
      icon: Building2,
      active: pathname.startsWith('/settings/property') || pathname.startsWith('/onboarding/property'),
    },
    {
      name: 'Staff Directory',
      href: '/settings/staff',
      icon: Users,
      active: pathname.startsWith('/settings/staff'),
    },
    {
      name: 'Bookings',
      href: '#',
      icon: Calendar,
      active: pathname.startsWith('/bookings'),
      badge: 'Coming Soon',
    },
    {
      name: 'Rooms & Units',
      href: '#',
      icon: BedDouble,
      active: pathname.startsWith('/rooms'),
      badge: 'Coming Soon',
    },
    {
      name: 'Guests',
      href: '#',
      icon: Users,
      active: pathname.startsWith('/guests'),
      badge: 'Coming Soon',
    },
    {
      name: 'Invoices & Billing',
      href: '#',
      icon: Receipt,
      active: pathname.startsWith('/invoices'),
      badge: 'Coming Soon',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

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
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-white/95 backdrop-blur-2xl border-r border-emerald-200/80 transition-all duration-300 flex flex-col justify-between ${
        collapsed ? 'w-16' : 'w-60'
      } shadow-xl shadow-emerald-950/5`}
    >
      {/* Top Header & Brand Logo */}
      <div className="p-3 space-y-4">
        <div className="flex items-center justify-between px-1">
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
            className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 text-emerald-700 transition-all border border-emerald-200/80"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Property Switcher Integration */}
        {!collapsed && (
          <div className="pt-1">
            <PropertySwitcher />
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1 pt-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isClickable = item.href !== '#';

            return isClickable ? (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 group relative ${
                  item.active
                    ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 text-white shadow-md shadow-emerald-700/20 border border-emerald-500/30'
                    : 'text-slate-700 hover:text-emerald-900 hover:bg-emerald-100/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                    item.active ? 'text-white' : 'text-emerald-700 group-hover:text-emerald-800'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            ) : (
              <div
                key={item.name}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-not-allowed opacity-80 relative group"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </div>
                {!collapsed && item.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100/90 text-emerald-800 border border-emerald-200/80">
                    Soon
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom User & Logout Footer */}
      <div className="p-2.5 border-t border-emerald-100/80 space-y-2 bg-emerald-50/30">
        {!collapsed && (
          <div className="p-2 rounded-xl bg-emerald-100/70 border border-emerald-200/90 text-emerald-950 shadow-xs flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-bold shrink-0 border border-emerald-300/40">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-[11px] font-black truncate text-emerald-950">Owner Portal</p>
              <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Active
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-all duration-200 border border-rose-100 hover:border-rose-200 ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
