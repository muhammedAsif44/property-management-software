'use client';

import React from 'react';

interface SectionLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'muted' | 'accent' | 'success' | 'warning' | 'danger';
}

export function SectionLabel({
  children,
  className = '',
  variant = 'default',
  ...props
}: SectionLabelProps) {
  const variantStyles = {
    default: 'text-slate-500 dark:text-slate-400',
    muted: 'text-slate-400 dark:text-slate-500',
    accent: 'text-blue-700 dark:text-blue-400',
    success: 'text-emerald-700 dark:text-emerald-400',
    warning: 'text-amber-700 dark:text-amber-400',
    danger: 'text-red-700 dark:text-red-400',
  };

  return (
    <span
      className={`text-xs font-bold tracking-tight normal-case ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
