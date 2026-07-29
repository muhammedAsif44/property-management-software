import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export interface PendingApprovalCardProps {
  organizationName: string;
  email: string;
}

export const PendingApprovalCard: React.FC<PendingApprovalCardProps> = ({
  organizationName,
  email,
}) => {
  return (
    <div className="p-8 sm:p-14 text-center max-w-2xl mx-auto flex flex-col items-center">
      <div className="w-20 h-20 rounded-3xl bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center text-3xl mb-6 shadow-inner animate-bounce">
        ⏳
      </div>
      <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wide uppercase">
        Status: Pending Admin Approval
      </span>
      <h2 className="text-3xl font-extrabold text-slate-900 mt-4 tracking-tight">
        Registration Submitted!
      </h2>
      <p className="text-slate-600 text-sm mt-3 leading-relaxed">
        Thank you for registering <strong className="text-slate-900">{organizationName}</strong>. 
        Your owner account (<span className="text-emerald-700 font-semibold">{email}</span>) has been created and sent to our Super Admin team for review.
      </p>

      <div className="my-8 p-5 bg-slate-50 rounded-2xl border border-slate-200 text-left w-full text-xs text-slate-600 space-y-2">
        <div className="font-semibold text-slate-800 uppercase tracking-wider mb-1">What happens next?</div>
        <div className="flex items-start gap-2">
          <span className="text-emerald-600 font-bold">1.</span>
          <span>Super Admin will verify your organization credentials.</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-emerald-600 font-bold">2.</span>
          <span>You will receive an email confirmation once approved.</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-emerald-600 font-bold">3.</span>
          <span>After approval, you can sign in to configure your properties and tenants.</span>
        </div>
      </div>

      <Link href="/login" className="w-full sm:w-auto">
        <Button variant="emerald" size="lg" className="w-full">
          Return to Sign In →
        </Button>
      </Link>
    </div>
  );
};
