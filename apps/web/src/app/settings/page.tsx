'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { authService } from '@/features/auth';
import {
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  LogOut,
  ArrowRight,
  RefreshCw,
  Building2,
  ChevronRight,
  Shield,
  Key,
} from 'lucide-react';

export default function AccountSettingsPage() {
  const router = useRouter();
  const toast = useToast();

  const [user, setUser] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Change Password state
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loadingPass, setLoadingPass] = useState(false);

  // Change Email state
  const [emailData, setEmailData] = useState({
    password: '',
    newEmail: '',
  });
  const [loadingEmail, setLoadingEmail] = useState(false);

  // Fetch Profile
  const fetchProfile = async () => {
    try {
      const res = await authService.getProfile();
      setUser(res.user);
      setEmailData((prev) => ({ ...prev, newEmail: res.user?.email || '' }));
    } catch (err) {
      router.push('/login');
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passData.newPassword !== passData.confirmPassword) {
      toast.error('New passwords do not match. Please re-enter.', 'Validation Error');
      return;
    }

    if (passData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.', 'Validation Error');
      return;
    }

    setLoadingPass(true);
    try {
      await authService.changePassword({
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword,
      });

      toast.success('Password updated successfully! Active sessions revoked for security.', 'Password Changed');
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err?.message || 'Current password verification failed.', 'Password Update Failed');
    } finally {
      setLoadingPass(false);
    }
  };

  // Handle Change Email
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoadingEmail(true);
    try {
      const res = await authService.changeEmail({
        password: emailData.password,
        newEmail: emailData.newEmail,
      });

      toast.success(`Email updated to ${res.email}! Account saved.`, 'Email Changed');
      setEmailData((prev) => ({ ...prev, password: '' }));
      fetchProfile();
    } catch (err: any) {
      toast.error(err?.message || 'Email update failed. Ensure password is correct and email is unique.', 'Email Update Failed');
    } finally {
      setLoadingEmail(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // ignore
    }
    toast.success('Logged out successfully. Server session terminated.', 'Signed Out');
    router.push('/login');
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm flex-col gap-3 font-sans">
        <RefreshCw className="w-6 h-6 animate-spin text-[#0B6E4F]" />
        Loading Profile Settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="transition-transform hover:scale-105">
              <Image
                src="/orvyn-logo.png"
                alt="Orvyn PMS Logo"
                width={180}
                height={55}
                className="h-12 w-auto object-contain drop-shadow-sm"
              />
            </Link>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 hidden sm:flex">
              <span>Account</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-900 font-bold">Profile & Security Settings</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-700 shadow-sm transition-all"
          >
            <LogOut className="w-4 h-4" /> Secure Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6 sm:p-10 space-y-8 animate-fade-in-up">
        
        {/* User Card Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0B6E4F] text-white font-extrabold flex items-center justify-center text-xl shadow-md shadow-[#0B6E4F]/20">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">{user?.email}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0B6E4F] text-[10px] font-bold uppercase">
                  {user?.role || 'User'}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-1 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Organization: <strong>{user?.organization?.name || 'Orvyn Tenant'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">HTTP-Only Cookie Session Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Change Password Form */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-slate-900 border-b border-slate-100 pb-4">
              <Key className="w-5 h-5 text-[#0B6E4F]" />
              <div>
                <h2 className="text-base font-extrabold">Change Password</h2>
                <p className="text-slate-500 text-xs">Confirm your current password before saving a new one.</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Current Password *"
                isPassword
                required
                value={passData.currentPassword}
                onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                placeholder="Verify current password"
                icon={<Lock className="w-4 h-4" />}
              />

              <Input
                label="New Password *"
                isPassword
                required
                value={passData.newPassword}
                onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                placeholder="Min 8 characters"
                icon={<Lock className="w-4 h-4" />}
              />

              <Input
                label="Confirm New Password *"
                isPassword
                required
                value={passData.confirmPassword}
                onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                placeholder="Re-enter new password"
                icon={<Lock className="w-4 h-4" />}
              />

              <Button
                type="submit"
                isLoading={loadingPass}
                loadingText="Verifying & Updating..."
                size="lg"
                className="w-full mt-2 shadow-xl shadow-emerald-500/25"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Update Password
              </Button>
            </form>
          </div>

          {/* Change Email Form */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-slate-900 border-b border-slate-100 pb-4">
              <Mail className="w-5 h-5 text-[#0B6E4F]" />
              <div>
                <h2 className="text-base font-extrabold">Change Email Address</h2>
                <p className="text-slate-500 text-xs">Update your email address (must be unique per tenant).</p>
              </div>
            </div>

            <form onSubmit={handleChangeEmail} className="space-y-4">
              <Input
                label="New Email Address *"
                type="email"
                required
                value={emailData.newEmail}
                onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                placeholder="newname@company.com"
                icon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Confirm With Password *"
                isPassword
                required
                value={emailData.password}
                onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                placeholder="Enter password to authorize change"
                icon={<Lock className="w-4 h-4" />}
              />

              <Button
                type="submit"
                isLoading={loadingEmail}
                loadingText="Validating & Updating..."
                size="lg"
                className="w-full mt-2 shadow-xl shadow-emerald-500/25"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Update Email Address
              </Button>
            </form>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-[#0B6E4F] shrink-0 mt-0.5" />
              <span>
                Changing your email address will update your primary login handle across all Orvyn PMS services.
              </span>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 font-medium border-t border-slate-200/60 max-w-7xl mx-auto w-full mt-12">
        © {new Date().getFullYear()} Orvyn PMS. Account Security Powered by <strong>Orvyn Labs Inc.</strong>
      </footer>
    </div>
  );
}
