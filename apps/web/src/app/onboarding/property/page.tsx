'use client';

import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
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
  Star,
  FileText,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';

import { useTranslation, LanguageSwitcher } from '@/lib/i18n';

function OnboardingWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

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

  const toast = useToast();
  const hasToastedRef = React.useRef(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { authService } = await import('@/features/auth');
        const profile = await authService.getProfile();
        const userObj = profile?.user || profile?.data?.user || profile;
        const role = userObj?.role || '';
        if (role !== 'OWNER' && role !== 'SUPER_ADMIN') {
          if (!hasToastedRef.current) {
            hasToastedRef.current = true;
            toast.info(
              'Access Restricted: Property onboarding & settings are reserved for Property Owners.',
              'Restricted Access',
            );
          }
          router.push('/dashboard');
          return;
        }

        let id = searchParams.get('id');
        const isNewParam = searchParams.get('new') === 'true';

        if (isNewParam) {
          const created = await propertyService.createProperty({ name: 'New Property Branch', city: '' });
          id = created.property.id;
          router.replace(`/onboarding/property?id=${id}`);
        } else if (!id) {
          const active = await propertyService.getActiveProperty();
          if (active?.activeProperty) {
            id = active.activeProperty.id;
          } else {
            const myProps = await propertyService.getMyProperties();
            if (myProps.properties && myProps.properties.length > 0) {
              id = myProps.properties[0].id;
            } else {
              const created = await propertyService.createProperty({ name: 'My Hotel', city: 'Goa' });
              id = created.property.id;
            }
          }
        }
        if (id) {
          loadPropertyData(id);
        }
      } catch (err: any) {
        if (err?.status === 403 || err?.statusCode === 403) {
          if (!hasToastedRef.current) {
            hasToastedRef.current = true;
            toast.info(
              'Access Restricted: Property onboarding & settings are reserved for Property Owners.',
              'Restricted Access',
            );
          }
          router.push('/dashboard');
        }
      }
    };
    init();
  }, [searchParams, loadPropertyData, router, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 text-sm flex-col gap-3 font-sans">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
        <p className="font-medium text-gray-600">Loading Property Setup Wizard...</p>
      </div>
    );
  }

  const stepsList = [
    { num: 1, label: t('step1Identity'), icon: Building2 },
    { num: 2, label: t('step2TimesTerms'), icon: Clock },
    { num: 3, label: t('step3Rooms'), icon: BedDouble },
    { num: 4, label: t('step4Amenities'), icon: Star },
    { num: 5, label: t('step5InvoiceTheme'), icon: FileText },
    { num: 6, label: t('step6BankDetails'), icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-xs">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="transition-transform hover:scale-105">
              <Image
                src="/orvyn-logo.png"
                alt="Orvyn PMS Logo"
                width={140}
                height={40}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <div className="h-5 w-px bg-gray-200 hidden sm:block" />
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hidden sm:inline-flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              {t('propertySetupWizard')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => router.push('/dashboard')}
              className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('dashboard')}
            </button>
          </div>
        </div>
      </header>

      {/* Stepper Container */}
      <div className="max-w-4xl mx-auto px-6 pt-8 space-y-6">
        {/* Progress & Stepper Bar */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-gray-600">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('stepOf')} {currentStep} / 6 — {Math.round((currentStep / 6) * 100)}% {t('completed')}
            </span>
            {saving && (
              <span className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                {t('savingStep')}
              </span>
            )}
          </div>

          {/* Connected Stepper */}
          <div className="flex items-center justify-between overflow-x-auto py-1 gap-1">
            {stepsList.map((st, i) => {
              const Icon = st.icon;
              const isDone = st.num < currentStep;
              const isCurrent = st.num === currentStep;

              return (
                <React.Fragment key={st.num}>
                  <button
                    onClick={() => !saving && (isDone || isCurrent) && setCurrentStep(st.num)}
                    disabled={saving}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      isCurrent
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 ring-2 ring-emerald-500/20'
                        : isDone
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    } disabled:opacity-50`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Icon className="w-4 h-4" />}
                    <span className="hidden sm:inline min-w-0 truncate">{st.label}</span>
                  </button>
                  {i < stepsList.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 min-w-[12px] mx-1 transition-all ${
                        st.num < currentStep ? 'bg-emerald-300' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Active Step Content */}
        <main className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6 relative">
          {saving && (
            <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden rounded-t-2xl">
              <div className="h-full bg-emerald-500 w-full animate-[progress_1s_ease-in-out_infinite] origin-left" />
            </div>
          )}

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
              onSave={() =>
                saveStep(6, () => {
                  toast.success('🎉 Property onboarding complete! Portfolio active.', 'Setup Complete');
                  router.push('/properties');
                })
              }
              onBack={() => setCurrentStep(5)}
              saving={saving}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function PropertyOnboardingWizardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500 text-sm">Loading Wizard...</div>}>
      <OnboardingWizardContent />
    </Suspense>
  );
}
