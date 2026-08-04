import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, ArrowUpRight, ArrowDownLeft, X, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useBookingPaymentsQuery, useRecordPaymentMutation } from '../api/use-payments';

export function PaymentEntryModal({
  bookingId,
  isOpen,
  onClose,
}: {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('CASH');
  const [referenceNote, setReferenceNote] = useState('');
  const [isRefund, setIsRefund] = useState(false);

  const { data, isLoading } = useBookingPaymentsQuery(bookingId);
  const recordMutation = useRecordPaymentMutation(bookingId);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setReferenceNote('');
      setIsRefund(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed === 0) return;

    const finalAmount = isRefund ? -Math.abs(parsed) : Math.abs(parsed);

    recordMutation.mutate(
      {
        amount: finalAmount,
        mode,
        referenceNote,
      },
      {
        onSuccess: () => {
          setAmount('');
          setReferenceNote('');
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                {t('paymentHistory')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">
                {t('recordPayment')} / {t('recordRefund')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Summary Strip */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block truncate">{t('totalAmount')}</span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
              ₹{data?.totalAmount?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block truncate">{t('totalPaid')}</span>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 truncate">
              ₹{data?.totalPaid?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block truncate">{t('balanceDue')}</span>
            <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400 truncate">
              ₹{data?.balanceDue?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>

        {/* Action Toggle (Payment vs Refund) */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsRefund(false)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              !isRefund
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span className="truncate">{t('recordPayment')}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsRefund(true)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isRefund
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="truncate">{t('recordRefund')}</span>
          </button>
        </div>

        {/* Payment Entry Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 truncate">
                {isRefund ? t('recordRefund') : t('recordPayment')} (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 truncate">
                {t('paymentMode')}
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-600"
              >
                <option value="CASH">{t('cash')}</option>
                <option value="UPI">{t('upi')}</option>
                <option value="BANK_TRANSFER">{t('bankTransfer')}</option>
                <option value="CREDIT_CARD">{t('creditCard')}</option>
                <option value="DEBIT_CARD">{t('debitCard')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 truncate">
              {t('referenceNote')}
            </label>
            <input
              type="text"
              value={referenceNote}
              onChange={(e) => setReferenceNote(e.target.value)}
              placeholder="e.g. UPI Ref #99281 / Cash at Desk"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={recordMutation.isPending || !amount}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                isRefund ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {recordMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isRefund ? t('recordRefund') : t('recordPayment')}</span>
            </button>
          </div>
        </form>

        {/* Append-Only Ledger History Table */}
        <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
            {t('paymentHistory')}
          </h4>
          {isLoading ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading ledger...</div>
          ) : !data?.payments || data.payments.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 font-medium">
              {t('noPaymentsRecorded')}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              {data.payments.map((p: any) => (
                <div key={p.id} className="p-3 flex items-center justify-between bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-w-0">
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-extrabold ${p.isRefund ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                        {p.isRefund ? '-' : '+'}₹{Math.abs(p.amount).toFixed(2)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {p.mode}
                      </span>
                    </div>
                    {p.referenceNote && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {p.referenceNote}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(p.paidAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
