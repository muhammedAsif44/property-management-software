'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '../hooks/use-auth';
import { PendingApprovalCard } from './pending-approval-card';
import { Building, User, Mail, Phone, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export const OwnerSignupForm: React.FC = () => {
  const { ownerSignup, loading, error, clearError } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    organizationName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [pendingState, setPendingState] = useState<{
    organizationName: string;
    email: string;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (formData.password !== formData.confirmPassword) {
      const msg = 'Passwords do not match. Please re-enter.';
      setValidationError(msg);
      toast.error(msg, 'Validation Error');
      return;
    }

    if (formData.password.length < 8) {
      const msg = 'Password must be at least 8 characters long.';
      setValidationError(msg);
      toast.error(msg, 'Validation Error');
      return;
    }

    try {
      const response = await ownerSignup({
        name: formData.name,
        organizationName: formData.organizationName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      toast.success('Registration request submitted! Awaiting admin approval.', 'Company Onboarding');

      setPendingState({
        organizationName: response.user?.organizationName || formData.organizationName,
        email: response.user?.email || formData.email,
      });
    } catch (err: any) {
      toast.error(err?.message || error || 'Registration request failed.', 'Registration Error');
    }
  };

  if (pendingState) {
    return (
      <PendingApprovalCard
        organizationName={pendingState.organizationName}
        email={pendingState.email}
      />
    );
  }

  const activeError = validationError || error;

  return (
    <div className="p-6 sm:p-12 animate-fade-in-up">
      <div className="max-w-xl mx-auto">
        
        {/* Form Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/90 text-emerald-800 text-xs font-extrabold tracking-wide uppercase border border-emerald-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Company Onboarding Portal
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
            Register Your Organization
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Set up your property management company on Orvyn PMS.
          </p>
        </div>

        {activeError && (
          <div className="mb-6">
            <Alert
              type="error"
              message={activeError}
              onDismiss={() => {
                setValidationError(null);
                clearError();
              }}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company / Org Name *"
              name="organizationName"
              required
              value={formData.organizationName}
              onChange={handleChange}
              placeholder="Apex Property Holdings"
              icon={<Building className="w-4 h-4" />}
            />
            <Input
              label="Full Name (Owner) *"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Jane Doe"
              icon={<User className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Work Email *"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="owner@company.com"
              icon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="WhatsApp / Phone *"
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 555-019-2834"
              icon={<Phone className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Password *"
                isPassword
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 8 chars"
                icon={<Lock className="w-4 h-4" />}
              />
              {formData.password && (
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden flex gap-1">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength >= 1 ? 'w-1/4 bg-rose-500' : 'w-0'
                      }`}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength >= 2 ? 'w-1/4 bg-amber-500' : 'w-0'
                      }`}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength >= 3 ? 'w-1/4 bg-emerald-400' : 'w-0'
                      }`}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength >= 4 ? 'w-1/4 bg-emerald-600' : 'w-0'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password *"
              isPassword
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              icon={<Lock className="w-4 h-4" />}
            />
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3 shadow-inner">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Owner registrations are set to <strong>PENDING</strong> status and require verification by a Super Admin before account activation.
            </span>
          </div>

          <Button
            type="submit"
            isLoading={loading}
            loadingText="Submitting Registration..."
            size="lg"
            className="w-full mt-6 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/35"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Submit Registration Request
          </Button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          Already have an approved account?{' '}
          <Link
            href="/login"
            className="font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-4"
          >
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
