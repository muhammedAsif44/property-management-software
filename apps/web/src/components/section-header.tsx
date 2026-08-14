'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';

export interface SectionTab {
  label: string;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
  icon?: LucideIcon;
  count?: number | string;
}

export interface SectionBreadcrumb {
  parent: string;
  parentHref?: string;
}

interface SectionHeaderProps {
  /** Lucide icon for the section */
  icon: LucideIcon;
  /** Section title (e.g. "Reservations Feed") */
  title: string;
  /** Short contextual description */
  description?: string;
  /** Optional breadcrumb hierarchy context (e.g. { parent: "Booking Management" }) */
  breadcrumb?: SectionBreadcrumb;
  /** Right-side action buttons */
  actions?: React.ReactNode;
  /** Optional genuine page-level sub-navigation tabs */
  tabs?: SectionTab[];
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon: Icon,
  title,
  description,
  breadcrumb,
  actions,
  tabs,
}) => {
  const pathname = usePathname();

  return (
    <div className="bg-white dark:bg-[#09100d] border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
      {/* Section Title Bar */}
      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 text-[#0B6E4F] dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            {breadcrumb && (
              <div className="text-[10px] font-bold text-[#0B6E4F] dark:text-emerald-400 tracking-wider uppercase flex items-center gap-1.5 leading-none mb-0.5">
                {breadcrumb.parentHref ? (
                  <Link href={breadcrumb.parentHref} className="hover:underline">
                    {breadcrumb.parent}
                  </Link>
                ) : (
                  <span>{breadcrumb.parent}</span>
                )}
                <span className="text-slate-300 dark:text-slate-700">•</span>
              </div>
            )}
            <h1 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate leading-tight">
              {title}
            </h1>
            {description && (
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Optional Genuine Page-Level Sub-Navigation Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="px-4 lg:px-6 flex items-center gap-1 -mb-px overflow-x-auto scrollbar-none border-t border-slate-100 dark:border-slate-800/60">
          {tabs.map((tab, idx) => {
            const TabIcon = tab.icon;
            const isTabActive =
              tab.isActive !== undefined
                ? tab.isActive
                : tab.href
                ? pathname === tab.href ||
                  (!tabs.some((t) => t.href === pathname) &&
                    tab.href !== '/' &&
                    pathname.startsWith(tab.href + '/'))
                : false;

            const tabContent = (
              <>
                {TabIcon && (
                  <TabIcon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isTabActive
                        ? 'text-[#0B6E4F] dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`}
                  />
                )}
                <span className="truncate">{tab.label}</span>
                {tab.count !== undefined && tab.count !== null && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold transition-colors ${
                      isTabActive
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {/* Active Underline Indicator */}
                {isTabActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0B6E4F] dark:bg-emerald-400 rounded-full" />
                )}
              </>
            );

            const baseClasses = `group relative py-2.5 px-3 flex items-center gap-2 text-xs font-semibold whitespace-nowrap transition-colors outline-none cursor-pointer ${
              isTabActive
                ? 'text-[#0B6E4F] dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`;

            if (tab.href) {
              return (
                <Link
                  key={tab.href || idx}
                  href={tab.href}
                  prefetch={true}
                  className={baseClasses}
                >
                  {tabContent}
                </Link>
              );
            }

            return (
              <button
                key={tab.label || idx}
                type="button"
                onClick={tab.onClick}
                className={baseClasses}
              >
                {tabContent}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
