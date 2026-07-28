import React from 'react';
import { formatCurrency } from '@orvyn/utils';
import { PropertyType } from '@orvyn/shared-types';

export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <header className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Orvyn PMS — Customer Web Portal</h1>
        <p className="text-slate-600 mt-2">Welcome to the Orvyn Property Management System Customer Portal.</p>
      </header>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">Shared Package & Config Status</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <span className="text-sm text-slate-500 block">Sample Formatted Currency</span>
            <span className="text-lg font-bold text-sky-600">{formatCurrency(1250.5, 'USD')}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <span className="text-sm text-slate-500 block">Default Property Type</span>
            <span className="text-lg font-bold text-slate-800">{PropertyType.APARTMENT}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
          <span>Tailwind CSS v3 configured</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            Active
          </span>
        </div>
      </section>
    </main>
  );
}
