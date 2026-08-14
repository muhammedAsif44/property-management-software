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
          <label className="block text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-emerald-400 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            /* text-base sm:text-sm prevents iOS Safari auto-zoom on mobile focus */
            className={`w-full ${icon ? 'pl-10' : 'pl-3.5'} ${
              isPassword ? 'pr-12' : 'pr-3.5'
            } h-10 rounded-xl bg-slate-50 dark:bg-[#16241e] border text-slate-900 dark:text-white text-base sm:text-sm font-medium placeholder-slate-400 dark:placeholder-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#1c2e26] transition-all duration-150 ${
              error ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20' : 'border-slate-200 dark:border-[#1d3329]'
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
