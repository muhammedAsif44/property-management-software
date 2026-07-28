import React from 'react';
import { UserRole } from '@orvyn/shared-types';
import { PERMISSIONS } from '@orvyn/config';

export default function AdminHomePage() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <header className="border-b border-slate-800 pb-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Orvyn PMS — Admin Panel</h1>
            <p className="text-slate-400 mt-2">System Administration and Management Portal.</p>
          </div>
          <span className="px-3 py-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full text-xs font-semibold uppercase tracking-wider">
            Admin Area
          </span>
        </div>
      </header>

      <section className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 space-y-4 backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-slate-200">Role & Permissions Verification</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/30">
            <span className="text-xs text-slate-400 block uppercase font-medium">Super Admin Role</span>
            <span className="text-lg font-bold text-violet-400">{UserRole.SUPER_ADMIN}</span>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/30">
            <span className="text-xs text-slate-400 block uppercase font-medium">Sample Permission Key</span>
            <span className="text-lg font-bold text-slate-200">{PERMISSIONS.BOOKING_CREATE}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700/40 flex items-center justify-between text-xs text-slate-400">
          <span>Tailwind CSS Dark Mode Theme</span>
          <span className="text-emerald-400 font-medium">✓ Verified</span>
        </div>
      </section>
    </main>
  );
}
