import React from 'react';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { AuthHeroBanner } from '@/features/auth/components/auth-hero-banner';
import { AuthLoginForm } from '@/features/auth/components/auth-login-form';
import Strands from '@/components/ui/strands';

export const metadata = {
  title: 'Sign In | Orvyn PMS Portal',
  description: 'Access your Orvyn PMS property management dashboard',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#050b08] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Full-Screen Live WebGL Strands Background Canvas */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-100">
        <Strands
          colors={['#10b981', '#047857', '#06b6d4', '#f59e0b', '#059669']}
          count={5}
          speed={0.65}
          amplitude={1.25}
          waviness={1.3}
          thickness={0.85}
          glow={3.2}
          taper={3}
          spread={1.2}
          intensity={0.85}
          saturation={2.0}
          scale={1.5}
        />
      </div>

      {/* Ambient Vignette & Radial Overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#050b08]/30 via-transparent to-[#050b08]/80 pointer-events-none z-0" />
      <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none z-0" />

      <AuthHeader currentTab="login" />

      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8 z-10">
        <div className="w-full max-w-5xl bg-[#0b1510]/85 backdrop-blur-3xl rounded-3xl border border-[#1d3329] shadow-2xl shadow-emerald-950/80 grid grid-cols-1 lg:grid-cols-12 overflow-hidden ring-1 ring-emerald-500/30">
          <AuthHeroBanner />
          <AuthLoginForm />
        </div>
      </main>

      <footer className="py-3.5 text-center text-xs text-emerald-200/60 font-medium border-t border-emerald-900/30 max-w-7xl mx-auto w-full z-10 backdrop-blur-md">
        © {new Date().getFullYear()} Orvyn PMS. Property Management System. Powered by <strong>Orvyn Labs Inc.</strong>
      </footer>
    </div>
  );
}
