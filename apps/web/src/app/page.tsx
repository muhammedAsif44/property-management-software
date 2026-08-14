import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AuthHeader } from '@/features/auth/components/auth-header';
import Aurora from '@/components/ui/aurora';
import WarpText from '@/components/ui/warp-text';
import {
  Building2,
  Users,
  Zap,
  BarChart3,
  Sparkles,
  Receipt,
  ArrowRight,
  CheckCircle2,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050b08] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Full-Screen React Bits WebGL Aurora Background Canvas */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-75">
        <Aurora
          colorStops={['#047857', '#10b981', '#06b6d4']}
          blend={0.6}
          amplitude={1.2}
          speed={0.8}
        />
      </div>

      {/* Ambient Vignette & Radial Glow Overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#050b08]/30 via-transparent to-[#050b08]/80 pointer-events-none z-0" />
      <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none z-0" />

      <AuthHeader currentTab="login" />

      <main className="flex-1 flex flex-col items-center justify-start px-6 pt-4 sm:pt-8 pb-16 text-center max-w-6xl mx-auto z-10">
        
        {/* Seamless Brand Logo Display */}
        <div className="mb-3 group flex flex-col items-center">
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
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold tracking-wide uppercase border border-emerald-500/30 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          A Flagship Product by Orvyn Labs
        </span>

        {/* Interactive WebGL WarpText Hero Title */}
        <div className="w-full max-w-4xl mx-auto my-2 overflow-hidden">
          <WarpText
            text="Complete Property Operations"
            color="#f8f5ff"
            warpStrength={0.08}
            warpScale={1.7}
            speed={0.55}
            pointerInfluence={0.42}
            pointerStrength={0.38}
            refraction={0.018}
            ripple
            fontSize="clamp(2.2rem, 5.5vw, 4.8rem)"
            fontWeight={900}
            letterSpacing="-0.04em"
            lineHeight={0.95}
            style={{ height: '140px' }}
          />
        </div>
        <span className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 block -mt-2 mb-2">
          Intelligent & Automated
        </span>

        <p className="text-emerald-100/80 text-base sm:text-lg mt-4 max-w-2xl leading-relaxed font-medium">
          Orvyn PMS empowers hotel & resort owners, receptionists, and property managers with real-time 2-Way ARI channel sync, dynamic bento grid tape charts, live housekeeping tracking, and 3D invoice folios.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto">
          <Link
            href="/signup/owner"
            className="w-full sm:w-auto py-4 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            Register Organization <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto py-4 px-8 rounded-2xl bg-[#0d1612]/90 hover:bg-[#16241e] text-white font-extrabold text-sm border border-[#1d3329] backdrop-blur-xl shadow-md transition-all duration-200 cursor-pointer"
          >
            Sign In to Portal
          </Link>
        </div>

        {/* Impact Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 w-full max-w-4xl p-6 bg-[#0b1510]/85 backdrop-blur-3xl rounded-3xl border border-[#1d3329] shadow-2xl shadow-emerald-950/80 ring-1 ring-emerald-500/30">
          <div className="text-center p-2">
            <span className="text-2xl sm:text-3xl font-black text-white">100%</span>
            <span className="block text-xs font-extrabold text-emerald-400 mt-1">Cloud Automated</span>
          </div>
          <div className="text-center p-2 border-l border-[#1d3329]">
            <span className="text-2xl sm:text-3xl font-black text-white">2-Way</span>
            <span className="block text-xs font-extrabold text-emerald-400 mt-1">ARI OTA Channel Sync</span>
          </div>
          <div className="text-center p-2 border-l border-[#1d3329]">
            <span className="text-2xl sm:text-3xl font-black text-white">24/7</span>
            <span className="block text-xs font-extrabold text-emerald-400 mt-1">Live Housekeeping Radar</span>
          </div>
          <div className="text-center p-2 border-l border-[#1d3329]">
            <span className="text-2xl sm:text-3xl font-black text-white">0</span>
            <span className="block text-xs font-extrabold text-emerald-400 mt-1">Billing & Folio Dues Errors</span>
          </div>
        </div>

        {/* All Business Product Features Grid */}
        <div className="mt-16 w-full text-left">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Built for Modern Hotel & Property Operations
            </h2>
            <p className="text-emerald-100/70 text-xs sm:text-sm mt-2 font-medium">
              Every tool your resort, boutique hotel, or property management company needs for end-to-end operational mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Product Feature 1 */}
            <div className="p-6 bg-[#0b1510]/80 backdrop-blur-2xl rounded-3xl border border-[#1d3329] hover:border-emerald-500/50 shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200 border border-emerald-500/30">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Multi-Property Tape Chart</h3>
              <p className="text-emerald-100/70 text-xs mt-2 leading-relaxed font-medium">
                Organize resorts, luxury suites, and multi-branch hotels with interactive room tape charts and drag-and-drop bookings.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Interactive matrix & room assignment
              </div>
            </div>

            {/* Product Feature 2 */}
            <div className="p-6 bg-[#0b1510]/80 backdrop-blur-2xl rounded-3xl border border-[#1d3329] hover:border-emerald-500/50 shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200 border border-emerald-500/30">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">2-Way OTA Channel Manager</h3>
              <p className="text-emerald-100/70 text-xs mt-2 leading-relaxed font-medium">
                Instant rate and inventory sync across Booking.com, Agoda, Airbnb, and MakeMyTrip with zero double-booking risk.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Real-time ARI & pulse sync
              </div>
            </div>

            {/* Product Feature 3 */}
            <div className="p-6 bg-[#0b1510]/80 backdrop-blur-2xl rounded-3xl border border-[#1d3329] hover:border-emerald-500/50 shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200 border border-emerald-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Live Housekeeping Radar</h3>
              <p className="text-emerald-100/70 text-xs mt-2 leading-relaxed font-medium">
                Interactive room status tiles (Clean, Dirty, Inspecting, Out of Order) with animated status ring pulses and swipe-to-clean actions.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Animated radar status rings
              </div>
            </div>

            {/* Product Feature 4 */}
            <div className="p-6 bg-[#0b1510]/80 backdrop-blur-2xl rounded-3xl border border-[#1d3329] hover:border-emerald-500/50 shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200 border border-emerald-500/30">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">3D PDF Folio Carousel</h3>
              <p className="text-emerald-100/70 text-xs mt-2 leading-relaxed font-medium">
                Visual 3D PDF invoice selector (Classic Hotel, Modern Resort, Luxe Boutique, Minimalist Grid) with automated tax calculations.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> 4 dynamic PDF folio themes
              </div>
            </div>

            {/* Product Feature 5 */}
            <div className="p-6 bg-[#0b1510]/80 backdrop-blur-2xl rounded-3xl border border-[#1d3329] hover:border-emerald-500/50 shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200 border border-emerald-500/30">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">VIP Guest Loyalty CRM</h3>
              <p className="text-emerald-100/70 text-xs mt-2 leading-relaxed font-medium">
                Elevated guest cards with glowing tier badges (Platinum VIP, Gold Member), lifetime spend stats, and guest stay histories.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Tier badges & lifetime spend rollups
              </div>
            </div>

            {/* Product Feature 6 */}
            <div className="p-6 bg-[#0b1510]/80 backdrop-blur-2xl rounded-3xl border border-[#1d3329] hover:border-emerald-500/50 shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200 border border-emerald-500/30">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Executive Bento Dashboard</h3>
              <p className="text-emerald-100/70 text-xs mt-2 leading-relaxed font-medium">
                Interactive Bento Grid with cursor spotlight glow, animated count-up numbers, 7-day sparklines, and pending booking approvals.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Bento grid spotlight cards
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-emerald-200/60 font-medium border-t border-emerald-900/30 max-w-7xl mx-auto w-full z-10 backdrop-blur-md">
        © {new Date().getFullYear()} Orvyn PMS. Property Management System. Powered by <strong>Orvyn Labs Inc.</strong>
      </footer>
    </div>
  );
}
