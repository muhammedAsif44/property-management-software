import React from 'react';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { OwnerSignupForm } from '@/features/auth/components/owner-signup-form';

export const metadata = {
  title: 'Register Organization | Orvyn PMS Portal',
  description: 'Onboard your property management company on Orvyn PMS',
};

export default function OwnerSignupPage() {
  return (
    <div className="min-h-screen bg-slate-50 emerald-radial-bg flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Ambient Emerald Glow Elements */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <AuthHeader currentTab="signup" />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 z-10 my-4">
        <div className="w-full max-w-4xl bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-2xl shadow-emerald-950/10 overflow-hidden">
          <OwnerSignupForm />
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-400 font-medium border-t border-slate-200/60 max-w-7xl mx-auto w-full z-10">
        © {new Date().getFullYear()} Orvyn PMS. Property Management System. Powered by <strong>Orvyn Labs Inc.</strong>
      </footer>
    </div>
  );
}
