'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { AppHeader } from '@/components/app-header';
import { authService } from '@/features/auth';
import { useTheme, Theme } from '@/lib/theme';
import {
  propertyService,
  usePropertyOnboarding,
  usePropertyStore,
  Step1Identity,
  Step2TimesTerms,
  Step3Rooms,
  Step4Amenities,
  Step5InvoiceTheme,
  Step6BankDetails,
} from '@/features/properties';
import { ChannelManagerDashboard } from '@/features/channels/components/channel-manager-dashboard';
import { AdminNotificationComposer } from '@/features/notifications/components/admin-notification-composer';
import {
  Lock,
  Mail,
  ShieldCheck,
  LogOut,
  ArrowRight,
  RefreshCw,
  Building2,
  Globe,
  Key,
  User,
  Clock,
  BedDouble,
  Star,
  FileText,
  CreditCard,
  Settings,
  Palette,
  Bell,
  Users,
  Layers,
  Code2,
  Zap,
  Download,
  Shield,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
  Check,
  HardDrive,
  FileSpreadsheet,
  Activity,
  SmartphoneNfc,
  Sliders,
  UserCheck,
  ShieldAlert,
  History,
  Languages,
} from 'lucide-react';
import { useTranslation, LanguageSwitcher } from '@/lib/i18n';

/* ─── All 15 Settings Section Keys ─── */
type SettingsSection =
  | 'general'
  | 'appearance'
  | 'localization'
  | 'workspace'
  | 'organization'
  | 'property-config'
  | 'users'
  | 'roles'
  | 'account'
  | 'notifications'
  | 'channels'
  | 'billing'
  | 'developer'
  | 'api'
  | 'advanced'
  | 'audit-logs'
  | 'backup';

interface SettingsNavGroup {
  title: string;
  items: {
    key: SettingsSection;
    labelKey: string;
    icon: React.ElementType;
    ownerOnly?: boolean;
  }[];
}

const SETTINGS_GROUPS: SettingsNavGroup[] = [
  {
    title: 'Preferences',
    items: [
      { key: 'general', labelKey: 'settingsGeneral', icon: Settings },
      { key: 'appearance', labelKey: 'settingsAppearance', icon: Palette },
      { key: 'localization', labelKey: 'settingsLocalization', icon: Languages },
    ],
  },
  {
    title: 'Organization & Workspace',
    items: [
      { key: 'workspace', labelKey: 'settingsWorkspace', icon: Building2 },
      { key: 'organization', labelKey: 'settingsOrganization', icon: ShieldCheck },
      { key: 'property-config', labelKey: 'settingsPropertyConfig', icon: Sliders, ownerOnly: true },
    ],
  },
  {
    title: 'Team & Access',
    items: [
      { key: 'account', labelKey: 'settingsAccount', icon: User },
      { key: 'users', labelKey: 'settingsUsers', icon: Users },
      { key: 'roles', labelKey: 'settingsRoles', icon: UserCheck },
      { key: 'notifications', labelKey: 'settingsNotifications', icon: Bell },
    ],
  },
  {
    title: 'Platform & Billing',
    items: [
      { key: 'channels', labelKey: 'channelManager', icon: Globe },
      { key: 'billing', labelKey: 'settingsBilling', icon: CreditCard },
      { key: 'developer', labelKey: 'settingsDeveloper', icon: Code2 },
      { key: 'api', labelKey: 'settingsApi', icon: Key },
    ],
  },
  {
    title: 'System & Security',
    items: [
      { key: 'advanced', labelKey: 'settingsAdvanced', icon: Zap },
      { key: 'audit-logs', labelKey: 'settingsAuditLogs', icon: History },
      { key: 'backup', labelKey: 'settingsBackup', icon: HardDrive },
    ],
  },
];

/* ═══════════════════════════════════════════════════
   SETTINGS 3-COLUMN COMPONENT
   ═══════════════════════════════════════════════════ */
function Settings3ColumnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const activeProperty = usePropertyStore((s) => s.activeProperty);

  // Active section state with 0ms instant transition (zero flickering)
  const sectionParam = (searchParams.get('section') as SettingsSection) || 'general';
  const [activeSection, setActiveSectionState] = useState<SettingsSection>(sectionParam);

  const setActiveSection = useCallback((sec: SettingsSection) => {
    setActiveSectionState(sec);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/settings?section=${sec}`);
    }
  }, []);

  // Profile data
  const [user, setUser] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Forms state
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loadingPass, setLoadingPass] = useState(false);

  const [emailData, setEmailData] = useState({
    password: '',
    newEmail: '',
  });
  const [loadingEmail, setLoadingEmail] = useState(false);

  // Property Configuration Hook
  const [propertySubTab, setPropertySubTab] = useState<'identity' | 'times' | 'rooms' | 'amenities' | 'invoices' | 'bank'>('identity');
  const {
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

        if (fetchedIsOwner) {
          const propRes = await propertyService.getActiveProperty();
          if (propRes.activeProperty) {
            loadPropertyData(propRes.activeProperty.id);
          }
        }
      } catch (err) {
        // Suppress handled errors
      } finally {
        setLoadingProfile(false);
      }
    };
    initData();
  }, [loadPropertyData]);

  // Handlers
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      toast.error('New passwords do not match.', 'Validation Error');
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
      toast.success('Password updated successfully!', 'Password Changed');
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err?.message || 'Current password verification failed.', 'Password Update Failed');
    } finally {
      setLoadingPass(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingEmail(true);
    try {
      const res = await authService.changeEmail({
        password: emailData.password,
        newEmail: emailData.newEmail,
      });
      toast.success(`Email updated to ${res.email}!`, 'Email Changed');
      setEmailData((prev) => ({ ...prev, password: '' }));
      const profile = await authService.getProfile();
      setUser(profile.user);
    } catch (err: any) {
      toast.error(err?.message || 'Email update failed.', 'Email Update Failed');
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // ignore
    }
    toast.success('Logged out successfully.', 'Signed Out');
    router.push('/login');
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative">
      {/* ─── COLUMN 1: Persistent Main Application Left Sidebar ─── */}
      <DashboardSidebar />

      {/* Main Workspace Frame */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Persistent Top Header with Screenshot-Matching Header Pill */}
        <AppHeader>
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-3 bg-slate-50/90 dark:bg-slate-850 px-4 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-800 shadow-2xs min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate">
                  {t('settingsTitle')}
                </h1>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 leading-tight truncate">
                  Workspace & App Preferences
                </span>
              </div>
            </div>
          </div>
        </AppHeader>

        {/* ─── 2-COLUMN INNER SETTINGS WORKSPACE ─── */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* ─── COLUMN 2: Fixed Settings Navigation Column ─── */}
          <aside
            className="hidden md:flex flex-col w-60 shrink-0 border-r border-slate-200/80 dark:border-[#1d3329] bg-white/60 dark:bg-[#09100d] p-3.5 overflow-y-auto"
            aria-label="Settings sub-navigation"
          >
            {/* Section Sub-Header */}
            <div className="px-2.5 py-1.5 mb-2 border-b border-slate-200/60 dark:border-[#1d3329] flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Workspace Settings
              </span>
            </div>

            {/* Grouped Settings Sub-Navigation */}
            <nav className="space-y-4 flex-1">
              {SETTINGS_GROUPS.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1">
                  <span className="px-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {group.title}
                  </span>
                  <div className="space-y-0.5 pt-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => setActiveSection(item.key)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer text-left ${
                            isActive
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-black shadow-2xs border-l-3 border-emerald-600 dark:border-emerald-500'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-[#192a23] font-bold'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                          <span className="truncate min-w-0">{t(item.labelKey as any)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          {/* Mobile Navigation Bar (< md screens) */}
          <div className="md:hidden sticky top-14 z-20 bg-white dark:bg-[#09100d] border-b border-slate-200 dark:border-[#1d3329] overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1 p-2">
              {SETTINGS_GROUPS.flatMap(g => g.items).map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    {t(item.labelKey as any)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── COLUMN 3: Settings Content Panel ─── */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div key={activeSection} className="max-w-4xl mx-auto space-y-6 animate-fadeIn">

              {loadingProfile ? (
                /* Localized Content Panel Skeleton Loaders (No Full Page Reload!) */
                <div className="space-y-6">
                  <div className="p-5 bg-white dark:bg-[#0f1814] rounded-xl border border-slate-200 dark:border-[#1d3329] space-y-4">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-72" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="p-5 bg-white dark:bg-[#0f1814] rounded-xl border border-slate-200 dark:border-[#1d3329] space-y-4">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-60" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ) : (
                <>
                  {/* ═══ 1. GENERAL ═══ */}
                  {activeSection === 'general' && (
                    <div className="space-y-6">
                      <SettingsCard
                        icon={Globe}
                        title={t('settingsLanguage')}
                        description={t('settingsLanguageDesc')}
                      >
                        <div className="flex items-center justify-between gap-4 p-4 bg-slate-50/80 dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800">
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 dark:text-white">{t('interfaceLanguage')}</p>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">English / മലയാളം</p>
                          </div>
                          <LanguageSwitcher />
                        </div>
                      </SettingsCard>

                      <SettingsCard
                        icon={Clock}
                        title={t('settingsTimezone')}
                        description={t('settingsTimezoneDesc')}
                      >
                        <div className="flex items-center justify-between gap-4 p-4 bg-slate-50/80 dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800">
                          <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white">UTC+05:30 (Asia/Kolkata)</p>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Indian Standard Time (IST)</p>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-extrabold">
                            Default
                          </span>
                        </div>
                      </SettingsCard>

                      <SettingsCard
                        icon={FileText}
                        title={t('settingsDateFormat')}
                        description={t('settingsDateFormatDesc')}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map((format, idx) => (
                            <button
                              key={format}
                              className={`p-3.5 rounded-xl border text-xs font-mono font-bold text-center transition-all cursor-pointer ${
                                idx === 0
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-extrabold shadow-2xs'
                                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                              }`}
                            >
                              {format}
                            </button>
                          ))}
                        </div>
                      </SettingsCard>

                      <SettingsCard
                        icon={CreditCard}
                        title={t('settingsCurrency')}
                        description={t('settingsCurrencyDesc')}
                      >
                        <div className="flex items-center justify-between gap-4 p-4 bg-slate-50/80 dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800">
                          <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white">INR (₹) — Indian Rupee</p>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Primary Currency</p>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold border border-emerald-200 dark:border-emerald-800">
                            Active
                          </span>
                        </div>
                      </SettingsCard>
                    </div>
                  )}

                  {/* ═══ 2. APPEARANCE ═══ */}
                  {activeSection === 'appearance' && (
                    <div className="space-y-6">
                      <SettingsCard
                        icon={Palette}
                        title={t('settingsTheme')}
                        description={t('settingsThemeDesc')}
                      >
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { key: 'light', label: t('settingsThemeLight'), icon: Sun },
                            { key: 'dark', label: t('settingsThemeDark'), icon: Moon },
                            { key: 'system', label: t('settingsThemeSystem'), icon: Laptop },
                          ].map((item) => {
                            const Icon = item.icon;
                            const isSelected = theme === item.key;
                            return (
                              <button
                                key={item.key}
                                onClick={() => setTheme(item.key as Theme)}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-200 shadow-2xs font-semibold'
                                    : 'bg-white dark:bg-[#0f1814] border-slate-200 dark:border-[#1d3329] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#192a23]'
                                }`}
                              >
                                <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                                <span>{item.label}</span>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </SettingsCard>

                      <SettingsCard
                        icon={Layers}
                        title={t('settingsDensity')}
                        description={t('settingsDensityDesc')}
                      >
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: 'comfortable', label: t('settingsDensityComfortable'), desc: 'Spacious padding for readability' },
                            { key: 'compact', label: t('settingsDensityCompact'), desc: 'Tighter rows for high data density' },
                          ].map((d, idx) => (
                            <button
                              key={d.key}
                              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                idx === 0
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                                  : 'bg-white dark:bg-[#0f1814] border-slate-200 dark:border-[#1d3329] text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                              }`}
                            >
                              <p className="text-xs font-semibold">{d.label}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{d.desc}</p>
                            </button>
                          ))}
                        </div>
                      </SettingsCard>
                    </div>
                  )}

                  {/* ═══ 3. LOCALIZATION ═══ */}
                  {activeSection === 'localization' && (
                    <div className="space-y-6">
                      <SettingsCard
                        icon={Languages}
                        title="Localization & Regional Settings"
                        description="Manage interface translation, regional date formats, and localized displays."
                      >
                        <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200/80 dark:border-slate-800">
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Active i18n Language</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Malayalam & English supported</p>
                          </div>
                          <LanguageSwitcher />
                        </div>
                      </SettingsCard>
                    </div>
                  )}

                  {/* ═══ 4. WORKSPACE ═══ */}
                  {activeSection === 'workspace' && (
                    <div className="space-y-6">
                      <SettingsCard
                        icon={Building2}
                        title="Workspace Details"
                        description="View organization profile and workspace properties."
                      >
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Workspace Name</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{user?.organization?.name || 'Orvyn Tenant'}</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800 pt-2">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tenant Account</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{user?.email}</span>
                          </div>
                        </div>
                      </SettingsCard>
                    </div>
                  )}

                  {/* ═══ 5. ORGANIZATION ═══ */}
                  {activeSection === 'organization' && (
                    <div className="space-y-6">
                      <SettingsCard
                        icon={ShieldCheck}
                        title={t('settingsOrganization')}
                        description={t('settingsOrganizationDesc')}
                      >
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Organization Name</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{user?.organization?.name || 'Orvyn PMS'}</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800 pt-2">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Owner Email</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{user?.email}</span>
                          </div>
                        </div>
                      </SettingsCard>
                    </div>
                  )}

                  {/* ═══ 6. PROPERTY CONFIGURATION ═══ */}
                  {activeSection === 'property-config' && isOwner && (
                    <div className="space-y-6">
                      <SettingsCard
                        icon={Sliders}
                        title={t('propertyConfiguration')}
                        description="Configure room categories, policies, invoice designs, and banking."
                      >
                        <div className="space-y-4">
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/80 dark:border-slate-800">
                            {[
                              { key: 'identity', label: '1. Identity', icon: Building2 },
                              { key: 'times', label: '2. Times & Terms', icon: Clock },
                              { key: 'rooms', label: '3. Room Types', icon: BedDouble },
                              { key: 'amenities', label: '4. Amenities', icon: Star },
                              { key: 'invoices', label: '5. Invoice Themes', icon: FileText },
                              { key: 'bank', label: '6. Bank Details', icon: CreditCard },
                            ].map((tab) => {
                              const Icon = tab.icon;
                              const isActive = propertySubTab === tab.key;
                              return (
                                <button
                                  key={tab.key}
                                  onClick={() => setPropertySubTab(tab.key as any)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                    isActive
                                      ? 'bg-emerald-600 text-white shadow-2xs'
                                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5" /> {tab.label}
                                </button>
                              );
                            })}
                          </div>

                          {loadingProperty ? (
                            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                              <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
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
                      </SettingsCard>
                    </div>
                  )}

                  {/* ═══ 7. USERS ═══ */}
                  {activeSection === 'users' && (
                    <div className="space-y-6">
                      <SettingsCard
                        icon={Users}
                        title={t('settingsUsers')}
                        description="Manage user access and staff directory."
                      >
                        <Link
                          href="/settings/staff"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all cursor-pointer"
                        >
                          {t('settingsTeam')} Directory
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </SettingsCard>
                    </div>
                  )}

                  {/* ═══ 8. ROLES ═══ */}
                  {activeSection === 'roles' && (
                    <div className="space-y-6">
                      <SettingsCard
                        icon={UserCheck}
                        title={t('settingsRoles')}
                        description={t('settingsRolesDesc')}
                      >
                        <SettingsComingSoonBadge />
                      </SettingsCard>
                    </div>
                  )}

                  {/* ═══ 9. ACCOUNT & SECURITY ═══ */}
                  {activeSection === 'account' && (
                    <div className="space-y-6">
                      {/* Password */}
                      <SettingsCard
                        icon={Key}
                        title={t('changePassword')}
                        description={t('settingsPasswordDesc')}
                      >
                        <form onSubmit={handleChangePassword} className="space-y-4">
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
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm cursor-pointer h-9 text-xs"
                            icon={<ArrowRight className="w-3.5 h-3.5" />}
                          >
                            {t('updatePassword')}
                          </Button>
                        </form>
                      </SettingsCard>

                      {/* Email */}
                      <SettingsCard
                        icon={Mail}
                        title={t('changeEmail')}
                        description={t('settingsEmailSecurityDesc')}
                      >
                        <form onSubmit={handleChangeEmail} className="space-y-4">
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
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm cursor-pointer h-9 text-xs"
                            icon={<ArrowRight className="w-3.5 h-3.5" />}
                          >
                            {t('updateEmail')}
                          </Button>
                        </form>
                      </SettingsCard>

                      {/* Sessions */}
                      <SettingsCard
                        icon={SmartphoneNfc}
                        title={t('settingsSessions')}
                        description={t('settingsSessionsDesc')}
                      >
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Current Web Session (Active)</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">HTTP-Only Encrypted Cookie Session</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950">
                            Verified
                          </span>
                        </div>
                      </SettingsCard>
                    </div>
                  )}

                  {/* ═══ 10. NOTIFICATIONS ═══ */}
                  {activeSection === 'notifications' && (
                    <div className="space-y-6">
                      { (user?.role === 'OWNER' || user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN') && (
                        <AdminNotificationComposer />
                      )}
                      
                      <SettingsCard
                        icon={Mail}
                        title={t('settingsEmailNotifications')}
                        description={t('settingsEmailNotificationsDesc')}
                      >
                        <SettingsComingSoonBadge />
                      </SettingsCard>

                      <SettingsCard
                        icon={Bell}
                        title={t('settingsPushNotifications')}
                        description={t('settingsPushNotificationsDesc')}
                      >
                        <SettingsComingSoonBadge />
                      </SettingsCard>
                    </div>
                  )}

                  {/* ═══ 10.5. OTA CHANNEL MANAGER ═══ */}
                  {activeSection === 'channels' && (
                    <div className="space-y-6">
                      {activeProperty ? (
                        <ChannelManagerDashboard propertyId={activeProperty.id} />
                      ) : (
                        <div className="p-6 text-center text-slate-500">
                          {t('selectPropertyToManage')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ═══ 11. BILLING ═══ */}
                  {activeSection === 'billing' && (
                    <div className="space-y-6">
                      <SettingsCard
                        icon={CreditCard}
                        title={t('settingsSubscription')}
                        description={t('settingsSubscriptionDesc')}
                      >
                        <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('settingsFreePlan')}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Unlimited properties during beta period</p>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                            Active Tier
                          </span>
                        </div>
                      </SettingsCard>
                    </div>
                  )}

                  {/* ═══ 12. DEVELOPER ═══ */}
                  {activeSection === 'developer' && (
                    <div className="space-y-6">
                      <SettingsCard
                        icon={Code2}
                        title={t('settingsDeveloperTitle')}
                        description={t('settingsDeveloperDesc')}
                      >
                        <SettingsComingSoonBadge />
                      </SettingsCard>
                    </div>
                  )}

                  {/* ═══ 13. API ═══ */}
                  {activeSection === 'api' && (
                    <div className="space-y-6">
                      <SettingsCard
                        icon={Key}
                        title={t('settingsApiKeys')}
                        description={t('settingsApiKeysDesc')}
                      >
                        <SettingsComingSoonBadge />
                      </SettingsCard>

                      <SettingsCard
                        icon={Code2}
                        title={t('settingsWebhooks')}
                        description={t('settingsWebhooksDesc')}
                      >
                        <SettingsComingSoonBadge />
                      </SettingsCard>
                    </div>
                  )}

                  {/* ═══ 14. ADVANCED ═══ */}
                  {activeSection === 'advanced' && (
                    <div className="space-y-6">
                      <SettingsCard
                        icon={Zap}
                        title={t('settingsAdvancedTitle')}
                        description={t('settingsAdvancedDesc')}
                      >
                        <SettingsComingSoonBadge />
                      </SettingsCard>
                    </div>
                  )}

                  {/* ═══ 15. AUDIT LOGS ═══ */}
                  {activeSection === 'audit-logs' && (
                    <div className="space-y-6">
                      <SettingsCard
                        icon={History}
                        title={t('settingsAuditLogs')}
                        description={t('settingsLogsDesc')}
                      >
                        <SettingsComingSoonBadge />
                      </SettingsCard>
                    </div>
                  )}

                  {/* ═══ 16. BACKUP ═══ */}
                  {activeSection === 'backup' && (
                    <div className="space-y-6">
                      <SettingsCard
                        icon={HardDrive}
                        title={t('settingsBackup')}
                        description={t('settingsBackupDesc')}
                      >
                        <SettingsComingSoonBadge />
                      </SettingsCard>
                    </div>
                  )}
                </>
              )}

            </div>
          </main>

        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   REUSABLE SETTINGS CARD COMPONENT
   ═══════════════════════════════════════════════════ */
interface SettingsCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingsCard({ icon: Icon, title, description, children }: SettingsCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 space-y-5 transition-all duration-200 hover:shadow-xs">
      <div className="flex items-start gap-3.5 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shrink-0">
          <Icon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">{title}</h3>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 min-w-0 break-words">{description}</p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function SettingsComingSoonBadge() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-[#16241e]/60 rounded-lg border border-slate-200/80 dark:border-[#1d3329]">
      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('settingsComingSoon')}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE EXPORT WITH SUSPENSE (SHELL REMAINS UNMOUNTED)
   ═══════════════════════════════════════════════════ */
export default function Settings3ColumnPage() {
  return (
    <Suspense
      fallback={
        /* Localized shell fallback preserving main navigation */
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased flex relative">
          <DashboardSidebar />
          <div className="flex-1 min-w-0 flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-40 w-full" />
              </div>
            </main>
          </div>
        </div>
      }
    >
      <Settings3ColumnContent />
    </Suspense>
  );
}
