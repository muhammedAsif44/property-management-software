'use client';

import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  propertyService,
  usePropertyOnboarding,
  Step1Identity,
  Step2TimesTerms,
  Step3Rooms,
  Step4Amenities,
  Step5InvoiceTheme,
  Step6BankDetails,
} from '@/features/properties';
import {
  Building2,
  Clock,
  BedDouble,
  Sparkles,
  FileText,
  CreditCard,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

function OnboardingWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    propertyId,
    currentStep,
    setCurrentStep,
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
    const init = async () => {
      let id = searchParams.get('id');
      if (!id) {
        const active = await propertyService.getActiveProperty();
        if (active.activeProperty) {
          id = active.activeProperty.id;
        } else {
          const created = await propertyService.createProperty({ name: 'My Luxury Hotel', city: 'Goa' });
          id = created.property.id;
        }
      }
      if (id) {
        loadPropertyData(id);
      }
    };
    init();
  }, [searchParams, loadPropertyData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm flex-col gap-3 font-sans">
        <RefreshCw className="w-6 h-6 animate-spin text-[#0B6E4F]" />
        Loading Property Onboarding Wizard...
      </div>
    );
  }

  const stepsList = [
    { num: 1, label: 'Identity', icon: Building2 },
    { num: 2, label: 'Times & Terms', icon: Clock },
    { num: 3, label: 'Room Setup', icon: BedDouble },
    { num: 4, label: 'Amenities', icon: Sparkles },
    { num: 5, label: 'Invoice Theme', icon: FileText },
    { num: 6, label: 'Bank Details', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased pb-16">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="transition-transform hover:scale-105">
              <Image
                src="/orvyn-logo.png"
                alt="Orvyn PMS Logo"
                width={160}
                height={48}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0B6E4F] hidden sm:block">
              Property Setup Wizard
            </span>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            Save & Exit to Dashboard
          </button>
        </div>
      </header>

      {/* Stepper Navigation */}
      <div className="max-w-5xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-6 gap-2 sm:gap-4 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm">
          {stepsList.map((st) => {
            const Icon = st.icon;
            const isDone = st.num < currentStep;
            const isCurrent = st.num === currentStep;

            return (
              <button
                key={st.num}
                onClick={() => setCurrentStep(st.num)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all ${
                  isCurrent
                    ? 'bg-[#0B6E4F] text-white shadow-md shadow-[#0B6E4F]/20 font-bold'
                    : isDone
                    ? 'bg-emerald-50 text-[#0B6E4F] hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-[10px] font-bold truncate hidden sm:inline">{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Active Step View */}
      <main className="max-w-4xl mx-auto px-6 pt-8 animate-fade-in-up">
        {currentStep === 1 && (
          <Step1Identity
            data={step1Data}
            onChange={setStep1Data}
            onSave={() => saveStep(1, () => setCurrentStep(2))}
            saving={saving}
          />
        )}

        {currentStep === 2 && (
          <Step2TimesTerms
            data={step2Data}
            onChange={setStep2Data}
            onSave={() => saveStep(2, () => setCurrentStep(3))}
            onBack={() => setCurrentStep(1)}
            saving={saving}
          />
        )}

        {currentStep === 3 && (
          <Step3Rooms
            roomTypes={roomTypes}
            onChange={setRoomTypes}
            onSave={() => saveStep(3, () => setCurrentStep(4))}
            onBack={() => setCurrentStep(2)}
            saving={saving}
          />
        )}

        {currentStep === 4 && (
          <Step4Amenities
            amenities={amenities}
            onChange={setAmenities}
            onSave={() => saveStep(4, () => setCurrentStep(5))}
            onBack={() => setCurrentStep(3)}
            saving={saving}
          />
        )}

        {currentStep === 5 && (
          <Step5InvoiceTheme
            selectedTemplateId={selectedTemplateId}
            invoiceTemplates={invoiceTemplates}
            identityData={step1Data}
            bankData={bankData}
            roomTypes={roomTypes}
            onChange={setSelectedTemplateId}
            onSave={() => saveStep(5, () => setCurrentStep(6))}
            onBack={() => setCurrentStep(4)}
            saving={saving}
          />
        )}

        {currentStep === 6 && (
          <Step6BankDetails
            data={bankData}
            onChange={setBankData}
            onSave={() => saveStep(6, () => router.push('/dashboard'))}
            onBack={() => setCurrentStep(5)}
            saving={saving}
          />
        )}
      </main>
    </div>
  );
}

export default function PropertyOnboardingWizardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading Wizard...</div>}>
      <OnboardingWizardContent />
    </Suspense>
  );
}
