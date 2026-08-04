import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'emerald' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'emerald',
  size = 'md',
  isLoading = false,
  loadingText,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'font-semibold tracking-tight rounded-lg transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer';

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-xs',
    lg: 'h-10 px-5 text-sm',
  };

  const variantStyles = {
    emerald:
      'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-2xs',
    secondary:
      'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
    outline:
      'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-2xs',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-3.5 w-3.5 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {icon && <span className="inline-flex">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
