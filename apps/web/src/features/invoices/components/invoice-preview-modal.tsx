'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, X, Loader2, Send, CheckCircle2, Building2, Share2, Printer, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import { useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '../services/invoice.service';
import { useIssueInvoiceMutation } from '../api/use-invoices';
import { calculateTac } from '@/lib/utils/financial-math';

interface InvoicePreviewModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
  bookingData?: any;
}

export function InvoicePreviewModal({
  bookingId,
  isOpen,
  onClose,
  bookingData,
}: InvoicePreviewModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isAgency, setIsAgency] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const issueMutation = useIssueInvoiceMutation(bookingId);
  const existingInvoice = bookingData?.invoices?.[0];

  const handlePrintPdf = () => {
    if (!previewHtml) {
      toast.error('Invoice content is loading, please try again in a moment.', 'Not Ready');
      return;
    }

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${existingInvoice?.invoiceNumber || 'INV-FINAL'}</title>
            <style>
              @media print {
                @page { size: A4; margin: 10mm; }
                body { font-family: system-ui, -apple-system, sans-serif; -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
              }
            </style>
          </head>
          <body>
            ${previewHtml}
            <script>
              window.onload = function() {
                window.focus();
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          if (printFrame.parentNode) {
            printFrame.parentNode.removeChild(printFrame);
          }
        } catch {}
      }, 5000);
    }
  };

  const handleDownload = async () => {
    if (!existingInvoice) return;
    try {
      setIsDownloading(true);
      toast.info('Fetching your PDF document...', 'Downloading');
      await invoiceService.downloadInvoice(existingInvoice.id, existingInvoice.invoiceNumber || 'INV-FINAL');
      toast.success('Invoice PDF generated successfully!', 'Downloaded');
    } catch (err: any) {
      toast.error('Failed to download invoice PDF.', 'Error');
    } finally {
      setIsDownloading(false);
    }
  };

  // Auto-poll bookings query every 2.5s while invoice PDF is GENERATING in background
  useEffect(() => {
    if (isOpen && existingInvoice?.status === 'GENERATING') {
      const timer = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
      }, 2500);
      return () => clearInterval(timer);
    }
  }, [isOpen, existingInvoice?.status, queryClient]);

  useEffect(() => {
    if (isOpen && bookingId) {
      setIsLoading(true);
      invoiceService
        .generatePreview(bookingId, undefined, isAgency)
        .then((res) => {
          setPreviewHtml(res?.previewHtml || res || '');
        })
        .catch(() => {
          setPreviewHtml('');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, bookingId, isAgency]);

  const formatDateClean = (d: any) => {
    if (!d) return '—';
    const str = String(d);
    const dateStr = str.includes('T') ? str : `${str}T00:00:00`;
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return str;
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const hasAgency = bookingData?.channel === 'AGENCY' || !!bookingData?.agencyId || !!bookingData?.agency;

  useEffect(() => {
    if (!hasAgency && isAgency) {
      setIsAgency(false);
    }
  }, [hasAgency, isAgency]);

  if (!isOpen) return null;

  const agency = bookingData?.agency;
  const agencyName = agency?.name || 'Travel Agency Partner';
  const guestName = bookingData?.guest?.fullName || bookingData?.guestName || 'Guest';

  const agencyContact = [
    agency?.contactPerson ? `Contact: ${agency.contactPerson}` : null,
    agency?.phone ? `Tel: ${agency.phone}` : null,
    agency?.email ? `Email: ${agency.email}` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  const billedToName = isAgency ? agencyName : guestName;
  const billedToSub = isAgency
    ? `${agencyContact ? `<span style="display:block; color:#475569; font-size:11px; margin-top:2px;">${agencyContact}</span>` : ''}<span style="display:block; margin-top:4px; font-weight:700;">Guest Passenger: ${guestName}</span>`
    : `${bookingData?.guest?.phone || bookingData?.guestPhone || ''} ${bookingData?.guest?.email ? `· ${bookingData.guest.email}` : ''}`;

  const invoiceTitle = isAgency
    ? 'Official Travel Agency Commercial Invoice (TAC)'
    : 'Official Guest Stay Tax Invoice';

  // Wrap HTML for high-contrast, flawless iframe rendering
  const formattedSrcDoc = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice Preview</title>
      <style>
        * { box-sizing: border-box; }
        html, body {
          margin: 0;
          padding: 24px;
          background-color: #ffffff;
          color: #0f172a;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.5;
        }
        .invoice-card {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          background: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid ${isAgency ? '#2563eb' : '#059669'};
          padding-bottom: 24px;
          margin-bottom: 28px;
        }
        .brand-title {
          font-size: 24px;
          font-weight: 900;
          color: ${isAgency ? '#2563eb' : '#059669'};
          margin: 0 0 4px 0;
          letter-spacing: -0.5px;
        }
        .brand-subtitle {
          font-size: 12px;
          color: #64748b;
          font-weight: 700;
          margin: 0;
        }
        .invoice-meta {
          text-align: right;
        }
        .inv-num {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .inv-date {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
        }
        .guest-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          background: ${isAgency ? '#eff6ff' : '#f8fafc'};
          padding: 20px;
          border-radius: 16px;
          border: 1px solid ${isAgency ? '#bfdbfe' : '#e2e8f0'};
          margin-bottom: 28px;
        }
        .section-label {
          font-size: 10px;
          font-weight: 900;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }
        .guest-name {
          font-size: 15px;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
        }
        .guest-sub {
          font-size: 12px;
          color: #475569;
          margin: 4px 0 0 0;
          font-weight: 600;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 28px;
        }
        th {
          text-align: left;
          padding: 12px 16px;
          background-color: #f1f5f9;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #475569;
          border-bottom: 2px solid #cbd5e1;
        }
        td {
          padding: 14px 16px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
        }
        .text-right { text-align: right; }
        .row-highlight {
          background-color: ${isAgency ? '#eff6ff' : '#ecfdf5'};
          font-weight: 800;
          color: ${isAgency ? '#1e40af' : '#065f46'};
        }
        .badge-paid {
          display: inline-block;
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #86efac;
          padding: 4px 14px;
          border-radius: 9999px;
          font-weight: 900;
          font-size: 11px;
          text-transform: uppercase;
        }
        .badge-unpaid {
          display: inline-block;
          background: #ffe4e6;
          color: #be123c;
          border: 1px solid #fecdd3;
          padding: 4px 14px;
          border-radius: 9999px;
          font-weight: 900;
          font-size: 11px;
          text-transform: uppercase;
        }
        .footer-note {
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="header">
          <div>
            <h1 class="brand-title">${bookingData?.property?.name || 'Azura Resorts & Spa'}</h1>
            <p class="brand-subtitle">${invoiceTitle}</p>
          </div>
          <div class="invoice-meta">
            <p class="inv-num">${isAgency ? 'AGY' : 'INV'}-${bookingId.slice(0, 8).toUpperCase()}</p>
            <p class="inv-date">Date: ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>

          <div class="guest-grid">
            <div>
              <div class="section-label">${isAgency ? 'Billed Agency Partner' : 'Billed Guest'}</div>
              <p class="guest-name">${billedToName}</p>
              <p class="guest-sub">${billedToSub}</p>
            </div>
            <div style="text-align: right;">
              <div class="section-label">Stay Period</div>
              <p class="guest-name">${formatDateClean(bookingData?.checkInDate)} &rarr; ${formatDateClean(bookingData?.checkOutDate)}</p>
              <div style="margin-top: 6px;">
                ${
                  (bookingData?.balanceDue || 0) <= 0
                    ? '<span class="badge-paid">Paid In Full</span>'
                    : '<span class="badge-unpaid">Balance Due</span>'
                }
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Room Accommodations (${bookingData?.roomType?.name || 'Deluxe Room'})</td>
                <td class="text-right">₹${Number(bookingData?.baseAmount || 0).toLocaleString('en-IN')}</td>
              </tr>
              ${
                (bookingData?.bookingFacilities || []).length > 0
                  ? bookingData.bookingFacilities
                      .map(
                        (f: any) => `
                    <tr>
                      <td>Add-on Facility: ${f.amenity?.name || 'Facility'}</td>
                      <td class="text-right">₹${Number(f.priceAtBooking || f.amenity?.price || 0).toLocaleString('en-IN')}</td>
                    </tr>`
                      )
                      .join('')
                  : ''
              }
              <tr class="row-highlight">
                <td style="font-weight: 900; color: ${isAgency ? '#1e40af' : '#065f46'};">Total Booking Invoice Amount</td>
                <td class="text-right" style="font-weight: 900; color: ${isAgency ? '#1e40af' : '#065f46'};">₹${Number(bookingData?.totalAmount || 0).toLocaleString('en-IN')}</td>
              </tr>
              ${
                isAgency || bookingData?.agency
                  ? (() => {
                      const rate = Number(bookingData?.tacRateAtBooking || bookingData?.agency?.defaultTacRate || 10);
                      const { tacAmount, propertyAmount } = calculateTac(bookingData?.totalAmount || 0, rate);
                      return `
                      <tr style="background-color: #eff6ff;">
                        <td style="font-weight: 800; color: #1e40af;">Travel Agency TAC Commission (${rate}%)</td>
                        <td class="text-right" style="font-weight: 900; color: #1e40af;">- ₹${tacAmount.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr style="background-color: #f0fdf4;">
                        <td style="font-weight: 900; color: #166534;">Net Property Amount (After TAC)</td>
                        <td class="text-right" style="font-weight: 900; color: #166534;">₹${propertyAmount.toLocaleString('en-IN')}</td>
                      </tr>`;
                    })()
                  : ''
              }
              <tr>
                <td>Total Payments Received (Advance / Ledger)</td>
                <td class="text-right" style="color: #059669; font-weight: 900;">₹${Number(bookingData?.advancePaid || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr style="background: #fef2f2;">
                <td style="font-weight: 900; color: #be123c;">Outstanding Balance Due</td>
                <td class="text-right" style="font-weight: 900; color: #be123c;">₹${Number(bookingData?.balanceDue || 0).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-note">
            <p style="margin:0;">Thank you for staying at ${bookingData?.property?.name || 'Azura Resorts & Spa'}. Generated by Orvyn PMS.</p>
          </div>
        </div>
      </body>
      </html>
    `;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`p-2.5 rounded-2xl shrink-0 border ${
                isAgency
                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {isAgency ? <Building2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                {isAgency ? 'Agency Partner Invoice' : t('invoicePreview')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold truncate">
                {isAgency ? `Billed To: ${billedToName}` : 'Official Guest Tax Invoice'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Guest vs Agency Toggle (Shown only if booking is connected with a Travel Agency Partner) */}
            {hasAgency && (
              <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 flex gap-1 text-xs font-bold border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setIsAgency(false)}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                    !isAgency
                      ? 'bg-white dark:bg-slate-900 shadow-2xs text-slate-900 dark:text-white font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t('guestInvoice')}
                </button>
                <button
                  onClick={() => setIsAgency(true)}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                    isAgency
                      ? 'bg-blue-600 text-white shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t('agencyInvoice')}
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Preview Iframe Container */}
        <div className="flex-1 min-h-[500px] h-[520px] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white relative shadow-inner">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 font-bold gap-2 bg-white">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              <span>{t('generatingPdf')}...</span>
            </div>
          ) : (
            <iframe
              srcDoc={formattedSrcDoc}
              title="Invoice Preview"
              className="w-full h-full border-0 bg-white overflow-y-auto"
            />
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {(bookingData?.balanceDue || 0) <= 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Fully Paid (₹0 Balance)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs font-black border border-rose-200 dark:border-rose-800">
                Balance Due: ₹{Number(bookingData?.balanceDue || 0).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              {t('close')}
            </button>

            {(() => {
              const existingInvoice = bookingData?.invoices?.[0];
              const hasInvoice = !!existingInvoice;

              if (hasInvoice) {
                return (
                  <div className="flex items-center gap-2">
                    {existingInvoice.pdfUrl && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(existingInvoice.pdfUrl);
                          toast.success('Invoice CDN link copied to clipboard!', 'Link Copied');
                        }}
                        className="px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Copy CDN Link"
                      >
                        <Share2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                        <span>Share Link</span>
                      </button>
                    )}

                    <button
                      onClick={handlePrintPdf}
                      className="px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Print or Save as PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      <span>Print / Save PDF</span>
                    </button>

                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
                    </button>
                  </div>
                );
              }

              return (
                <button
                  onClick={() => {
                    issueMutation.mutate(undefined, {
                      onSuccess: () => onClose(),
                    });
                  }}
                  disabled={issueMutation.isPending}
                  className={`px-6 py-2.5 rounded-full text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 ${
                    isAgency
                      ? 'bg-blue-700 hover:bg-blue-800 shadow-blue-900/20'
                      : 'bg-emerald-800 hover:bg-emerald-900 shadow-emerald-900/20'
                  }`}
                >
                  {issueMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{isAgency ? 'Issue Agency Invoice' : t('issueInvoice')}</span>
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
