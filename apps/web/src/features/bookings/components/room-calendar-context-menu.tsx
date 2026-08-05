'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/lib/i18n';
import { Plus, Sparkles, AlertCircle, Eye, X } from 'lucide-react';

export interface ContextMenuState {
  x: number;
  y: number;
  date: string;
  roomTypeId?: string;
  roomTypeName?: string;
}

interface RoomCalendarContextMenuProps {
  menuState: ContextMenuState | null;
  onClose: () => void;
  onNewBooking: (date: string, roomTypeId?: string) => void;
}

export function RoomCalendarContextMenu({
  menuState,
  onClose,
  onNewBooking,
}: RoomCalendarContextMenuProps) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!menuState) return null;

  const content = (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div
        ref={menuRef}
        className="pointer-events-auto absolute w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-150"
        style={{
          top: Math.min(window.innerHeight - 180, menuState.y),
          left: Math.min(window.innerWidth - 240, menuState.x),
        }}
      >
        <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-400 font-bold text-[10px] uppercase">
          <span>{menuState.date}</span>
          <button onClick={onClose} className="hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-3 h-3" />
          </button>
        </div>

        <button
          onClick={() => {
            onClose();
            onNewBooking(menuState.date, menuState.roomTypeId);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{t('contextNewBooking')}</span>
        </button>

        <button
          onClick={() => onClose()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{t('contextMarkClean')}</span>
        </button>

        <button
          onClick={() => onClose()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
        >
          <AlertCircle className="w-4 h-4 text-slate-400" />
          <span>{t('contextMarkDirty')}</span>
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
