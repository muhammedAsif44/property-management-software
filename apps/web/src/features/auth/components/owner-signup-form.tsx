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
import { Building, User, Mail, Phone, Lock, ArrowRight, ShieldCheck, Users, BadgeCheck } from 'lucide-react';

import { LanguageSwitcher } from '@/lib/i18n';

export const OwnerSignupForm: React.FC = () => {
  const router = useRouter();
  const { ownerSignup, staffSignup, loading, error, clearError } = useAuth();
  const toast = useToast();

  const [signupType, setSignupType] = useState<'OWNER' | 'STAFF'>('OWNER');

  const [formData, setFormData] = useState({
    name: '',
    organizationName: '',
    department: '',
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

  React.useEffect(() => {
    router.prefetch('/dashboard');
  }, [router]);

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
        await staffSignup({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        });

        toast.success('Staff registration successful! Redirecting to dashboard...', 'Welcome to Orvyn PMS');
        router.push('/dashboard');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed. Please check your credentials.';
      setValidationError(errorMsg);
      toast.error(errorMsg, 'Registration Failed');
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
    <div className="p-6 sm:p-9 md:p-10 animate-fade-in-up">
      <div className="max-w-2xl mx-auto">
        
        {/* Role Type Toggle */}
        <div className="p-1.5 sm:p-2 rounded-2xl bg-[#13221b]/90 border border-[#1d3329] flex items-center mb-6 sm:mb-8 gap-2 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              setSignupType('OWNER');
              clearError();
              setValidationError(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              signupType === 'OWNER'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-500'
                : 'text-emerald-200/70 hover:text-white hover:bg-[#182d22]'
            }`}
          >
            <Building className="w-4 h-4" />
            Register Property Company (Owner)
          </button>

          <button
            type="button"
            onClick={() => {
              setSignupType('STAFF');
              clearError();
              setValidationError(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              signupType === 'STAFF'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-500'
                : 'text-emerald-200/70 hover:text-white hover:bg-[#182d22]'
            }`}
          >
            <Users className="w-4 h-4" />
            Joining as Invited Staff?
          </button>
        </div>

        {/* Form Header */}
        <div className="text-center mb-6 sm:mb-7 flex flex-col items-center">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold tracking-wide uppercase border border-emerald-500/30 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {signupType === 'OWNER' ? 'Company Onboarding Portal' : 'Staff Member Registration'}
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2.5">
            {signupType === 'OWNER' ? 'Register Your Organization' : 'Staff Member Access'}
          </h2>
          <p className="text-emerald-100/80 text-xs sm:text-sm mt-1.5 font-medium leading-relaxed max-w-md mx-auto">
            {signupType === 'OWNER'
              ? 'Set up your property management company on Orvyn PMS.'
              : 'Enter your invited email address to join your property team.'}
          </p>
        </div>

        {activeError && (
          <div className="mb-4">
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

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {signupType === 'OWNER' ? (
              <>
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
              </>
            ) : (
              <>
                <Input
                  label="Full Name *"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  icon={<User className="w-4 h-4" />}
                />
                <Input
                  label="Department / Designation (Optional)"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Front Desk / Housekeeping"
                  icon={<BadgeCheck className="w-4 h-4" />}
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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
              <div className="flex justify-between text-[11px] font-extrabold text-emerald-200">
                <span>Password Strength</span>
                <span>
                  {passwordStrength === 1 && 'Weak'}
                  {passwordStrength === 2 && 'Fair'}
                  {passwordStrength === 3 && 'Good'}
                  {passwordStrength === 4 && 'Strong'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-[#16241e] rounded-full overflow-hidden flex gap-1">
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
                    passwordStrength >= 4 ? 'bg-emerald-400 w-1/4' : ''
                  }`}
                />
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="p-3.5 rounded-xl bg-[#13281f] border border-emerald-500/40 text-emerald-100 text-xs flex items-start gap-2.5 shadow-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-snug text-[11px] font-semibold text-emerald-100">
              {signupType === 'OWNER'
                ? 'Owner registrations are set to PENDING status and require verification by a Super Admin before account activation.'
                : 'Invited staff members receive instant APPROVED status upon registration and are logged in directly with 0 wait time!'}
            </p>
          </div>

          <Button
            type="submit"
            isLoading={loading}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-sm mt-2 cursor-pointer"
          >
            <span>{signupType === 'OWNER' ? 'Submit Registration Request' : 'Complete Staff Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-emerald-100/80 font-medium">
            Already have an account?{' '}
            <Link href="/login" className="font-extrabold text-emerald-400 hover:underline">
              Sign In Here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
