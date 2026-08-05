'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LanguageSwitcher, useTranslation } from '@/lib/i18n';

interface AuthHeaderProps {
  currentTab: 'login' | 'signup';
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ currentTab }) => {
  const { t } = useTranslation();

  return (
    <header className="w-full flex flex-wrap items-center justify-between gap-4 px-4 sm:px-10 py-2 sm:py-3 max-w-7xl mx-auto z-20">
      {/* Prominent High-Quality Brand Logo */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
          <Image
            src="/orvyn-logo.png"
            alt="Orvyn PMS Logo"
            width={240}
            height={75}
            className="h-12 sm:h-16 w-auto object-contain drop-shadow-sm"
            priority
          />
        </div>
      </Link>

      {/* Switcher Navigation & Language Switcher */}
      <div className="flex items-center gap-2.5">
        <LanguageSwitcher />

        <div className="flex items-center bg-white/90 p-1 sm:p-1.5 rounded-2xl border border-slate-200/90 backdrop-blur-md shadow-sm">
          <Link
            href="/login"
            className={`px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
              currentTab === 'login'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            {t('signInTitle')}
          </Link>
          <Link
            href="/signup/owner"
            className={`px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
              currentTab === 'signup'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            {t('registerCompany')}
          </Link>
        </div>
      </div>
    </header>
  );
};

