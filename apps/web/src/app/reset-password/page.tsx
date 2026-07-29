'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { authService } from '@/features/auth';
import { Lock, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    if (emailParam) setEmail(emailParam);
    if (tokenParam) setToken(tokenParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match. Please re-enter.', 'Validation Error');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.', 'Validation Error');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ email, token, newPassword });
      toast.success('Password updated successfully! Redirecting to login...', 'Password Reset');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      toast.error(err?.message || 'Password reset failed. Token may be expired.', 'Reset Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-2xl shadow-emerald-950/10 animate-fade-in-up">
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100/90 text-[#0B6E4F] flex items-center justify-center mb-4 border border-emerald-200 shadow-sm">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Reset Password
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Set a new password for <strong>{email || 'your account'}</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!searchParams.get('token') && (
          <Input
            label="Reset Token *"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste reset token"
            icon={<Lock className="w-4 h-4" />}
          />
        )}

        <Input
          label="New Password *"
          isPassword
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Min 8 characters"
          icon={<Lock className="w-4 h-4" />}
        />

        <Input
          label="Confirm New Password *"
          isPassword
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter new password"
          icon={<Lock className="w-4 h-4" />}
        />

        <Button
          type="submit"
          isLoading={loading}
          loadingText="Updating Password..."
          size="lg"
          className="w-full mt-4 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/35"
          icon={<ArrowRight className="w-4 h-4" />}
        >
          Update Password
        </Button>
      </form>

      <div className="mt-8 text-center text-xs text-slate-500">
        Need to request a new token?{' '}
        <Link
          href="/forgot-password"
          className="font-bold text-[#0B6E4F] hover:underline underline-offset-4"
        >
          Request Link Here
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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

      {/* Main Form */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-6">
        <Suspense fallback={<div className="text-slate-500 text-sm">Loading reset form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </main>

      <footer className="py-6 text-center text-xs text-slate-400 font-medium border-t border-slate-200/60 max-w-7xl mx-auto w-full z-10">
        © {new Date().getFullYear()} Orvyn PMS. Powered by <strong>Orvyn Labs Inc.</strong>
      </footer>
    </div>
  );
}
