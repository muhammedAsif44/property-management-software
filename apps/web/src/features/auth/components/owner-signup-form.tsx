'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '../hooks/use-auth';
import { PendingApprovalCard } from './pending-approval-card';
import { Building, User, Mail, Phone, Lock, ArrowRight, ShieldCheck, Users, Star } from 'lucide-react';

import { LanguageSwitcher } from '@/lib/i18n';

export const OwnerSignupForm: React.FC = () => {
  const router = useRouter();
  const { ownerSignup, staffSignup, loading, error, clearError } = useAuth();
  const toast = useToast();

  const [signupType, setSignupType] = useState<'OWNER' | 'STAFF'>('OWNER');

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
      if (signupType === 'OWNER') {
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
      } else {
        // Staff Member Signup (Manager, Reception Staff, Viewer)
        const response = await staffSignup({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        });

        toast.success('Staff registration complete! Welcome to your property workspace.', 'Welcome');
        router.push(response.redirectUrl || '/dashboard');
      }
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
    <div className="p-5 sm:p-7 animate-fade-in-up">
      <div className="max-w-xl mx-auto">
        
        {/* Language Switcher Bar */}
        <div className="flex justify-end mb-3">
          <LanguageSwitcher />
        </div>
        
        {/* Account Mode Switcher Tabs */}
        <div className="p-1 rounded-2xl bg-slate-100 border border-slate-200 flex items-center mb-5 gap-1 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setSignupType('OWNER');
              clearError();
              setValidationError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              signupType === 'OWNER'
                ? 'bg-white text-emerald-950 shadow-sm border border-emerald-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-emerald-700" />
            Register Property Company (Owner)
          </button>

          <button
            type="button"
            onClick={() => {
              setSignupType('STAFF');
              clearError();
              setValidationError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              signupType === 'STAFF'
                ? 'bg-white text-emerald-950 shadow-sm border border-emerald-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-700" />
            Joining as Invited Staff?
          </button>
        </div>

        {/* Form Header */}
        <div className="text-center mb-4 flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-800 text-[11px] font-extrabold tracking-wide uppercase border border-emerald-200 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {signupType === 'OWNER' ? 'Company Onboarding Portal' : 'Staff Member Registration'}
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            {signupType === 'OWNER' ? 'Register Your Organization' : 'Staff Member Access'}
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            {signupType === 'OWNER'
              ? 'Set up your property management company on Orvyn PMS.'
              : 'Enter your invited email address to join your property team.'}
          </p>
        </div>

        {activeError && (
          <div className="mb-3">
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

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {signupType === 'OWNER' && (
              <Input
                label="Company / Org Name *"
                name="organizationName"
                required
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="Apex Property Holdings"
                icon={<Building className="w-4 h-4" />}
              />
            )}
            <Input
              label={signupType === 'OWNER' ? 'Full Name (Owner) *' : 'Full Name *'}
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Jane Doe"
              icon={<User className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Invited / Work Email *"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder={signupType === 'OWNER' ? 'owner@company.com' : 'staff@hotel.com'}
              icon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="WhatsApp / Phone *"
              name="phone"
              required={signupType === 'OWNER'}
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 555-019-2834"
              icon={<Phone className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Create Password *"
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 8 chars"
              icon={<Lock className="w-4 h-4" />}
            />
            <Input
              label="Confirm Password *"
              type="password"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              icon={<Lock className="w-4 h-4" />}
            />
          </div>

          {/* Password Strength Meter */}
          {formData.password && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>Password Strength</span>
                <span>
                  {passwordStrength === 1 && 'Weak'}
                  {passwordStrength === 2 && 'Fair'}
                  {passwordStrength === 3 && 'Good'}
                  {passwordStrength === 4 && 'Strong'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength >= 1 ? 'bg-red-500 w-1/4' : ''
                  }`}
                />
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength >= 2 ? 'bg-amber-500 w-1/4' : ''
                  }`}
                />
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength >= 3 ? 'bg-emerald-500 w-1/4' : ''
                  }`}
                />
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength >= 4 ? 'bg-emerald-700 w-1/4' : ''
                  }`}
                />
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-snug text-[11px]">
              {signupType === 'OWNER'
                ? 'Owner registrations are set to PENDING status and require verification by a Super Admin before account activation.'
                : 'Invited staff members receive instant APPROVED status upon registration and are logged in directly with 0 wait time!'}
            </p>
          </div>

          <Button
            type="submit"
            isLoading={loading}
            className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm mt-2"
          >
            <span>{signupType === 'OWNER' ? 'Submit Registration Request' : 'Complete Staff Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-extrabold text-emerald-700 hover:underline">
              Sign In Here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
