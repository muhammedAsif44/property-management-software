'use client';

import React from 'react';
import { CheckCircle2, Download, Trash2, X, Zap, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export interface BulkActionItem {
  label: string;
  icon?: React.ReactNode;
  variant?: 'emerald' | 'rose' | 'amber' | 'slate';
  onClick: () => void;
  isPending?: boolean;
}

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  primaryActionLabel?: string;
  onMakeActiveBatch?: () => void;
  onExportCSV?: () => void;
  onBulkDelete?: () => void;
  customActions?: BulkActionItem[];
  isPending?: boolean;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  primaryActionLabel,
  onMakeActiveBatch,
  onExportCSV,
  onBulkDelete,
  customActions,
  isPending = false,
}) => {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-2xl text-white rounded-2xl shadow-2xl p-2 sm:p-2.5 border border-slate-700/80 flex items-center justify-between gap-2 sm:gap-3 max-w-2xl w-[94%] sm:w-auto animate-slideUp">
      {/* Selected Counter Badge */}
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-black shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-emerald-400 font-extrabold">{selectedCount}</span>
        <span className="text-slate-300 font-medium text-[11px]">
          / {totalCount} {t('selected')}
        </span>
      </div>

      {/* Action Buttons Strip */}
      <div className="flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-none">
        {customActions && customActions.length > 0 ? (
          customActions.map((action, idx) => {
            const variantStyles =
              action.variant === 'rose'
                ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/30'
                : action.variant === 'amber'
                ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/30'
                : action.variant === 'slate'
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md shadow-emerald-950/30';

            return (
              <button
                key={idx}
                type="button"
                onClick={action.onClick}
                disabled={action.isPending}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 border cursor-pointer disabled:opacity-50 ${variantStyles}`}
              >
                {action.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  action.icon || <Zap className="w-3.5 h-3.5" />
                )}
                <span className="truncate">{action.label}</span>
              </button>
            );
          })
        ) : (
          <>
            {onMakeActiveBatch && (
              <button
                type="button"
                onClick={onMakeActiveBatch}
                disabled={isPending}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 shadow-md shadow-emerald-950/30 cursor-pointer disabled:opacity-50 border border-emerald-500/30"
              >
                {isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                )}
                <span className="truncate">
                  {primaryActionLabel || t('bulkMakeActive') || 'Batch Action'}
                </span>
              </button>
            )}

            {onExportCSV && (
              <button
                type="button"
                onClick={onExportCSV}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline truncate">{t('exportCSV') || 'Export CSV'}</span>
              </button>
            )}

            {onBulkDelete && (
              <button
                type="button"
                onClick={onBulkDelete}
                className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-500/30 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline truncate">{t('delete') || 'Delete'}</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Clear Selection Button */}
      <button
        type="button"
        onClick={onClearSelection}
        className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        title={t('cancel')}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
