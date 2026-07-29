'use client';

import React, { memo } from 'react';
import { Step6BankData } from '../types/property-onboarding.types';
import { CreditCard, Check } from 'lucide-react';

interface Props {
  data: Step6BankData;
  onChange: (data: Step6BankData) => void;
  onSave: () => void;
  onBack?: () => void;
  saving?: boolean;
  isSettingsView?: boolean;
}

export const Step6BankDetails: React.FC<Props> = memo(({
  data,
  onChange,
  onSave,
  onBack,
  saving,
  isSettingsView,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#0B6E4F] flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {isSettingsView ? 'Bank & Payment Details' : 'Step 6: Bank & Payment Details'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure bank account details, UPI handle, and payment QR code shown on guest invoices.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Bank Account Holder Name
            </label>
            <input
              type="text"
              value={data.accountHolderName}
              onChange={(e) => onChange({ ...data, accountHolderName: e.target.value })}
              placeholder="e.g. Orvyn Hospitality Pvt Ltd"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0B6E4F]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Bank Name
            </label>
            <input
              type="text"
              value={data.bankName}
              onChange={(e) => onChange({ ...data, bankName: e.target.value })}
              placeholder="e.g. HDFC Bank"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0B6E4F]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Account Number
            </label>
            <input
              type="text"
              value={data.accountNumber}
              onChange={(e) => onChange({ ...data, accountNumber: e.target.value })}
              placeholder="50100012345678"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0B6E4F]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              IFSC Code
            </label>
            <input
              type="text"
              value={data.ifscCode}
              onChange={(e) => onChange({ ...data, ifscCode: e.target.value })}
              placeholder="HDFC0001234"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0B6E4F]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              UPI VPA Handle
            </label>
            <input
              type="text"
              value={data.upiId}
              onChange={(e) => onChange({ ...data, upiId: e.target.value })}
              placeholder="orvynhotel@hdfcbank"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0B6E4F]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              UPI QR Code Image URL
            </label>
            <input
              type="url"
              value={data.qrCodeUrl}
              onChange={(e) => onChange({ ...data, qrCodeUrl: e.target.value })}
              placeholder="https://example.com/qr.png"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0B6E4F]"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
          >
            Back
          </button>
        ) : <div />}

        <button
          onClick={onSave}
          disabled={saving}
          className="px-8 py-3.5 rounded-2xl bg-[#0B6E4F] hover:bg-[#08543c] text-white text-xs font-bold shadow-xl shadow-[#0B6E4F]/25 transition-all flex items-center gap-2"
        >
          {saving ? 'Saving...' : isSettingsView ? 'Save Bank Details' : 'Complete Onboarding & Launch Dashboard'}
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

Step6BankDetails.displayName = 'Step6BankDetails';
