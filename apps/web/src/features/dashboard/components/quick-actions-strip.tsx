import { authService } from '@/features/auth';
import { useTranslation } from '@/lib/i18n';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Zap, Users } from 'lucide-react';
import Link from 'next/link';

interface QuickActionsStripProps {
  onTriggerAutoCheckout?: () => void;
  isAutoCheckoutSyncing?: boolean;
}

export function QuickActionsStrip({
  onTriggerAutoCheckout,
  isAutoCheckoutSyncing = false,
}: QuickActionsStripProps) {
  const { t } = useTranslation();

  // Fetch user role for button guarding
  const { data: profileData } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => authService.getProfile(),
    staleTime: 60000,
    retry: false,
  });

  const userRole = profileData?.user?.role || profileData?.data?.user?.role || 'OWNER';
  const isOwner = userRole === 'OWNER' || userRole === 'SUPER_ADMIN';
  const isManagerOrOwner = isOwner || userRole === 'MANAGER';

  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-divider shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-divider flex items-center justify-center">
          <Zap className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{t('quickActionsAndWorkflows')}</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{t('quickActionsSubtitle')}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Auto-Checkout: Visible to Owner & Manager */}
        {isManagerOrOwner && (
          <button
            onClick={onTriggerAutoCheckout}
            disabled={isAutoCheckoutSyncing}
            className="interactive px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-divider text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title={t('autoCheckoutExpiredStays')}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isAutoCheckoutSyncing ? 'animate-spin' : ''}`} />
            <span>{isAutoCheckoutSyncing ? t('syncing') : t('autoCheckoutExpiredStays')}</span>
          </button>
        )}


        {/* Staff Directory: Visible to Owner & Manager */}
        {isManagerOrOwner && (
          <Link
            href="/settings/staff"
            className="interactive px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-divider text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all flex items-center gap-1.5"
            title={t('manageStaffRoles')}
          >
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{t('staffDirectory')}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
