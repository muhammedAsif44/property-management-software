import React, { useState } from 'react';
import { StaffItem, StaffRole } from '../types/staff.types';
import { StaffRoleBadge } from './staff-role-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Clock, ShieldAlert, Trash2, Power, CheckCircle, Lock, AlertTriangle, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface StaffDirectoryTableProps {
  staffList?: StaffItem[];
  currentUserRole?: string;
  loading?: boolean;
  onSuspend: (staffId: string) => void;
  onReactivate: (staffId: string) => void;
  onDelete: (staffId: string) => void;
  isActionPending?: boolean;
}

export function StaffDirectoryTable({
  staffList = [],
  currentUserRole = 'OWNER',
  loading = false,
  onSuspend,
  onReactivate,
  onDelete,
  isActionPending = false,
}: StaffDirectoryTableProps) {
  const { t } = useTranslation();
  const isOwner = currentUserRole === 'OWNER' || currentUserRole === 'SUPER_ADMIN';

  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState<{
    type: 'suspend' | 'reactivate' | 'delete';
    staffId: string;
    email: string;
  } | null>(null);

  const handleConfirmAction = () => {
    if (!confirmState) return;
    if (confirmState.type === 'suspend') {
      onSuspend(confirmState.staffId);
    } else if (confirmState.type === 'reactivate') {
      onReactivate(confirmState.staffId);
    } else if (confirmState.type === 'delete') {
      onDelete(confirmState.staffId);
    }
    setConfirmState(null);
  };

  if (loading) {
    return (
      <div className="p-6 bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-xs space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            {t('propertyStaffDirectory')}
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            {t('staffDirectorySubtitle')}
          </p>
        </div>
      </div>

      {staffList.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
          <Mail className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-600">{t('noStaffInvitedYet')}</p>
          <p className="text-[11px] text-slate-400">{t('inviteStaffSubtitle')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="pb-3 px-2">{t('member')}</th>
                <th className="pb-3 px-2">{t('assignedRole')}</th>
                <th className="pb-3 px-2">{t('status')}</th>
                <th className="pb-3 px-2">{t('invitedJoined')}</th>
                <th className="pb-3 px-2 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {staffList.map((member) => (
                <tr key={member.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100/80 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">
                        {member.user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate min-w-0">
                        <div className="font-bold text-slate-900 truncate">{member.user.email}</div>
                        {member.user.phone && (
                          <div className="text-[10px] text-slate-400 truncate">{member.user.phone}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 whitespace-nowrap">
                    <StaffRoleBadge role={member.role} />
                  </td>
                  <td className="py-3 px-2 whitespace-nowrap">
                    {member.status === 'ACTIVE' && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                        <CheckCircle className="w-3.5 h-3.5" /> {t('active')}
                      </span>
                    )}
                    {member.status === 'INVITED' && (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px]">
                        <Clock className="w-3.5 h-3.5" /> {t('invited')}
                      </span>
                    )}
                    {member.status === 'REMOVED' && (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                        <ShieldAlert className="w-3.5 h-3.5" /> {t('suspended')}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(member.invitedAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-2 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {member.status === 'ACTIVE' || member.status === 'INVITED' ? (
                        <button
                          onClick={() => setConfirmState({ type: 'suspend', staffId: member.id, email: member.user.email })}
                          disabled={isActionPending}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-bold transition-all flex items-center gap-1 disabled:opacity-60 cursor-pointer"
                          title="Suspend staff access"
                        >
                          <Power className="w-3 h-3 text-amber-700" /> {t('suspend')}
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmState({ type: 'reactivate', staffId: member.id, email: member.user.email })}
                          disabled={isActionPending}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold transition-all flex items-center gap-1 disabled:opacity-60 cursor-pointer"
                          title="Reactivate staff access"
                        >
                          <CheckCircle className="w-3 h-3 text-emerald-700" /> {t('reactivate')}
                        </button>
                      )}

                      {/* Permanent Delete Button: Guarded by Owner role */}
                      {isOwner ? (
                        <button
                          onClick={() => setConfirmState({ type: 'delete', staffId: member.id, email: member.user.email })}
                          disabled={isActionPending}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-[11px] font-bold transition-all flex items-center gap-1 disabled:opacity-60 cursor-pointer"
                          title="Permanently remove staff (Owner only)"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" /> {t('delete')}
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 text-[11px] font-bold cursor-not-allowed opacity-50 flex items-center gap-1"
                          title="Action Forbidden: Only Property Owner can permanently remove staff"
                        >
                          <Lock className="w-3 h-3" /> {t('delete')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <AlertTriangle className={`w-5 h-5 ${confirmState.type === 'delete' ? 'text-rose-600' : confirmState.type === 'suspend' ? 'text-amber-600' : 'text-emerald-600'}`} />
                <h4 className="text-sm font-extrabold">
                  {confirmState.type === 'delete' && t('confirmDeleteTitle')}
                  {confirmState.type === 'suspend' && t('confirmSuspendTitle')}
                  {confirmState.type === 'reactivate' && t('confirmReactivateTitle')}
                </h4>
              </div>
              <button
                onClick={() => setConfirmState(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {confirmState.type === 'delete' && t('confirmDeleteText')}
                {confirmState.type === 'suspend' && t('confirmSuspendText')}
                {confirmState.type === 'reactivate' && t('confirmReactivateText')}
              </p>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-black text-slate-900 truncate">
                {confirmState.email}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmState(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={isActionPending}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md cursor-pointer ${
                  confirmState.type === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmState.type === 'suspend'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {t('confirmAction')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
