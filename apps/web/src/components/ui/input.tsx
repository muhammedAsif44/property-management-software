import React, { useState } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isPassword?: boolean;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, isPassword = false, icon, type = 'text', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            /* text-base sm:text-sm prevents iOS Safari auto-zoom on mobile focus */
            className={`w-full ${icon ? 'pl-10' : 'pl-3.5'} ${
              isPassword ? 'pr-12' : 'pr-3.5'
            } h-9 rounded-lg bg-slate-50 dark:bg-slate-900 border text-slate-900 dark:text-slate-100 text-base sm:text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all duration-150 ${
              error ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-800'
            } ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-1 px-1"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
