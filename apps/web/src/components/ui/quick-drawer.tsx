'use client';

import React, { useEffect } from 'react';
import { X, Building2, MapPin, Clock, CreditCard, BedDouble, CheckCircle2, AlertCircle, ExternalLink, Settings, Check } from 'lucide-react';
import Link from 'next/link';
import { PropertyItem } from '@/features/properties';
import { useTranslation } from '@/lib/i18n';

interface QuickDrawerProps {
  property: PropertyItem | null;
  isActive: boolean;
  onClose: () => void;
  onSwitch: (property: PropertyItem) => void;
  isSwitching: boolean;
}

export const QuickDrawer: React.FC<QuickDrawerProps> = ({
  property,
  isActive,
  onClose,
  onSwitch,
  isSwitching,
}) => {
  const { t } = useTranslation();

  // Handle ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (property) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [property, onClose]);

  if (!property) return null;

  const stepPct = Math.min(100, Math.round(((property.onboardingStep || 1) / 6) * 100));
  const checkInTime = property.settings?.checkInTime || '14:00';
  const checkOutTime = property.settings?.checkOutTime || '11:00';
  const hasPaymentSetup = !!(property.settings?.upiId || property.settings?.bankAccountDetails);
  const roomTypesCount = property._count?.roomTypes ?? (property.roomTypes?.length || 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop Blur */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Slide-Over Side Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white/95 backdrop-blur-2xl shadow-2xl border-l border-emerald-200/90 flex flex-col justify-between overflow-y-auto animate-slideInRight relative">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 shadow-sm ${
                  isActive
                    ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-emerald-600/30'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {property.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-slate-900 truncate" title={property.name}>
                  {property.name}
                </h3>
                <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    {property.address ? `${property.address}, ` : ''}
                    {property.city ? `${property.city}, ${property.country || 'IN'}` : 'Location Unset'}
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Main Body Specs */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Active Workspace Status Pill */}
            {isActive ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2.5 shadow-2xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-black uppercase tracking-wider block">
                    {t('activePropertyBadge')}
                  </span>
                  <span className="text-[11px] text-emerald-800 font-medium truncate block">
                    Currently selected active management workspace.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-extrabold text-slate-900 block">
                    Inactive Workspace
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium truncate block">
                    Click below to switch your management context to this property.
                  </span>
                </div>
              </div>
            )}

            {/* Onboarding Progress Card */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">{t('onboardingCompletion')}</span>
                <span className="text-emerald-700 font-black">{stepPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-700 transition-all duration-500"
                  style={{ width: `${stepPct}%` }}
                />
              </div>
            </div>

            {/* Detailed Spec Cards */}
            <div className="space-y-3 text-xs">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Operational Policies & Specs
              </h4>

              {/* Policy Times */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-slate-700">{t('checkInCheckOutPolicy')}</span>
                </div>
                <span className="font-black text-slate-900">{checkInTime} - {checkOutTime}</span>
              </div>

              {/* Rooms Overview */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BedDouble className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-slate-700">{t('roomTypesCountLabel')}</span>
                </div>
                <span className="font-black text-slate-900">{roomTypesCount} Categories</span>
              </div>

              {/* Payment Details Setup */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-slate-700">{t('paymentDetailsConfigured')}</span>
                </div>
                {hasPaymentSetup ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-black">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {t('configured')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-black">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    {t('pendingSetup')}
                  </span>
                )}
              </div>
            </div>

            {/* Currency & Regional Settings */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Regional & Currency Format
              </span>
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>Currency: {property.currency || 'INR'}</span>
                <span>Timezone: {property.timezone || 'Asia/Kolkata'}</span>
              </div>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-5 pb-8 sm:pb-5 border-t border-slate-100 bg-slate-50/90 flex items-center gap-3">
            <button
              onClick={() => onSwitch(property)}
              disabled={isActive || isSwitching}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer min-w-0 ${
                isActive
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/20 active:scale-95'
              } disabled:opacity-75`}
            >
              {isSwitching ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isActive ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="truncate">{t('currentWorkspace')}</span>
                </>
              ) : (
                <span className="truncate">{t('switchActiveWorkspace')}</span>
              )}
            </button>

            <Link
              href={`/settings/property?id=${property.id}`}
              className="p-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all flex items-center justify-center shrink-0 cursor-pointer active:scale-95 shadow-2xs"
              title={t('viewFullSettings')}
            >
              <Settings className="w-4 h-4 text-slate-600 shrink-0" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
