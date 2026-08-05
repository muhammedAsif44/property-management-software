'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';

export const AuthHeroBanner: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="lg:col-span-5 emerald-gradient bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden min-w-0">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-teal-400/10 rounded-full blur-xl pointer-events-none" />

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
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-200 text-xs font-semibold backdrop-blur-md border border-white/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> {t('propertyOperatingSystem')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-3 leading-tight text-white drop-shadow-sm">
            {t('streamlineRealEstateOps')}
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-2.5 leading-relaxed font-normal opacity-95">
            {t('heroSubtitleText')}
          </p>
        </div>
      </div>

      <div className="space-y-3 my-6 relative z-10 min-w-0">
        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md min-w-0">
          <div className="w-7 h-7 shrink-0 rounded-xl bg-emerald-400/25 border border-emerald-300/40 flex items-center justify-center text-emerald-200 font-bold text-xs shadow-inner">
            ✓
          </div>
          <span className="text-xs font-semibold text-white leading-snug min-w-0 break-words">
            {t('multiTenantPermissionsFeature')}
          </span>
        </div>
        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md min-w-0">
          <div className="w-7 h-7 shrink-0 rounded-xl bg-emerald-400/25 border border-emerald-300/40 flex items-center justify-center text-emerald-200 font-bold text-xs shadow-inner">
            ✓
          </div>
          <span className="text-xs font-semibold text-white leading-snug min-w-0 break-words">
            {t('automatedRecurringBillingFeature')}
          </span>
        </div>
      </div>

      <div className="text-[11px] text-emerald-200/80 font-medium relative z-10">
        © {new Date().getFullYear()} Orvyn Labs Inc. {t('allRightsReserved')}
      </div>
    </div>
  );
};

