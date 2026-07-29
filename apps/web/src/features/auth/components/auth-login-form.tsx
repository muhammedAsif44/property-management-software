'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '../hooks/use-auth';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export const AuthLoginForm: React.FC = () => {
  const router = useRouter();
  const { login, loading, error, clearError } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login({ email, password });
      toast.success('Authenticated successfully! Redirecting to dashboard...', 'Welcome Back');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: any) {
      toast.error(err?.message || error || 'Sign in failed. Check your credentials.', 'Authentication Error');
    }
  };

  return (
    <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center animate-fade-in-up">
      <div className="max-w-md mx-auto w-full">
        
        {/* Prominent High-Resolution Logo & Header */}
        <div className="mb-8 flex flex-col items-start">
          <div className="mb-4 transition-transform duration-300 hover:scale-105">
            <Image
              src="/orvyn-logo.png"
              alt="Orvyn PMS Logo"
              width={280}
              height={85}
              className="h-20 sm:h-24 w-auto object-contain drop-shadow-md"
              priority
            />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Welcome back
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mt-2 font-normal">
            Enter your credentials to access your Orvyn PMS portal.
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onDismiss={clearError} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            icon={<Mail className="w-4 h-4" />}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </span>
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Forgot password?
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

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-600 font-medium">Keep me signed in</span>
            </label>
          </div>

          <Button
            type="submit"
            isLoading={loading}
            loadingText="Authenticating..."
            size="lg"
            className="w-full mt-4 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/35"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In to Portal
          </Button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          Are you a property owner wanting to manage properties?{' '}
          <Link
            href="/signup/owner"
            className="font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-4"
          >
            Register Company Account
          </Link>
        </div>
      </div>
    </div>
  );
};
