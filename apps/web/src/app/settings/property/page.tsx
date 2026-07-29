'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  PropertySwitcher,
  propertyService,
  usePropertyOnboarding,
  Step1Identity,
  Step2TimesTerms,
  Step3Rooms,
  Step4Amenities,
  Step5InvoiceTheme,
  Step6BankDetails,
  PropertyItem,
} from '@/features/properties';
import {
  Building2,
  Clock,
  BedDouble,
  Sparkles,
  FileText,
  CreditCard,
  RefreshCw,
} from 'lucide-react';

export default function PropertySettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'identity' | 'times' | 'rooms' | 'amenities' | 'invoices' | 'bank'>('identity');

  const {
    propertyId,
    property,
    loading,
    saving,
    step1Data,
    setStep1Data,
    step2Data,
    setStep2Data,
    roomTypes,
    setRoomTypes,
    amenities,
    setAmenities,
    selectedTemplateId,
    setSelectedTemplateId,
    bankData,
    setBankData,
    invoiceTemplates,
    loadPropertyData,
    saveStep,
  } = usePropertyOnboarding();

  useEffect(() => {
    propertyService
      .getActiveProperty()
      .then((res: { activeProperty: PropertyItem | null }) => {
        if (res.activeProperty) {
          loadPropertyData(res.activeProperty.id);
        } else {
          router.push('/onboarding/property');
        }
      })
      .catch(() => router.push('/login'));
  }, [router, loadPropertyData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm flex-col gap-3 font-sans">
        <RefreshCw className="w-6 h-6 animate-spin text-[#0B6E4F]" />
        Loading Property Settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased pb-16">
      
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="transition-transform hover:scale-105">
              <Image
                src="/orvyn-logo.png"
                alt="Orvyn PMS Logo"
                width={180}
                height={55}
                className="h-12 w-auto object-contain"
              />
            </Link>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <PropertySwitcher
              onPropertyChange={(prop: PropertyItem) => loadPropertyData(prop.id)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Tabbed View */}
      <main className="max-w-5xl mx-auto px-6 pt-8 space-y-8 animate-fade-in-up">
        
        <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Property Settings & Configuration</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage room types, check-in times, invoice templates, and payment handles for <strong>{property?.name}</strong>.
            </p>
          </div>

          <Link
            href={`/onboarding/property?id=${propertyId}`}
            className="px-4 py-2.5 rounded-2xl bg-emerald-50 text-[#0B6E4F] border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Open Setup Wizard
          </Link>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
          {[
            { key: 'identity', label: '1. Identity', icon: Building2, step: 1 },
            { key: 'times', label: '2. Times & Terms', icon: Clock, step: 2 },
            { key: 'rooms', label: '3. Room Types', icon: BedDouble, step: 3 },
            { key: 'amenities', label: '4. Amenities', icon: Sparkles, step: 4 },
            { key: 'invoices', label: '5. Invoice Themes', icon: FileText, step: 5 },
            { key: 'bank', label: '6. Bank & Payment', icon: CreditCard, step: 6 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-[#0B6E4F] text-white shadow-md shadow-[#0B6E4F]/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Reused Modular Step Components */}
        {activeTab === 'identity' && (
          <Step1Identity
            data={step1Data}
            onChange={setStep1Data}
            onSave={() => saveStep(1)}
            saving={saving}
            isSettingsView
          />
        )}

        {activeTab === 'times' && (
          <Step2TimesTerms
            data={step2Data}
            onChange={setStep2Data}
            onSave={() => saveStep(2)}
            saving={saving}
            isSettingsView
          />
        )}

        {activeTab === 'rooms' && (
          <Step3Rooms
            roomTypes={roomTypes}
            onChange={setRoomTypes}
            onSave={() => saveStep(3)}
            saving={saving}
            isSettingsView
          />
        )}

        {activeTab === 'amenities' && (
          <Step4Amenities
            amenities={amenities}
            onChange={setAmenities}
            onSave={() => saveStep(4)}
            saving={saving}
            isSettingsView
          />
        )}

        {activeTab === 'invoices' && (
          <Step5InvoiceTheme
            selectedTemplateId={selectedTemplateId}
            invoiceTemplates={invoiceTemplates}
            identityData={step1Data}
            bankData={bankData}
            roomTypes={roomTypes}
            onChange={setSelectedTemplateId}
            onSave={() => saveStep(5)}
            saving={saving}
            isSettingsView
          />
        )}

        {activeTab === 'bank' && (
          <Step6BankDetails
            data={bankData}
            onChange={setBankData}
            onSave={() => saveStep(6)}
            saving={saving}
            isSettingsView
          />
        )}

      </main>
    </div>
  );
}
