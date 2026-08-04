import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

/**
 * A minimal, neutral empty state component that standardizes
 * empty-state presentation across the dashboard and app.
 * Follows the established psychology-driven SaaS UI pattern.
 */
export function EmptyState({ icon: Icon, title, description, className = '' }: EmptyStateProps) {
  return (
    <div className={`p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-divider border-dashed space-y-2 flex flex-col items-center justify-center ${className}`}>
      <Icon className="w-8 h-8 text-slate-400" />
      <div className="space-y-0.5">
        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-[11px] text-slate-500 font-medium">{description}</p>
      </div>
    </div>
  );
}
