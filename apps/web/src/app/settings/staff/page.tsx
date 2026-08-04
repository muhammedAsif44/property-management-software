'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/features/auth';
import { useToast } from '@/components/ui/toast';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { AppHeader } from '@/components/app-header';
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
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative">
      {/* Left Navigation Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <AppHeader
          actions={
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t('inviteStaff')}</span>
            </button>
          }
        >
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#16241e] hover:bg-slate-200 text-slate-600 dark:text-slate-400 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Team & Staff Management
              </h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {activeProperty ? activeProperty.name : 'Property Workspace'}
              </p>
            </div>
          </div>
        </AppHeader>

        {/* Directory Workspace */}
        <main className="p-4 lg:p-6 space-y-6 w-full flex-1 overflow-y-auto">
          
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
