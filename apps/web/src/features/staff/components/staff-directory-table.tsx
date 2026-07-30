import React from 'react';
import { StaffItem, StaffRole } from '../types/staff.types';
import { StaffRoleBadge } from './staff-role-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Clock, ShieldAlert, Trash2, Power, CheckCircle, Lock } from 'lucide-react';

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
  const isOwner = currentUserRole === 'OWNER' || currentUserRole === 'SUPER_ADMIN';

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
            Property Staff Directory
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Manage team roles, access states, and property operations permissions.
          </p>
        </div>
      </div>

      {staffList.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
          <Mail className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-600">No staff members invited yet</p>
          <p className="text-[11px] text-slate-400">
            Invite your managers, receptionists, or viewers to start collaborating.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="pb-3 px-2">Member</th>
                <th className="pb-3 px-2">Assigned Role</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2">Invited / Joined</th>
                <th className="pb-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {staffList.map((member) => (
                <tr key={member.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100/80 text-emerald-800 flex items-center justify-center font-black text-xs">
                        {member.user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{member.user.email}</div>
                        {member.user.phone && (
                          <div className="text-[10px] text-slate-400">{member.user.phone}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <StaffRoleBadge role={member.role} />
                  </td>
                  <td className="py-3 px-2">
                    {member.status === 'ACTIVE' && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                        <CheckCircle className="w-3.5 h-3.5" /> Active
                      </span>
                    )}
                    {member.status === 'INVITED' && (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px]">
                        <Clock className="w-3.5 h-3.5" /> Invited (Auto-link)
                      </span>
                    )}
                    {member.status === 'REMOVED' && (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                        <ShieldAlert className="w-3.5 h-3.5" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-slate-500 text-[11px]">
                    {new Date(member.invitedAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {member.status === 'ACTIVE' || member.status === 'INVITED' ? (
                        <button
                          onClick={() => onSuspend(member.id)}
                          disabled={isActionPending}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-bold transition-all flex items-center gap-1 disabled:opacity-60"
                          title="Suspend staff access"
                        >
                          <Power className="w-3 h-3 text-amber-700" /> Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => onReactivate(member.id)}
                          disabled={isActionPending}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold transition-all flex items-center gap-1 disabled:opacity-60"
                          title="Reactivate staff access"
                        >
                          <CheckCircle className="w-3 h-3 text-emerald-700" /> Reactivate
                        </button>
                      )}

                      {/* Permanent Delete Button: Guarded by Owner role */}
                      {isOwner ? (
                        <button
                          onClick={() => onDelete(member.id)}
                          disabled={isActionPending}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-[11px] font-bold transition-all flex items-center gap-1 disabled:opacity-60"
                          title="Permanently remove staff (Owner only)"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" /> Delete
                        </button>
                      ) : (
                        <button
                          disabled
                          onClick={() => onDelete(member.id)}
                          className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 text-[11px] font-bold cursor-not-allowed opacity-50 flex items-center gap-1"
                          title="Action Forbidden: Only Property Owner can permanently remove staff"
                        >
                          <Lock className="w-3 h-3" /> Remove
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
    </div>
  );
}
