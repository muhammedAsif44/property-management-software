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
      className={`fixed top-0 left-0 bottom-0 z-40 bg-white/90 backdrop-blur-2xl border-r border-slate-200/80 transition-all duration-300 flex flex-col justify-between ${
        collapsed ? 'w-20' : 'w-64'
      } shadow-lg shadow-slate-200/50`}
    >
      {/* Top Header & Brand Logo */}
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between px-2">
          <Link href="/dashboard" className="flex items-center gap-3 group overflow-hidden">
            <div className="relative flex items-center justify-center shrink-0">
              <Image
                src="/orvyn-logo.png"
                alt="Orvyn PMS"
                width={160}
                height={48}
                className={`h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105 ${
                  collapsed ? 'scale-90' : ''
                }`}
                priority
              />
            </div>
          </Link>

          {/* Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-500 transition-all border border-slate-200/60"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Property Switcher Integration */}
        {!collapsed && (
          <div className="pt-2 px-1">
            <PropertySwitcher />
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1.5 pt-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isClickable = item.href !== '#';

            return isClickable ? (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 group relative ${
                  item.active
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    item.active ? 'text-white' : 'text-slate-500 group-hover:text-emerald-600'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            ) : (
              <div
                key={item.name}
                className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold text-slate-400 cursor-not-allowed opacity-75 relative group"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </div>
                {!collapsed && item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
                    Soon
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom User & Logout Footer */}
      <div className="p-4 border-t border-slate-200/80 space-y-3 bg-slate-50/50">
        {!collapsed && (
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-xs font-extrabold text-slate-900 truncate">Owner Portal</p>
              <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Active
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all duration-200 border border-rose-100 hover:border-rose-200 ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
