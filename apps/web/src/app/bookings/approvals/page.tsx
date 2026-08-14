'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { useDeletionRequestsQuery, useApproveDeletionMutation, useRejectDeletionMutation } from '@/features/bookings/api/use-bookings';
import { useTranslation } from '@/lib/i18n';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  Clock,
  Loader2,
  CalendarDays,
  ShieldAlert,
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
    <AppShell
      sectionIcon={ShieldAlert}
      breadcrumb={{ parent: t('frontDeskOperations') || 'Front Desk Operations' }}
      sectionTitle={t('approvalQueue') || 'Approval Requests'}
      sectionDescription="Review deletion and manager authorization requests"
      layout="narrow"
    >
      <div className="space-y-4 pt-2">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B6E4F] mx-auto" />
          </div>
        ) : !requests || requests.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-2xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('noPendingDeletionRequests')}</h2>
            <p className="text-xs text-slate-500 mt-1">{t('deletionRequestsSubtitle')}</p>
          </div>
        ) : (
          requests.map((req: any) => (
            <div key={req.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {req.booking?.guestName || 'Guest'} — {req.booking?.roomType || 'Room'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('reason')}: <span className="font-medium text-slate-700 dark:text-slate-300">{req.reason || t('noReasonProvided')}</span>
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[11px] font-bold rounded-lg border border-amber-200 dark:border-amber-800 shrink-0">
                  {t('pendingApproval')}
                </span>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-xs">
                <p className="text-slate-400 font-medium">
                  {t('requestedBy')}: {req.requestedBy?.email} • {formatDate(req.createdAt)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => rejectMutation.mutate(req.id)}
                    disabled={rejectMutation.isPending}
                    className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    {t('reject')}
                  </button>
                  <button
                    onClick={() => approveMutation.mutate(req.id)}
                    disabled={approveMutation.isPending}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('approveDelete')}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
