'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '../hooks/use-auth';
import { useTranslation } from '@/lib/i18n';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export const AuthLoginForm: React.FC = () => {
  const router = useRouter();
  const { login, loading, error, clearError } = useAuth();
  const toast = useToast();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  React.useEffect(() => {
    router.prefetch('/dashboard');
    router.prefetch('/admin/approvals');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await login({ email, password });
      toast.success('Authenticated successfully!', 'Welcome Back');
      const targetUrl = res?.redirectUrl || (res?.targetApp === 'admin' ? '/admin/approvals' : '/dashboard');
      router.replace(targetUrl);
    } catch (err: any) {
      toast.error(err?.message || error || 'Sign in failed. Check your credentials.', 'Authentication Error');
    }
  };

  return (
    <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center animate-fade-in-up min-w-0">
      <div className="max-w-md mx-auto w-full min-w-0">
        
        {/* Form Header */}
        <div className="mb-5 flex flex-col items-start min-w-0">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t('welcomeBack')}
          </h2>
          <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 font-medium leading-relaxed">
            {t('welcomeBackSubtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <Alert type="error" message={error} onDismiss={clearError} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('emailAddress')}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            icon={<Mail className="w-4 h-4" />}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5 min-w-0">
              <span className="block text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider">
                {t('currentPassword')}
              </span>
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {t('forgotPasswordQuestion')}
              </Link>
            </div>
            <Input
              isPassword
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              icon={<Lock className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-emerald-800 text-emerald-600 focus:ring-emerald-500 bg-[#16241e]"
              />
              <span className="text-xs text-emerald-200/90 font-medium">{t('keepMeSignedIn')}</span>
            </label>
          </div>

          <Button
            type="submit"
            isLoading={loading}
            loadingText={t('authenticating')}
            size="lg"
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-xl shadow-emerald-600/30"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {t('signInToPortal')}
          </Button>
        </form>

        <div className="mt-5 text-center text-xs text-emerald-200/80 leading-relaxed min-w-0">
          {t('areYouPropertyOwner')}{' '}
          <Link
            href="/signup/owner"
            className="font-extrabold text-emerald-400 hover:underline underline-offset-4"
          >
            {t('registerCompanyAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
};

