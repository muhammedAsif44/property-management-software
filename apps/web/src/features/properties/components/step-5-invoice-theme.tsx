'use client';

import React, { memo, useMemo } from 'react';
import { InvoiceTemplateItem } from '../services/property.service';
import { Step1IdentityData, Step6BankData, RoomTypeItem } from '../types/property-onboarding.types';
import { ArrowRight, FileText, Check } from 'lucide-react';

interface Props {
  selectedTemplateId: string;
  invoiceTemplates: InvoiceTemplateItem[];
  identityData: Step1IdentityData;
  bankData: Step6BankData;
  roomTypes: RoomTypeItem[];
  onChange: (templateId: string) => void;
  onSave: () => void;
  onBack?: () => void;
  saving?: boolean;
  isSettingsView?: boolean;
}

export const Step5InvoiceTheme: React.FC<Props> = memo(({
  selectedTemplateId,
  invoiceTemplates,
  identityData,
  bankData,
  roomTypes,
  onChange,
  onSave,
  onBack,
  saving,
  isSettingsView,
}) => {
  // Memoized Template Renderers to eliminate regex replacement overhead on every key stroke
  const renderedTemplates = useMemo(() => {
    return invoiceTemplates.map((tpl) => {
      const html = tpl.htmlContent
        .replace('{{propertyName}}', identityData.name || 'Sample Hotel')
        .replace('{{propertyAddress}}', identityData.address || 'Goa, IN')
        .replace('{{gstNumber}}', '22AAAAA0000A1Z5')
        .replace('{{invoiceId}}', 'INV-2026-001')
        .replace('{{guestName}}', 'John Doe')
        .replace('{{checkInDate}}', '2026-08-01')
        .replace('{{checkOutDate}}', '2026-08-03')
        .replace('{{roomCategory}}', roomTypes[0]?.name || 'Deluxe Suite')
        .replace('{{nights}}', '2')
        .replace('{{totalAmount}}', '₹7,000')
        .replace('{{upiId}}', bankData.upiId || 'hotel@upi')
        .replace('{{bankName}}', bankData.bankName || 'State Bank of India')
        .replace('{{accountNumber}}', bankData.accountNumber || 'XXXX1234');

      return {
        ...tpl,
        renderedHtml: html,
      };
    });
  }, [invoiceTemplates, identityData, bankData, roomTypes]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#0B6E4F] flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {isSettingsView ? 'Invoice Theme Settings' : 'Step 5: Invoice Theme Selection'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pick a starting invoice template with real-time live preview.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderedTemplates.map((tpl) => {
          const isSelected = tpl.id === selectedTemplateId;

          return (
            <div
              key={tpl.id}
              onClick={() => onChange(tpl.id)}
              className={`cursor-pointer p-6 rounded-3xl border-2 transition-all ${
                isSelected
                  ? 'border-[#0B6E4F] bg-emerald-50/40 shadow-lg shadow-[#0B6E4F]/10'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-slate-900">{tpl.name}</h3>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#0B6E4F] text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 text-[10px] text-slate-600 font-mono max-h-48 overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: tpl.renderedHtml }} />
              </div>
            </div>
          );
        })}
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
          className="px-6 py-3 rounded-2xl bg-[#0B6E4F] hover:bg-[#08543c] text-white text-xs font-bold shadow-xl shadow-[#0B6E4F]/25 transition-all flex items-center gap-2"
        >
          {saving ? 'Saving...' : isSettingsView ? 'Save Active Theme' : 'Save & Continue to Step 6'}
          {!isSettingsView && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
});

Step5InvoiceTheme.displayName = 'Step5InvoiceTheme';
