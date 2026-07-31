'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { useDeletionRequestsQuery, useApproveDeletionMutation, useRejectDeletionMutation } from '@/features/bookings/api/use-bookings';
import { useTranslation } from '@/lib/i18n';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  Clock,
  Loader2,
} from 'lucide-react';

export default function ApprovalsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  useActivePropertyQuery();
  const activeProperty = usePropertyStore((s) => s.activeProperty);

  const { data: requests, isLoading } = useDeletionRequestsQuery(activeProperty?.id);
  const approveMutation = useApproveDeletionMutation();
  const rejectMutation = useRejectDeletionMutation();

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="flex h-screen bg-slate-50/90 text-slate-900 font-sans antialiased relative overflow-hidden">
      {/* Ambient Rich Emerald Glow Elements */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      <DashboardSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto relative z-10">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
          <div className="px-6 py-4 flex items-center gap-4">
            <button onClick={() => router.push('/bookings')} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                {t('deletionApprovalQueue')}
              </h1>
              <p className="text-sm text-gray-500">{t('reviewPendingDeletionRequests')}</p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto p-6 space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
            </div>
          ) : !requests || requests.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">{t('noApprovalsPending')}</h3>
              <p className="text-sm text-gray-400 mt-1">{t('allCaughtUp')}</p>
            </div>
          ) : (
            requests.map((req: any) => (
              <div key={req.id} className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      {req.booking?.guest?.fullName || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {req.booking?.roomType?.name} • {formatDate(req.booking?.checkInDate)} → {formatDate(req.booking?.checkOutDate)}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200">
                    {t('pendingApproval')}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-medium text-gray-500 mb-1">{t('deletionReason')}:</p>
                  <p className="text-sm text-gray-700">{req.reason}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {t('requestedBy')}: {req.requestedBy?.email} • {formatDate(req.createdAt)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => rejectMutation.mutate(req.id)}
                      disabled={rejectMutation.isPending}
                      className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      {t('reject')}
                    </button>
                    <button
                      onClick={() => approveMutation.mutate(req.id)}
                      disabled={approveMutation.isPending}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {t('approveDelete')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
