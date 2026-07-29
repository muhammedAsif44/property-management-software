'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', title?: string, duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, message, type, title, duration };

      setToasts((prev) => [...prev.slice(-2), newToast]); // Limit to max 3 active toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((msg: string, title?: string) => showToast(msg, 'success', title), [showToast]);
  const error = useCallback((msg: string, title?: string) => showToast(msg, 'error', title), [showToast]);
  const info = useCallback((msg: string, title?: string) => showToast(msg, 'info', title), [showToast]);
  const warning = useCallback((msg: string, title?: string) => showToast(msg, 'warning', title), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      
      {/* Compact High-Performance Toast Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-xl transition-all duration-300 transform animate-toast-spring relative overflow-hidden bg-white/95 text-slate-900 ${
              toast.type === 'success'
                ? 'border-emerald-200 shadow-emerald-950/5'
                : toast.type === 'error'
                ? 'border-rose-200 shadow-rose-950/5'
                : toast.type === 'info'
                ? 'border-indigo-200 shadow-indigo-950/5'
                : 'border-amber-200 shadow-amber-950/5'
            }`}
          >
            {/* Left Icon Badge Chip - Compact 32px */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                toast.type === 'success'
                  ? 'bg-[#0B6E4F] text-white shadow-[#0B6E4F]/20'
                  : toast.type === 'error'
                  ? 'bg-rose-600 text-white shadow-rose-600/20'
                  : toast.type === 'info'
                  ? 'bg-[#360CAF] text-white shadow-[#360CAF]/20'
                  : 'bg-amber-500 text-white shadow-amber-500/20'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {toast.type === 'error' && <XCircle className="w-4 h-4" />}
              {toast.type === 'info' && <Info className="w-4 h-4" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
            </div>

            {/* Content Message */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider ${
                    toast.type === 'success'
                      ? 'text-[#0B6E4F]'
                      : toast.type === 'error'
                      ? 'text-rose-600'
                      : toast.type === 'info'
                      ? 'text-[#360CAF]'
                      : 'text-amber-600'
                  }`}
                >
                  {toast.title || (toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Notice' : 'Notification')}
                </span>
              </div>
              <p className="text-[12px] font-bold text-slate-800 leading-snug mt-0.5">
                {toast.message}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Animated Bottom Progress Line */}
            {toast.duration && toast.duration > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
                <div
                  className={`h-full transition-all duration-[4000ms] ease-linear w-0 ${
                    toast.type === 'success'
                      ? 'bg-[#0B6E4F]'
                      : toast.type === 'error'
                      ? 'bg-rose-500'
                      : toast.type === 'info'
                      ? 'bg-[#360CAF]'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
