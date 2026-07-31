'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/features/auth';
import { useToast } from '@/components/ui/toast';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useStaffDirectoryQuery,
  useInviteStaffMutation,
  useSuspendStaffMutation,
  useReactivateStaffMutation,
  useDeleteStaffMutation,
  StaffDirectoryTable,
  InviteStaffModal,
  StaffRole,
} from '@/features/staff';
import {
  Users,
  UserPlus,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Building2,
} from 'lucide-react';

import { useTranslation, LanguageSwitcher } from '@/lib/i18n';

export default function StaffDirectoryPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Active Property Query & Context
  const { isError: propError, error: propQueryError } = useActivePropertyQuery();
  const activeProperty = usePropertyStore((state) => state.activeProperty);

  // Staff Directory Query
  const {
    data: staffData,
    isLoading: staffLoading,
    isError: staffError,
    error: queryError,
    refetch,
  } = useStaffDirectoryQuery(activeProperty?.id);

  // Staff Mutations
  const inviteStaffMutation = useInviteStaffMutation(activeProperty?.id);
  const suspendStaffMutation = useSuspendStaffMutation();
  const reactivateStaffMutation = useReactivateStaffMutation();
  const deleteStaffMutation = useDeleteStaffMutation();

  const handleInvite = (email: string, role: StaffRole) => {
    inviteStaffMutation.mutate(
      { email, role, propertyId: activeProperty?.id },
      {
        onSuccess: () => setIsInviteModalOpen(false),
      },
    );
  };

  const handleSuspend = (staffId: string) => {
    suspendStaffMutation.mutate(staffId);
  };

  const handleReactivate = (staffId: string) => {
    reactivateStaffMutation.mutate(staffId);
  };

  const toast = useToast();

  // Redirect to login if unauthenticated (HTTP 401)
  const is401Error =
    (queryError as any)?.status === 401 ||
    (queryError as any)?.statusCode === 401 ||
    (propQueryError as any)?.status === 401 ||
    (propQueryError as any)?.statusCode === 401;

  // Redirect to dashboard if forbidden (HTTP 403)
  const is403Error =
    (queryError as any)?.status === 403 ||
    (queryError as any)?.statusCode === 403 ||
    (propQueryError as any)?.status === 403 ||
    (propQueryError as any)?.statusCode === 403;

  const [resendEmail, setResendEmail] = useState('');

  // Query profile for upfront RBAC guard
  const { data: profileData } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => authService.getProfile(),
    staleTime: 60000,
    retry: false,
  });

  const userRole = profileData?.user?.role || profileData?.data?.user?.role || 'OWNER';
  const userEmail = profileData?.user?.email || profileData?.data?.user?.email || '';

  React.useEffect(() => {
    if (profileData) {
      const uRole = profileData?.user?.role || profileData?.data?.user?.role || '';
      if (uRole && uRole !== 'OWNER' && uRole !== 'SUPER_ADMIN' && uRole !== 'MANAGER') {
        toast.info(
          'Access Restricted: Staff directory management is reserved for Property Owners and Managers.',
          'Restricted Access'
        );
        router.push('/dashboard');
      }
    }
  }, [profileData, router, toast]);

  React.useEffect(() => {
    if (is401Error) {
      router.push('/login');
    }
  }, [is401Error, router]);

  React.useEffect(() => {
    if (is403Error) {
      toast.info(
        'Access Restricted: Staff directory management is reserved for Property Owners and Managers.',
        'Restricted Access',
      );
      router.push('/dashboard');
    }
  }, [is403Error, router, toast]);

  const handleDelete = (staffId: string) => {
    if (confirm('Are you sure you want to permanently delete this staff member from your property?')) {
      deleteStaffMutation.mutate(staffId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/90 text-slate-900 font-sans antialiased flex relative overflow-hidden">
      {/* Ambient Rich Emerald Glow Elements */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Left Navigation Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 transition-all duration-300 relative z-10 flex flex-col min-h-screen">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-emerald-200/80 sticky top-0 z-30 px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" /> Team & Staff Management
              </h2>
              <p className="text-[11px] font-bold text-emerald-700/80 flex items-center gap-1 mt-0.5">
                {activeProperty ? activeProperty.name : 'Property Workspace'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <LanguageSwitcher />

            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" /> {t('inviteStaff')}
            </button>
          </div>
        </header>

        {/* Directory Workspace */}
        <main className="p-6 space-y-6 w-full flex-1">
          
          {/* Error Banner with Retry (Suppressed for 401 & 403) */}
          {staffError && !is401Error && !is403Error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/90 text-rose-800 flex items-center justify-between gap-4 shadow-sm animate-fade-in">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                <p className="text-xs font-bold">
                  {(queryError as any)?.message || 'Failed to load staff directory.'}
                </p>
              </div>
              <button
                onClick={() => refetch()}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          {/* Hero Banner */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 text-white shadow-lg shadow-emerald-950/15 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-700/40">
            <div className="space-y-2 z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-[11px] font-bold uppercase tracking-wider border border-white/10">
                <ShieldCheck className="w-3 h-3 text-emerald-300" /> Team Access Control
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                Staff Directory & Role Permissions
              </h1>
              <p className="text-xs text-emerald-100/90 font-medium leading-relaxed">
                Invite managers, receptionists, or read-only viewers by email. Invited team members are linked automatically on sign-up.
              </p>
            </div>

            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white text-emerald-900 text-xs font-extrabold hover:bg-emerald-50 transition-all shadow-sm z-10 shrink-0 flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4 text-emerald-700" /> Invite Team Member
            </button>

            <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Staff Directory Table */}
          <StaffDirectoryTable
            staffList={staffData?.staff}
            currentUserRole={userRole}
            loading={staffLoading}
            onSuspend={handleSuspend}
            onReactivate={handleReactivate}
            onDelete={handleDelete}
            onResendInvite={(email) => {
              setResendEmail(email);
              setIsInviteModalOpen(true);
            }}
            isActionPending={
              suspendStaffMutation.isPending ||
              reactivateStaffMutation.isPending ||
              deleteStaffMutation.isPending
            }
          />

          {/* Invite Staff Modal */}
          <InviteStaffModal
            isOpen={isInviteModalOpen}
            onClose={() => {
              setIsInviteModalOpen(false);
              setResendEmail('');
            }}
            onInvite={handleInvite}
            isSubmitting={inviteStaffMutation.isPending}
            currentUserEmail={userEmail}
            initialEmail={resendEmail}
          />

        </main>
      </div>
    </div>
  );
}
