import React from 'react';
import Image from 'next/image';

export const AuthHeroBanner: React.FC = () => {
  return (
    <div className="lg:col-span-5 emerald-gradient p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="mb-8 p-4 bg-white/95 backdrop-blur-md rounded-2xl inline-block shadow-lg border border-white/20">
          <Image
            src="/orvyn-logo.png"
            alt="Orvyn PMS Logo"
            width={180}
            height={55}
            className="h-12 w-auto object-contain"
            priority
          />
        </div>

        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-md border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" /> Property Operating System
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-4 leading-tight">
            Streamline Your Real Estate Operations
          </h1>
          <p className="text-emerald-100/80 text-sm mt-3 leading-relaxed font-light">
            Empower your property managers, automate tenant billing, and gain instant financial clarity with Orvyn PMS.
          </p>
        </div>
      </div>

      <div className="space-y-4 my-8">
        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
          <div className="w-8 h-8 rounded-xl bg-emerald-400/20 flex items-center justify-center text-emerald-300 font-bold text-sm">
            ✓
          </div>
          <span className="text-xs font-medium text-emerald-50">
            Multi-tenant role permissions & approval workflows
          </span>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
          <div className="w-8 h-8 rounded-xl bg-emerald-400/20 flex items-center justify-center text-emerald-300 font-bold text-sm">
            ✓
          </div>
          <span className="text-xs font-medium text-emerald-50">
            Automated recurring billing & payment tracking
          </span>
        </div>
      </div>

      <div className="text-xs text-emerald-200/60 font-medium">
        © {new Date().getFullYear()} Orvyn Labs Inc. All rights reserved.
      </div>
    </div>
  );
};
