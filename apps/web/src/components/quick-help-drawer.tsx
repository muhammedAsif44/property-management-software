'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X, Lightbulb, Plus, MousePointerClick, Layers } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export interface HelpStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface QuickHelpDrawerProps {
  title?: string;
  subtitle?: string;
  steps?: HelpStep[];
}

export function QuickHelpDrawer({
  title,
  subtitle,
  steps
}: QuickHelpDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const drawerContent = (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100/80 text-emerald-800 border border-emerald-200">
              <Lightbulb className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">{title || t('quickHelpTitle')}</h3>
              <p className="text-xs text-slate-500 font-medium">{subtitle || t('quickHelpSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Steps Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {(steps || [
            { icon: <Plus className="w-4 h-4 text-slate-500 shrink-0" />, title: t('helpGuideStep1Title'), description: t('helpGuideStep1Desc') },
            { icon: <MousePointerClick className="w-4 h-4 text-slate-500 shrink-0" />, title: t('helpGuideStep2Title'), description: t('helpGuideStep2Desc') },
            { icon: <Layers className="w-4 h-4 text-slate-500 shrink-0" />, title: t('helpGuideStep3Title'), description: t('helpGuideStep3Desc') }
          ]).map((step, index) => (
            <div key={index} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                {index + 1}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                  {step.icon}
                  <span>{step.title}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed min-w-0">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            {t('closePreview')}
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <>
      {/* Help Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-500 hover:text-slate-900 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
        title={t('quickHelpDrawerTooltip')}
        aria-label={t('quickHelpDrawerTooltip')}
      >
        <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
      </button>

      {/* Render via Portal so it escapes CSS backdrop-blur stacking context */}
      {isOpen && mounted && createPortal(drawerContent, document.body)}
    </>
  );
};
