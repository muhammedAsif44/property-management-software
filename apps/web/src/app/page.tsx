import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AuthHeader } from '@/features/auth/components/auth-header';
import {
  Building2,
  Users,
  Zap,
  BarChart3,
  Wrench,
  FolderLock,
  ArrowRight,
  CheckCircle2,
  PieChart,
  BellRing,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Ambient Emerald Glow Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <AuthHeader currentTab="login" />

      <main className="flex-1 flex flex-col items-center justify-start px-6 pt-2 sm:pt-4 pb-12 text-center max-w-6xl mx-auto z-10">
        
        {/* Seamless Transparent Logo Display */}
        <div className="mb-2 group flex flex-col items-center">
          <div className="p-1 rounded-3xl bg-transparent transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/orvyn-logo.png"
              alt="Orvyn PMS Logo"
              width={240}
              height={75}
              className="h-16 sm:h-20 w-auto object-contain drop-shadow-md"
              priority
            />
          </div>
        </div>

        {/* Flagship Badge */}
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold tracking-wide uppercase border border-emerald-200/80 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          A Flagship Product by Orvyn Labs
        </span>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight mt-4 leading-tight max-w-3xl">
          Complete Property Operations, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-800">
            Intelligent & Automated
          </span>
        </h1>

        <p className="text-slate-600 text-base sm:text-lg mt-4 max-w-2xl leading-relaxed font-normal">
          Orvyn PMS streamlines property portfolios, automates monthly billing, simplifies tenant communication, and delivers real-time financial insights.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto">
          <Link
            href="/signup/owner"
            className="w-full sm:w-auto py-4 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-sm tracking-wide shadow-xl shadow-emerald-500/25 transition-all duration-200 flex items-center justify-center gap-2"
          >
            Register Organization <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto py-4 px-8 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm transition-all duration-200"
          >
            Sign In to Portal
          </Link>
        </div>

        {/* Impact Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 w-full max-w-4xl p-6 bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-center p-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">100%</span>
            <span className="block text-xs font-semibold text-slate-500 mt-1">Cloud Automated</span>
          </div>
          <div className="text-center p-2 border-l border-slate-100">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">10x</span>
            <span className="block text-xs font-semibold text-slate-500 mt-1">Faster Onboarding</span>
          </div>
          <div className="text-center p-2 border-l border-slate-100">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">24/7</span>
            <span className="block text-xs font-semibold text-slate-500 mt-1">Tenant Communications</span>
          </div>
          <div className="text-center p-2 border-l border-slate-100">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">0</span>
            <span className="block text-xs font-semibold text-slate-500 mt-1">Manual Billing Errors</span>
          </div>
        </div>

        {/* All Business Product Features Grid */}
        <div className="mt-16 w-full text-left">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Built for Modern Real Estate Managers
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-2">
              Every tool your company needs to operate residential, commercial, and mixed-use portfolios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Product Feature 1 */}
            <div className="p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Multi-Property Portfolio</h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Organize residential complexes, commercial spaces, and multi-unit buildings with floor-by-floor tracking.
              </p>
              <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Unit & occupancy structure
              </div>
            </div>

            {/* Product Feature 2 */}
            <div className="p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Tenant Directory & History</h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Centralized tenant profiles with contact info, emergency numbers, payment history, and occupancy dates.
              </p>
              <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Instant tenant lookup
              </div>
            </div>

            {/* Product Feature 3 */}
            <div className="p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Automated Recurring Invoices</h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Auto-generate monthly rent bills and track paid, pending, or overdue tenant balances effortlessly.
              </p>
              <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Automated payment tracking
              </div>
            </div>

            {/* Product Feature 4 */}
            <div className="p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Financial & Revenue Analytics</h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Gain instant clarity into monthly revenue, collection percentages, and outstanding tenant dues.
              </p>
              <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Visual collection reports
              </div>
            </div>

            {/* Product Feature 5 */}
            <div className="p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Maintenance & Service Tickets</h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Log repair tickets, assign work orders to contractors, and track resolution progress step-by-step.
              </p>
              <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Work order management
              </div>
            </div>

            {/* Product Feature 6 */}
            <div className="p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
                <FolderLock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Digital Document Vault</h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Store ID proofs, rental agreements, utility bills, and property certificates safely in the cloud.
              </p>
              <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Secure document storage
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 font-medium border-t border-slate-200/60 max-w-7xl mx-auto w-full">
        © {new Date().getFullYear()} Orvyn PMS. Property Management System. Powered by <strong>Orvyn Labs Inc.</strong>
      </footer>
    </div>
  );
}
