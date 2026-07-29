import React from 'react';

export interface AlertProps {
  type?: 'error' | 'success' | 'info';
  title?: string;
  message: string;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'error',
  title,
  message,
  onDismiss,
}) => {
  const styles = {
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    info: 'bg-slate-50 border-slate-200 text-slate-700',
  };

  const icons = {
    error: '⚠️',
    success: '🎉',
    info: 'ℹ️',
  };

  return (
    <div
      className={`p-4 rounded-2xl border text-xs font-medium flex items-start gap-3 animate-fadeIn ${styles[type]}`}
    >
      <span className="text-base leading-none">{icons[type]}</span>
      <div className="flex-1">
        {title && <div className="font-bold mb-0.5">{title}</div>}
        <div>{message}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 font-bold ml-2"
        >
          ×
        </button>
      )}
    </div>
  );
};
