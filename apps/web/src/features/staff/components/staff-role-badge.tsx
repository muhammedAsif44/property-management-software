import React from 'react';
import { StaffRole } from '../types/staff.types';
import { ShieldCheck, UserCheck, Eye, Crown, Sparkles } from 'lucide-react';

interface StaffRoleBadgeProps {
  role: StaffRole | 'OWNER' | string;
}

export function StaffRoleBadge({ role }: StaffRoleBadgeProps) {
  switch (role) {
    case 'OWNER':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider">
          <Crown className="w-3 h-3 text-amber-700" /> Property Owner
        </span>
      );
    case 'MANAGER':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase tracking-wider">
          <ShieldCheck className="w-3 h-3 text-emerald-700" /> Manager
        </span>
      );
    case 'RECEPTION_STAFF':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-black uppercase tracking-wider">
          <UserCheck className="w-3 h-3 text-blue-700" /> Reception Staff
        </span>
      );
    case 'HOUSEKEEPING':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-black uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-purple-700" /> Housekeeper
        </span>
      );
    case 'VIEWER':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-black uppercase tracking-wider">
          <Eye className="w-3 h-3 text-slate-600" /> Viewer
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black uppercase tracking-wider">
          {role}
        </span>
      );
  }
}
