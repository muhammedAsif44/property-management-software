'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';

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

      {/* Switcher Navigation */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center bg-[#0d1612]/90 p-1 sm:p-1.5 rounded-2xl border border-[#1d3329] backdrop-blur-xl shadow-md">
          <Link
            href="/login"
            className={`px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs font-extrabold rounded-xl transition-all duration-200 ${
              currentTab === 'login'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-500'
                : 'text-emerald-200/70 hover:text-white hover:bg-[#16241e]'
            }`}
          >
            {t('signInTitle')}
          </Link>
          <Link
            href="/signup/owner"
            className={`px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs font-extrabold rounded-xl transition-all duration-200 ${
              currentTab === 'signup'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-500'
                : 'text-emerald-200/70 hover:text-white hover:bg-[#16241e]'
            }`}
          >
            {t('registerCompany')}
          </Link>
        </div>
      </div>
    </header>
  );
};

