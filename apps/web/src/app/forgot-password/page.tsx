'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { authService } from '@/features/auth';
import { Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [issuedToken, setIssuedToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      toast.success('Password reset instructions generated successfully!', 'Reset Link Issued');
      if (res.resetToken) {
        setIssuedToken(res.resetToken);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to request password reset. Please try again.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 emerald-radial-bg flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Ambient Emerald Glow Elements */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="max-w-7xl mx-auto px-6 h-20 w-full flex items-center justify-between z-10">
        <Link href="/" className="transition-transform hover:scale-105">
          <Image
            src="/orvyn-logo.png"
            alt="Orvyn PMS Logo"
            width={180}
            height={55}
            className="h-12 w-auto object-contain drop-shadow-sm"
          />
        </Link>
        <Link
          href="/login"
          className="text-xs font-bold text-slate-700 hover:text-[#0B6E4F] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-6">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-2xl shadow-emerald-950/10 animate-fade-in-up">
          
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100/90 text-[#0B6E4F] flex items-center justify-center mb-4 border border-emerald-200 shadow-sm">
              <KeyRound className="w-7 h-7" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Forgot Password?
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Enter your email address to receive password reset instructions.
            </p>
          </div>

          {issuedToken ? (
            <div className="space-y-6 text-center">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <span className="font-bold">Reset Instructions Issued!</span>
                <p className="text-emerald-700 text-[11px] leading-relaxed">
                  We have generated a 15-minute secure reset token for your account. Click below to enter your new password.
                </p>
              </div>

              <Link
                href={`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(issuedToken)}`}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#0B6E4F] hover:bg-[#08543c] text-white font-bold text-xs shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
              >
                Proceed to Reset Password <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Registered Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                icon={<Mail className="w-4 h-4" />}
              />

              <Button
                type="submit"
                isLoading={loading}
                loadingText="Sending Instructions..."
                size="lg"
                className="w-full mt-4 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/35"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Send Reset Link
              </Button>
            </form>
          )}

          <div className="mt-8 text-center text-xs text-slate-500">
            Remembered your password?{' '}
            <Link
              href="/login"
              className="font-bold text-[#0B6E4F] hover:underline underline-offset-4"
            >
              Sign In
            </Link>
          </div>

        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-400 font-medium border-t border-slate-200/60 max-w-7xl mx-auto w-full z-10">
        © {new Date().getFullYear()} Orvyn PMS. Powered by <strong>Orvyn Labs Inc.</strong>
      </footer>
    </div>
  );
}
