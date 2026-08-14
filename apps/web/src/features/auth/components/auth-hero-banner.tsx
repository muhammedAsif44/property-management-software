'use client';

import React from 'react';
import Image from 'next/image';
import Strands from '@/components/ui/strands';
import { useTranslation } from '@/lib/i18n';
import { ShieldCheck, Sparkles } from 'lucide-react';

export const AuthHeroBanner: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="lg:col-span-5 emerald-gradient bg-gradient-to-br from-[#06100b] via-[#0b1c15] to-[#04120a] p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden min-w-0 border-r border-emerald-900/40 min-h-[480px]">
      {/* React Bits Animated WebGL Strands Background Canvas */}
      <div className="absolute inset-0 pointer-events-none opacity-80 z-0">
        <Strands
          colors={['#047857', '#10b981', '#06b6d4', '#f59e0b']}
          count={4}
          speed={0.6}
          amplitude={1.1}
          waviness={1.2}
          thickness={0.8}
          glow={2.8}
          taper={3}
          spread={1}
          intensity={0.7}
          saturation={1.8}
          scale={1.4}
        />
      </div>

      {/* Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#06100b]/90 via-transparent to-[#06100b]/60 pointer-events-none z-0" />

      <div className="min-w-0 relative z-10">
        <div className="mb-6 p-2.5 bg-white/95 backdrop-blur-md rounded-2xl inline-block shadow-lg border border-white/30">
          <Image
            src="/orvyn-logo.png"
            alt="Orvyn PMS Logo"
            width={140}
            height={42}
            className="h-9 w-auto object-contain"
            priority
          />
        </div>

        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold backdrop-blur-md border border-emerald-500/30 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>{t('propertyOperatingSystem')}</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-3 leading-tight text-white drop-shadow-md">
            {t('streamlineRealEstateOps')}
          </h1>
          <p className="text-emerald-100/90 text-xs sm:text-sm mt-2.5 leading-relaxed font-normal opacity-95">
            {t('heroSubtitleText')}
          </p>
        </div>
      </div>

      <div className="space-y-3 my-6 relative z-10 min-w-0">
        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md min-w-0 shadow-sm hover:border-emerald-400/40 transition">
          <div className="w-8 h-8 shrink-0 rounded-xl bg-emerald-400/25 border border-emerald-300/40 flex items-center justify-center text-emerald-200 font-bold text-xs shadow-inner">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
          </div>
          <span className="text-xs font-semibold text-white leading-snug min-w-0 break-words">
            {t('multiTenantPermissionsFeature')}
          </span>
        </div>
        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md min-w-0 shadow-sm hover:border-emerald-400/40 transition">
          <div className="w-8 h-8 shrink-0 rounded-xl bg-emerald-400/25 border border-emerald-300/40 flex items-center justify-center text-emerald-200 font-bold text-xs shadow-inner">
            <Sparkles className="w-4 h-4 text-emerald-300" />
          </div>
          <span className="text-xs font-semibold text-white leading-snug min-w-0 break-words">
            {t('automatedRecurringBillingFeature')}
          </span>
        </div>
      </div>

      <div className="text-[11px] text-emerald-200/80 font-medium relative z-10 flex items-center justify-between">
        <span>© {new Date().getFullYear()} Orvyn Labs Inc. {t('allRightsReserved')}</span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 text-[10px] font-mono border border-emerald-800/80">
          v2.4.0 Live
        </span>
      </div>
    </div>
  );
};

