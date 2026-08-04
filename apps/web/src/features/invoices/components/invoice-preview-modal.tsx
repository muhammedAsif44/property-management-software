import React, { useState, useEffect } from 'react';
import { FileText, Download, X, Loader2, Send } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { invoiceService } from '../services/invoice.service';
import { useIssueInvoiceMutation } from '../api/use-invoices';

export function InvoicePreviewModal({
  bookingId,
  isOpen,
  onClose,
}: {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [isAgency, setIsAgency] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const issueMutation = useIssueInvoiceMutation(bookingId);

  useEffect(() => {
    if (isOpen && bookingId) {
      setIsLoading(true);
      invoiceService
        .generatePreview(bookingId, undefined, isAgency)
        .then((res) => {
          setPreviewHtml(res?.previewHtml || '');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, bookingId, isAgency]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                {t('invoicePreview')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                Live Server Rendered Preview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Guest vs Agency Toggle */}
            <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex gap-1 text-xs font-bold">
              <button
                onClick={() => setIsAgency(false)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  !isAgency ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-white' : 'text-slate-500'
                }`}
              >
                {t('guestInvoice')}
              </button>
              <button
                onClick={() => setIsAgency(true)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  isAgency ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-white' : 'text-slate-500'
                }`}
              >
                {t('agencyInvoice')}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Preview Iframe Container */}
        <div className="flex-1 min-h-[400px] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-semibold gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>{t('generatingPdf')}</span>
            </div>
          ) : (
            <iframe
              srcDoc={previewHtml}
              title="Invoice Preview"
              className="w-full h-full border-0 bg-white"
            />
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            {t('close')}
          </button>
          <button
            onClick={() => {
              issueMutation.mutate(undefined, {
                onSuccess: () => onClose(),
              });
            }}
            disabled={issueMutation.isPending}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {issueMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{t('issueInvoice')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
