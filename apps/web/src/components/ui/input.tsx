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
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-4 text-slate-400 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            /* text-base sm:text-sm prevents iOS Safari auto-zoom on mobile focus */
            className={`w-full ${icon ? 'pl-11' : 'pl-4'} ${
              isPassword ? 'pr-12' : 'pr-4'
            } py-3.5 rounded-2xl bg-slate-50/90 border text-slate-900 text-base sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white transition-all duration-200 ${
              error ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200/90'
            } ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors py-2 px-1"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-500 font-semibold">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
