import React from 'react';
import { StaffRole } from '../types/staff.types';
import { ShieldCheck, UserCheck, Eye, Crown, Briefcase } from 'lucide-react';

interface StaffRoleBadgeProps {
  role: StaffRole | 'OWNER' | string;
}

export function StaffRoleBadge({ role }: StaffRoleBadgeProps) {
  switch (role) {
    case 'OWNER':
      return (
        <span className="text-xs font-semibold text-slate-700">Property Owner</span>
      );
    case 'MANAGER':
      return (
        <span className="text-xs font-semibold text-slate-700">Manager</span>
      );
    case 'RECEPTION_STAFF':
      return (
        <span className="text-xs font-semibold text-slate-700">Reception Staff</span>
      );
    case 'HOUSEKEEPING':
      return (
        <span className="text-xs font-semibold text-slate-700">Housekeeper</span>
      );
    case 'VIEWER':
      return (
        <span className="text-xs font-semibold text-slate-700">Viewer</span>
      );
    default:
      return (
        <span className="text-xs font-semibold text-slate-700 capitalize">{role.toLowerCase()}</span>
      );
  }
}
