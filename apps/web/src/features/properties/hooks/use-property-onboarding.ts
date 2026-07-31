'use client';

import { useState, useCallback } from 'react';
import { propertyService, PropertyItem, InvoiceTemplateItem } from '../services/property.service';
import { getQueryClient } from '@/lib/react-query';
import { propertyKeys } from '../api/property-keys';
import { useToast } from '@/components/ui/toast';
import {
  Step1IdentityData,
  Step2TimesData,
  RoomTypeItem,
  AmenityItem,
  Step6BankData,
} from '../types/property-onboarding.types';

export function usePropertyOnboarding() {
  const toast = useToast();

  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [property, setProperty] = useState<PropertyItem | null>(null);
  const [invoiceTemplates, setInvoiceTemplates] = useState<InvoiceTemplateItem[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Form States
  const [step1Data, setStep1Data] = useState<Step1IdentityData>({
    name: '',
    logoUrl: '',
    address: '',
    city: '',
    state: '',
    country: 'IN',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  });

  const [step2Data, setStep2Data] = useState<Step2TimesData>({
    checkInTime: '14:00',
    checkOutTime: '11:00',
    termsAndConditions: 'Standard guest check-in rules apply.',
  });

  const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>([
    { name: 'Deluxe Suite', totalUnits: 5, basePrice: 3500, maxOccupancy: 2 },
    { name: 'Executive Villa', totalUnits: 2, basePrice: 7500, maxOccupancy: 4 },
  ]);

  const [amenities, setAmenities] = useState<AmenityItem[]>([
    { name: 'BBQ Setup & Grill', price: 800, icon: 'flame' },
    { name: 'Evening Campfire', price: 500, icon: 'sparkles' },
    { name: 'Buffet Breakfast', price: 350, icon: 'coffee' },
  ]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const [bankData, setBankData] = useState<Step6BankData>({
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    accountHolderName: '',
    upiId: '',
    qrCodeUrl: '',
  });

  // Load Data
  const loadPropertyData = useCallback(async (id: string) => {
    setLoading(true);
    try {
      setPropertyId(id);
      const raw = await propertyService.getOnboardingData(id);
      const data = (raw as any)?.data || raw;
      const propObj = data?.property || (data as any)?.data?.property;

      if (!propObj) {
        console.warn('Property object is undefined for ID:', id, data);
        return;
      }

      setProperty(propObj);
      setInvoiceTemplates(data.invoiceTemplates ?? (data as any)?.invoiceTemplates ?? []);
      setCurrentStep(propObj.onboardingStep || 1);

      setStep1Data({
        name: propObj.name || '',
        logoUrl: propObj.logoUrl || '',
        address: propObj.address || '',
        city: propObj.city || '',
        state: propObj.state || '',
        country: propObj.country || 'IN',
        currency: propObj.currency || 'INR',
        timezone: propObj.timezone || 'Asia/Kolkata',
      });

      if (propObj.settings) {
        setStep2Data({
          checkInTime: propObj.settings.checkInTime || '14:00',
          checkOutTime: propObj.settings.checkOutTime || '11:00',
          termsAndConditions: propObj.settings.termsAndConditions || '',
        });

        setSelectedTemplateId(
          data.property.settings.activeInvoiceTemplateId ||
            data.invoiceTemplates[0]?.id ||
            '',
        );

        const bDetails = data.property.settings.bankAccountDetails || {};
        setBankData({
          accountNumber: bDetails.accountNumber || '',
          ifscCode: bDetails.ifscCode || '',
          bankName: bDetails.bankName || '',
          accountHolderName: bDetails.accountHolderName || '',
          upiId: data.property.settings.upiId || '',
          qrCodeUrl: data.property.settings.qrCodeUrl || '',
        });
      }

      if (propObj.roomTypes && propObj.roomTypes.length > 0) {
        setRoomTypes(
          propObj.roomTypes.map((rt: any) => ({
            id: rt.id,
            name: rt.name,
            totalUnits: Number(rt.totalUnits),
            basePrice: Number(rt.basePrice),
            maxOccupancy: Number(rt.maxOccupancy || 2),
          })),
        );
      }

      if (propObj.amenities && propObj.amenities.length > 0) {
        setAmenities(
          propObj.amenities.map((am: any) => ({
            id: am.id,
            name: am.name,
            price: Number(am.price),
            icon: am.icon || 'star',
          })),
        );
      }
    } catch (err) {
      console.error('Error loading onboarding data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Keep a mutable ref of form state to prevent saveStep callback reference invalidation on every keystroke
  const formDataRef = useState({
    step1Data,
    step2Data,
    roomTypes,
    amenities,
    selectedTemplateId,
    bankData,
  })[0];
  formDataRef.step1Data = step1Data;
  formDataRef.step2Data = step2Data;
  formDataRef.roomTypes = roomTypes;
  formDataRef.amenities = amenities;
  formDataRef.selectedTemplateId = selectedTemplateId;
  formDataRef.bankData = bankData;

  // Save Step (Stable Callback across keystrokes)
  const saveStep = useCallback(
    async (stepNum: number, onSuccess?: () => void) => {
      if (!propertyId) return;

      setSaving(true);
      try {
        if (onSuccess && stepNum !== 6) {
          // Optimistic instant UI transition for all steps except the final one!
          onSuccess();
        }

        const currentData = formDataRef;
        let payload: any = { step: stepNum };

        if (stepNum === 1) payload.step1 = currentData.step1Data;
        if (stepNum === 2) payload.step2 = currentData.step2Data;
        if (stepNum === 3) payload.step3 = { roomTypes: currentData.roomTypes };
        if (stepNum === 4) payload.step4 = { amenities: currentData.amenities };
        if (stepNum === 5) payload.step5 = { activeInvoiceTemplateId: currentData.selectedTemplateId };
        if (stepNum === 6)
          payload.step6 = {
            bankAccountDetails: {
              accountNumber: currentData.bankData.accountNumber,
              ifscCode: currentData.bankData.ifscCode,
              bankName: currentData.bankData.bankName,
              accountHolderName: currentData.bankData.accountHolderName,
            },
            upiId: currentData.bankData.upiId,
            qrCodeUrl: currentData.bankData.qrCodeUrl,
          };

        const res = await propertyService.saveOnboardingStep(propertyId, payload);
        toast.success(res.message, `Step ${stepNum} Saved`);

        const propResult = (res as any)?.property || (res as any)?.data?.property;
        if (propResult) {
          setProperty(propResult);
        }

        // Invalidate global property queries so switcher and portfolio hub update 0ms instantly!
        const queryClient = getQueryClient();
        queryClient.invalidateQueries({ queryKey: propertyKeys.all });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });

        if (onSuccess && stepNum === 6) {
          onSuccess();
        }
      } catch (err: any) {
        toast.error(err?.message || `Failed to save step ${stepNum}`, 'Save Error');
      } finally {
        setSaving(false);
      }
    },
    [propertyId, toast],
  );

  return {
    propertyId,
    property,
    invoiceTemplates,
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
    loadPropertyData,
    saveStep,
  };
}
