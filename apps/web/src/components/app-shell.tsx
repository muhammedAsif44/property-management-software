'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { AppHeader } from '@/components/app-header';
import { SectionHeader, SectionTab } from '@/components/section-header';

/**
 * Semantic layout modes for consistent content width across the application.
 *
 * - "standard" (default) — max-w-7xl (1280px). KPI cards, forms, overview panels.
 * - "wide"    — max-w-[1600px]. Data tables, invoice lists, booking feeds.
 * - "full"    — No max-width constraint. Calendars, tape charts, visual tools.
 * - "narrow"  — max-w-4xl (896px). Focused forms, approval queues, detail views.
 */
export type AppShellLayout = 'standard' | 'wide' | 'full' | 'narrow';

const LAYOUT_MAX_WIDTH: Record<AppShellLayout, string> = {
  standard: 'max-w-7xl',
  wide:     'max-w-[1600px]',
  full:     '',
  narrow:   'max-w-4xl',
};

interface AppShellProps {
  children: React.ReactNode;
  /** Lucide icon for the current section */
  sectionIcon: LucideIcon;
  /** Section title (e.g., "Booking Management") */
  sectionTitle: string;
  /** Short contextual description for the section */
  sectionDescription?: string;
  /** Right-side action buttons for the section header */
  sectionActions?: React.ReactNode;
  /** Optional horizontal sub-navigation tabs for multi-page sections */
  sectionTabs?: SectionTab[];
  /** Semantic layout mode controlling content max-width (default: "standard") */
  layout?: AppShellLayout;
  /**
   * @deprecated Use `layout` prop instead. Kept for backward compatibility.
   */
  maxWidth?: string;
  /**
   * @deprecated Use `layout` prop instead. Kept for backward compatibility.
   */
  containerClassName?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  sectionIcon,
  sectionTitle,
  sectionDescription,
  sectionActions,
  sectionTabs,
  layout = 'standard',
  maxWidth,
  containerClassName,
}) => {
  // Resolve max-width: prefer new `layout` prop, fall back to deprecated `maxWidth`
  const resolvedMaxWidth = maxWidth
    ? maxWidth
    : LAYOUT_MAX_WIDTH[layout];

  // Resolve container padding: prefer deprecated `containerClassName`, else consistent default
  const resolvedPadding = containerClassName ?? 'px-4 lg:px-6 py-5 lg:py-6';

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#080c0a] text-slate-900 dark:text-slate-100 font-sans antialiased flex relative">
      {/* Persistent Left Navigation Sidebar */}
      <DashboardSidebar />

      {/* Main App Layout Shell */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Global Top Header — Property, Sync, Language, Notifications, Avatar */}
        <AppHeader />

        {/* Section Header — Title, Description, Actions, Sub-Navigation Tabs */}
        <SectionHeader
          icon={sectionIcon}
          title={sectionTitle}
          description={sectionDescription}
          actions={sectionActions}
          tabs={sectionTabs}
        />

        {/* Content Viewport Container */}
        <main className={`flex-1 w-full ${resolvedPadding}`}>
          <div className={`${resolvedMaxWidth} mx-auto space-y-5`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
