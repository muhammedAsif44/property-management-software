'use client';

import React from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { AppHeader } from '@/components/app-header';

interface AppShellProps {
  children: React.ReactNode;
  /** Optional custom header actions or search */
  headerActions?: React.ReactNode;
  /** Optional left side title or breadcrumb override for the header */
  headerTitle?: React.ReactNode;
  /** Constrain max width for optimal reading (default: max-w-5xl ~ 1024px) */
  maxWidth?: 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-full';
  /** Additional container padding styling */
  containerClassName?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  headerActions,
  headerTitle,
  maxWidth = 'max-w-5xl',
  containerClassName = 'p-4 lg:p-6',
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased flex relative">
      {/* Persistent Left Navigation Sidebar */}
      <DashboardSidebar />

      {/* Main App Layout Shell */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Persistent Top Header */}
        <AppHeader actions={headerActions}>
          {headerTitle}
        </AppHeader>

        {/* Content Viewport Container */}
        <main className={`flex-1 w-full ${containerClassName}`}>
          <div className={`${maxWidth} mx-auto space-y-6 animate-fadeIn`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
