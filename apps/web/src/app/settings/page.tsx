'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { authService } from '@/features/auth';
import {
  PropertySwitcher,
  propertyService,
  usePropertyOnboarding,
  Step1Identity,
  Step2TimesTerms,
  Step3Rooms,
  Step4Amenities,
  Step5InvoiceTheme,
  Step6BankDetails,
  PropertyItem,
} from '@/features/properties';
import {
  Lock,
  Mail,
  ShieldCheck,
  LogOut,
  ArrowRight,
  RefreshCw,
  Building2,
  Key,
  User,
  Clock,
  BedDouble,
  Sparkles,
  FileText,
  CreditCard,
  ArrowLeft,
  SlidersHorizontal,
} from 'lucide-react';
import { useTranslation, LanguageSwitcher } from '@/lib/i18n';

function SettingsHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { t } = useTranslation();

  // Category Tab State ('account' | 'property')
  const [activeCategory, setActiveCategory] = useState<'account' | 'property'>('account');

  // User Profile State
  const [user, setUser] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Password Change state
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loadingPass, setLoadingPass] = useState(false);

  // Email Change state
  const [emailData, setEmailData] = useState({
    password: '',
    newEmail: '',
  });
  const [loadingEmail, setLoadingEmail] = useState(false);

  // Property Configuration Hook
  const [propertySubTab, setPropertySubTab] = useState<'identity' | 'times' | 'rooms' | 'amenities' | 'invoices' | 'bank'>('identity');
  const {
    propertyId,
    property,
    loading: loadingProperty,
    saving: savingProperty,
    step1Data,
    setStep1Data,
    step2Data,
    setStep2Data,
    roomTypes,
    setRoomTypes,
    amenities,
    setAmenities,
    selectedTemplateId,
    setSelectedTemplateId,
    bankData,
    setBankData,
    invoiceTemplates,
    loadPropertyData,
    saveStep,
  } = usePropertyOnboarding();

  // Derive role from fetched user profile
  const userRole = user?.role || '';
  const isOwner = userRole === 'OWNER' || userRole === 'SUPER_ADMIN';

  // Fetch Profile & Active Property
  useEffect(() => {
    const initData = async () => {
      try {
        const res = await authService.getProfile();
        const userObj = res.user || res.data?.user || res;
        setUser(userObj);
        setEmailData((prev) => ({ ...prev, newEmail: userObj?.email || '' }));

        const fetchedRole = userObj?.role || '';
        const fetchedIsOwner = fetchedRole === 'OWNER' || fetchedRole === 'SUPER_ADMIN';

        // Set initial tab based on URL param, but only allow property tab for owners
        const requestedTab = searchParams.get('tab');
        if (requestedTab === 'property' && fetchedIsOwner) {
          setActiveCategory('property');
        }

        // Only load property data for owners
        if (fetchedIsOwner) {
          const propRes = await propertyService.getActiveProperty();
          if (propRes.activeProperty) {
            loadPropertyData(propRes.activeProperty.id);
          }
        }
      } catch (err) {
        // Suppress unauth redirect if handled by guards
      } finally {
        setLoadingProfile(false);
      }
    };
    initData();
  }, [loadPropertyData, searchParams]);

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
      const profile = await authService.getProfile();
      setUser(profile.user);
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
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-700" />
        Loading Settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between">
      
      <div>
        {/* Compact Header Bar */}
        <header className="border-b border-slate-200/80 bg-white sticky top-0 z-40 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-5">
              <Link href="/dashboard" className="transition-transform hover:scale-105 shrink-0" title="Back to Dashboard">
                <Image
                  src="/orvyn-logo.png"
                  alt="Orvyn PMS Logo"
                  width={150}
                  height={45}
                  className="h-8 w-auto object-contain drop-shadow-2xs"
                />
              </Link>

              <div className="h-5 w-px bg-slate-200 hidden sm:block" />

              <PropertySwitcher
                onPropertyChange={(prop: PropertyItem) => loadPropertyData(prop.id)}
              />
            </div>

            <div className="flex items-center gap-2.5">
              <LanguageSwitcher />

              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-white" />
                <span>{t('dashboard')}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-700 shadow-2xs transition-all cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" /> {t('secureLogout')}
              </button>
            </div>
          </div>
        </header>

        {/* Compact Workspace Container */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-6 space-y-4 animate-fade-in-up">
          
          {/* Integrated Profile & Category Control Bar */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-extrabold flex items-center justify-center text-base shadow-xs shrink-0">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="truncate min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-extrabold text-slate-900 truncate capitalize">
                    {user?.owner?.fullName || user?.fullName || user?.email}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase shrink-0">
                    {user?.role || 'User'}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] font-medium flex items-center gap-1 mt-0.5 truncate">
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  Org: <strong>{user?.organization?.name || 'Orvyn Tenant'}</strong>
                </p>
              </div>
            </div>

            {/* Category Tabs — Property Configuration tab visible ONLY to Owner/Super Admin */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1 shrink-0">
              <button
                onClick={() => setActiveCategory('account')}
                className={`py-1.5 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeCategory === 'account'
                    ? 'bg-white text-emerald-950 shadow-xs border border-emerald-200 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5 text-emerald-700" />
                {t('accountAndSecurity')}
              </button>

              {isOwner && (
                <button
                  onClick={() => setActiveCategory('property')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeCategory === 'property'
                      ? 'bg-white text-emerald-950 shadow-xs border border-emerald-200 font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                  {t('propertyConfiguration')}
                </button>
              )}
            </div>
          </div>

          {/* CATEGORY 1: ACCOUNT & SECURITY */}
          {activeCategory === 'account' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
              {/* Change Password Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Key className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <h2 className="text-xs font-extrabold uppercase tracking-wide">{t('changePassword')}</h2>
                      <p className="text-slate-400 text-[10px]">Update your account security password.</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-3">
                  <Input
                    label={`${t('currentPassword')} *`}
                    isPassword
                    required
                    value={passData.currentPassword}
                    onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                    placeholder="Verify current password"
                    icon={<Lock className="w-3.5 h-3.5" />}
                  />

                  <Input
                    label={`${t('newPassword')} *`}
                    isPassword
                    required
                    value={passData.newPassword}
                    onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                    placeholder="Min 8 characters"
                    icon={<Lock className="w-3.5 h-3.5" />}
                  />

                  <Input
                    label={`${t('confirmNewPassword')} *`}
                    isPassword
                    required
                    value={passData.confirmPassword}
                    onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    icon={<Lock className="w-3.5 h-3.5" />}
                  />

                  <Button
                    type="submit"
                    isLoading={loadingPass}
                    loadingText="Updating..."
                    size="md"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs cursor-pointer h-9 text-xs"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    {t('updatePassword')}
                  </Button>
                </form>
              </div>

              {/* Change Email Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <h2 className="text-xs font-extrabold uppercase tracking-wide">{t('changeEmail')}</h2>
                      <p className="text-slate-400 text-[10px]">Update primary login email address.</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleChangeEmail} className="space-y-3">
                  <Input
                    label={`${t('changeEmail')} *`}
                    type="email"
                    required
                    value={emailData.newEmail}
                    onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                    placeholder="newname@company.com"
                    icon={<Mail className="w-3.5 h-3.5" />}
                  />

                  <Input
                    label="Confirm With Password *"
                    isPassword
                    required
                    value={emailData.password}
                    onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                    placeholder="Enter password to authorize change"
                    icon={<Lock className="w-3.5 h-3.5" />}
                  />

                  <Button
                    type="submit"
                    isLoading={loadingEmail}
                    loadingText="Updating..."
                    size="md"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs cursor-pointer h-9 text-xs"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    {t('updateEmail')}
                  </Button>
                </form>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>HTTP-Only cookie session active for secure operations.</span>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 2: PROPERTY CONFIGURATION */}
          {activeCategory === 'property' && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Property Sub-Tab Navigation Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
                {[
                  { key: 'identity', label: '1. Identity', icon: Building2 },
                  { key: 'times', label: '2. Times & Terms', icon: Clock },
                  { key: 'rooms', label: '3. Room Types', icon: BedDouble },
                  { key: 'amenities', label: '4. Amenities', icon: Sparkles },
                  { key: 'invoices', label: '5. Invoice Themes', icon: FileText },
                  { key: 'bank', label: '6. Bank & Payment', icon: CreditCard },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = propertySubTab === tab.key;

                  return (
                    <button
                      key={tab.key}
                      onClick={() => setPropertySubTab(tab.key as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {loadingProperty ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-700" />
                  Loading Property Configuration...
                </div>
              ) : (
                <>
                  {propertySubTab === 'identity' && (
                    <Step1Identity
                      data={step1Data}
                      onChange={setStep1Data}
                      onSave={() => saveStep(1)}
                      saving={savingProperty}
                      isSettingsView
                    />
                  )}

                  {propertySubTab === 'times' && (
                    <Step2TimesTerms
                      data={step2Data}
                      onChange={setStep2Data}
                      onSave={() => saveStep(2)}
                      saving={savingProperty}
                      isSettingsView
                    />
                  )}

                  {propertySubTab === 'rooms' && (
                    <Step3Rooms
                      roomTypes={roomTypes}
                      onChange={setRoomTypes}
                      onSave={() => saveStep(3)}
                      saving={savingProperty}
                      isSettingsView
                    />
                  )}

                  {propertySubTab === 'amenities' && (
                    <Step4Amenities
                      amenities={amenities}
                      onChange={setAmenities}
                      onSave={() => saveStep(4)}
                      saving={savingProperty}
                      isSettingsView
                    />
                  )}

                  {propertySubTab === 'invoices' && (
                    <Step5InvoiceTheme
                      selectedTemplateId={selectedTemplateId}
                      invoiceTemplates={invoiceTemplates}
                      identityData={step1Data}
                      bankData={bankData}
                      roomTypes={roomTypes}
                      onChange={setSelectedTemplateId}
                      onSave={() => saveStep(5)}
                      saving={savingProperty}
                      isSettingsView
                    />
                  )}

                  {propertySubTab === 'bank' && (
                    <Step6BankDetails
                      data={bankData}
                      onChange={setBankData}
                      onSave={() => saveStep(6)}
                      saving={savingProperty}
                      isSettingsView
                    />
                  )}
                </>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Footer */}
      <footer className="py-3 text-center text-[11px] text-slate-400 font-medium border-t border-slate-200/60 max-w-7xl mx-auto w-full">
        © {new Date().getFullYear()} Orvyn PMS. Settings Hub Powered by <strong>Orvyn Labs Inc.</strong>
      </footer>
    </div>
  );
}

export default function UnifiedSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm flex-col gap-3 font-sans">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-700" />
          Loading Settings Hub...
        </div>
      }
    >
      <SettingsHubContent />
    </Suspense>
  );
}
