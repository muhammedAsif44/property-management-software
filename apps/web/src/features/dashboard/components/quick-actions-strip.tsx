import React from 'react';
import Link from 'next/link';
import { Plus, Settings, RefreshCw, Sparkles, Building2 } from 'lucide-react';

interface QuickActionsStripProps {
  onTriggerAutoCheckout?: () => void;
  isAutoCheckoutSyncing?: boolean;
}

export function QuickActionsStrip({
  onTriggerAutoCheckout,
  isAutoCheckoutSyncing = false,
}: QuickActionsStripProps) {
  return (
    <div className="p-4 bg-white/95 backdrop-blur-xl rounded-2xl border border-emerald-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-emerald-100/80 border border-emerald-200 text-emerald-800">
          <Sparkles className="w-4 h-4 text-emerald-700" />
        </div>
        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Quick Actions & Workflows</h3>
          <p className="text-[11px] text-slate-500 font-semibold">Fast shortcuts for daily property operations.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onTriggerAutoCheckout}
          disabled={isAutoCheckoutSyncing}
          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-900 transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs disabled:opacity-60"
          title="Auto-checkout expired stays"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isAutoCheckoutSyncing ? 'animate-spin' : ''}`} />
          <span>{isAutoCheckoutSyncing ? 'Syncing...' : 'Auto-Checkout Expired Stays'}</span>
        </button>

        <Link
          href="/onboarding/property"
          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-900 transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs"
        >
          <Building2 className="w-3.5 h-3.5 text-emerald-700" /> Add Property
        </Link>

        <Link
          href="/settings/property"
          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-900 transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs"
        >
          <Settings className="w-3.5 h-3.5 text-emerald-700" /> Settings
        </Link>
      </div>
    </div>
  );
}
