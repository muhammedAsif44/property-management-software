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
    <div className="p-4 bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-emerald-100/80 border border-emerald-200 text-emerald-800">
          <Zap className="w-4 h-4 text-emerald-700" />
        </div>
        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">{t('quickActionsAndWorkflows')}</h3>
          <p className="text-[11px] text-slate-500 font-semibold">{t('quickActionsSubtitle')}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Auto-Checkout: Visible to Owner & Manager */}
        {isManagerOrOwner && (
          <button
            onClick={onTriggerAutoCheckout}
            disabled={isAutoCheckoutSyncing}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-900 transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs disabled:opacity-60 cursor-pointer"
            title={t('autoCheckoutExpiredStays')}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isAutoCheckoutSyncing ? 'animate-spin' : ''}`} />
            <span>{isAutoCheckoutSyncing ? t('syncing') : t('autoCheckoutExpiredStays')}</span>
          </button>
        )}


        {/* Staff Directory: Visible to Owner & Manager */}
        {isManagerOrOwner && (
          <Link
            href="/settings/staff"
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-900 transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer active:scale-95"
          >
            <Users className="w-3.5 h-3.5 text-emerald-700" /> {t('staffDirectory')}
          </Link>
        )}
      </div>
    </div>
  );
}
