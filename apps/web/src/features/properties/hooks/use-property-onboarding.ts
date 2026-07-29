'use client';

import { useState, useCallback } from 'react';
import { propertyService, PropertyItem, InvoiceTemplateItem } from '../services/property.service';
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
      const data = await propertyService.getOnboardingData(id);
      setProperty(data.property);
      setInvoiceTemplates(data.invoiceTemplates);
      setCurrentStep(data.property.onboardingStep || 1);

      setStep1Data({
        name: data.property.name || '',
        logoUrl: data.property.logoUrl || '',
        address: data.property.address || '',
        city: data.property.city || '',
        state: data.property.state || '',
        country: data.property.country || 'IN',
        currency: data.property.currency || 'INR',
        timezone: data.property.timezone || 'Asia/Kolkata',
      });

      if (data.property.settings) {
        setStep2Data({
          checkInTime: data.property.settings.checkInTime || '14:00',
          checkOutTime: data.property.settings.checkOutTime || '11:00',
          termsAndConditions: data.property.settings.termsAndConditions || '',
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

      if (data.property.roomTypes && data.property.roomTypes.length > 0) {
        setRoomTypes(
          data.property.roomTypes.map((rt) => ({
            id: rt.id,
            name: rt.name,
            totalUnits: Number(rt.totalUnits),
            basePrice: Number(rt.basePrice),
            maxOccupancy: Number(rt.maxOccupancy || 2),
          })),
        );
      }

      if (data.property.amenities && data.property.amenities.length > 0) {
        setAmenities(
          data.property.amenities.map((am) => ({
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

  // Save Step
  const saveStep = useCallback(
    async (stepNum: number, onSuccess?: () => void) => {
      if (!propertyId) return;

      setSaving(true);
      try {
        let payload: any = { step: stepNum };

        if (stepNum === 1) payload.step1 = step1Data;
        if (stepNum === 2) payload.step2 = step2Data;
        if (stepNum === 3) payload.step3 = { roomTypes };
        if (stepNum === 4) payload.step4 = { amenities };
        if (stepNum === 5) payload.step5 = { activeInvoiceTemplateId: selectedTemplateId };
        if (stepNum === 6)
          payload.step6 = {
            bankAccountDetails: {
              accountNumber: bankData.accountNumber,
              ifscCode: bankData.ifscCode,
              bankName: bankData.bankName,
              accountHolderName: bankData.accountHolderName,
            },
            upiId: bankData.upiId,
            qrCodeUrl: bankData.qrCodeUrl,
          };

        const res = await propertyService.saveOnboardingStep(propertyId, payload);
        toast.success(res.message, 'Saved Successfully');

        if (onSuccess) {
          onSuccess();
        }
      } catch (err: any) {
        toast.error(err?.message || `Failed to save step ${stepNum}`, 'Save Error');
      } finally {
        setSaving(false);
      }
    },
    [propertyId, step1Data, step2Data, roomTypes, amenities, selectedTemplateId, bankData, toast],
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
