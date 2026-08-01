import React, { useState } from 'react';
import { StaffRole } from '../types/staff.types';
import { Mail, UserPlus, X, Info } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: StaffRole) => void;
  isSubmitting?: boolean;
  currentUserEmail?: string;
  initialEmail?: string;
}

export function InviteStaffModal({
  isOpen,
  onClose,
  onInvite,
  isSubmitting = false,
  currentUserEmail = '',
  initialEmail = '',
}: InviteStaffModalProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState(initialEmail);
  const [role, setRole] = useState<StaffRole>('RECEPTION_STAFF');

  React.useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  if (!isOpen) return null;

  const isSelfInvite = email.trim().toLowerCase() === currentUserEmail.trim().toLowerCase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSelfInvite) return;
    onInvite(email.trim(), role);
    setEmail('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl border border-emerald-200 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">{t('inviteTeamMember')}</h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {t('inviteStaffSubtitle')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              {t('staffEmail')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="receptionist@hotel.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            {isSelfInvite && (
              <p className="text-[11px] font-bold text-rose-600 mt-1">
                You cannot invite your own logged-in email address.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              {t('selectRole')}
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="MANAGER"
                  checked={role === 'MANAGER'}
                  onChange={() => setRole('MANAGER')}
                  className="mt-0.5 accent-emerald-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">{t('operationsManager')}</div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Daily operations, bookings, & staff management (invite/suspend). Cannot edit settings or delete staff.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="RECEPTION_STAFF"
                  checked={role === 'RECEPTION_STAFF'}
                  onChange={() => setRole('RECEPTION_STAFF')}
                  className="mt-0.5 accent-emerald-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">{t('receptionStaff')}</div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Front desk reservations, guest check-ins, invoices & agency entries. No reports or settings access.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="HOUSEKEEPING"
                  checked={role === 'HOUSEKEEPING'}
                  onChange={() => setRole('HOUSEKEEPING')}
                  className="mt-0.5 accent-emerald-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">{t('housekeeperRole') || 'Housekeeper / Room Attendant'}</div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Mobile & web portal to view room cleanliness, update room statuses (Clean/Dirty), and report maintenance issues.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="VIEWER"
                  checked={role === 'VIEWER'}
                  onChange={() => setRole('VIEWER')}
                  className="mt-0.5 accent-emerald-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">{t('propertyViewer')}</div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Read-only access across all permitted screens.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-[11px] font-semibold flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Invited staff will be granted instant property access upon sign-up with no manual approval delay required.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || isSelfInvite}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all disabled:opacity-60 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {isSubmitting ? t('sending') : t('sendInvitation')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
