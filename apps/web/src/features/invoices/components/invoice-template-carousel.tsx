'use client';

import React, { useState } from 'react';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Sparkles, CheckCircle2, Eye, FileText, Layout, ShieldCheck } from 'lucide-react';

export interface InvoiceTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  badgeText: string;
  previewBg: string;
  accentColor: string;
}

export const INVOICE_TEMPLATES: InvoiceTemplate[] = [
  {
    id: 'classic-hotel',
    name: 'Classic Hotel Folio',
    category: 'TRADITIONAL',
    description: 'Formal serif typography with detailed itemized tax breakdown and property seal.',
    badgeText: 'Most Popular',
    previewBg: 'from-emerald-900/90 to-slate-900',
    accentColor: '#047857',
  },
  {
    id: 'modern-resort',
    name: 'Modern Resort & Spa',
    category: 'LUXURY',
    description: 'Sleek obsidian-emerald branding with dynamic guest QR payment code.',
    badgeText: 'Recommended',
    previewBg: 'from-slate-900 to-emerald-950',
    accentColor: '#10b981',
  },
  {
    id: 'luxe-boutique',
    name: 'Luxe Boutique Suite',
    category: 'PREMIUM',
    description: 'Elegant minimalist layout tailored for boutique hotels and luxury stays.',
    badgeText: 'Boutique',
    previewBg: 'from-amber-950/80 to-slate-900',
    accentColor: '#f59e0b',
  },
  {
    id: 'minimal-pdf',
    name: 'Minimal Compact Grid',
    category: 'EXPRESS',
    description: 'Ultra-fast single-page PDF folio optimized for quick guest check-outs.',
    badgeText: 'Express Checkout',
    previewBg: 'from-blue-950/80 to-slate-900',
    accentColor: '#3b82f6',
  },
];

export interface InvoiceTemplateCarouselProps {
  activeTemplateId?: string;
  onSelectTemplate?: (id: string) => void;
}

export const InvoiceTemplateCarousel: React.FC<InvoiceTemplateCarouselProps> = ({
  activeTemplateId = 'classic-hotel',
  onSelectTemplate,
}) => {
  const [selectedId, setSelectedId] = useState(activeTemplateId);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelectTemplate?.(id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Guest PDF Invoice Template Selector
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Select visual theme for guest folios & billing receipts
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {INVOICE_TEMPLATES.map((tmpl) => {
          const isSelected = selectedId === tmpl.id;

          return (
            <SpotlightCard
              key={tmpl.id}
              onClick={() => handleSelect(tmpl.id)}
              spotlightColor="rgba(16, 185, 129, 0.16)"
              className={`cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                isSelected
                  ? 'border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                {/* Visual Preview Header */}
                <div
                  className={`relative h-28 rounded-xl bg-gradient-to-br ${tmpl.previewBg} p-3.5 flex flex-col justify-between overflow-hidden shadow-inner mb-3 border border-white/10`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
                      {tmpl.badgeText}
                    </span>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="w-16 h-1.5 rounded-full bg-white/40" />
                    <div className="w-24 h-1 rounded-full bg-white/25" />
                    <div className="w-12 h-1 rounded-full bg-white/25" />
                  </div>
                </div>

                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {tmpl.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <button
                type="button"
                className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-[#16241e] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1d3329]'
                }`}
              >
                {isSelected ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active Template</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Select Template</span>
                  </>
                )}
              </button>
            </SpotlightCard>
          );
        })}
      </div>
    </div>
  );
};
