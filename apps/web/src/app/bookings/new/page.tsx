'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { useCreateBookingMutation } from '@/features/bookings/api/use-bookings';
import { useTranslation } from '@/lib/i18n';
import { httpClient } from '@/lib/api/http-client';
import { CreateBookingPayload } from '@/features/bookings/types/booking.types';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ChevronLeft,
  User,
  BedDouble,
  Calendar,
  CreditCard,
  Building2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import {
  BookingStepperHeader,
  StepGuestDetails,
  StepRoomDates,
  StepPricingFacilities,
  StepReviewConfirm,
  RoomType,
  Amenity,
  Agency,
} from '@/features/bookings/components/new-booking';

export default function NewBookingPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useToast();
  useActivePropertyQuery();
  const activeProperty = usePropertyStore((s) => s.activeProperty);
  const createMutation = useCreateBookingMutation();

  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState<any>({
    adults: 1,
    children: 0,
    channel: 'WALK_IN',
    advancePaid: 0,
    facilityIds: [],
    nationality: 'IN',
  });

  // Valid UUIDs for default fallback room categories
  const DEFAULT_ROOM_TYPES: RoomType[] = [
    { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Deluxe Room', basePrice: 2500, maxOccupancy: 2, totalUnits: 10 },
    { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Executive Suite', basePrice: 4500, maxOccupancy: 4, totalUnits: 5 },
    { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Standard Room', basePrice: 1800, maxOccupancy: 2, totalUnits: 12 },
  ];

  const { data: propertyData } = useQuery({
    queryKey: ['property-booking-data', activeProperty?.id],
    queryFn: async () => {
      if (!activeProperty?.id) return null;
      try {
        const res = await httpClient.get<any>(`/properties/${activeProperty.id}/onboarding`);
        return res?.data || res;
      } catch (e) {
        console.warn('Onboarding data fetch fallback:', e);
        return null;
      }
    },
    enabled: !!activeProperty?.id,
    staleTime: 30000,
  });

  const roomTypes: RoomType[] = propertyData?.property?.roomTypes || propertyData?.roomTypes || activeProperty?.roomTypes || [];
  const amenities: Amenity[] = propertyData?.amenities || propertyData?.property?.amenities || [];

  const { data: agencyData } = useQuery({
    queryKey: ['agencies-list', activeProperty?.id],
    queryFn: async () => {
      if (!activeProperty?.id) return [];
      try {
        const res = await httpClient.get<any>(`/properties/${activeProperty.id}/agencies`);
        return res?.data?.agencies || res?.agencies || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!activeProperty?.id,
    staleTime: 30000,
  });
  const agencies: Agency[] = agencyData || [];

  useEffect(() => {
    if (roomTypes.length > 0 && !form.roomTypeId) {
      const first = roomTypes[0];
      setForm((prev: any) => ({
        ...prev,
        roomTypeId: first.id,
        baseAmount: prev.baseAmount ?? first.basePrice,
      }));
    }
  }, [roomTypes]);

  const handleChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const toggleFacility = (facilityId: string) => {
    setForm((prev: any) => {
      const current = prev.facilityIds || [];
      const updated = current.includes(facilityId)
        ? current.filter((id: string) => id !== facilityId)
        : [...current, facilityId];
      return { ...prev, facilityIds: updated };
    });
  };

  const selectedRoom = roomTypes.find((r) => r.id === form.roomTypeId) || roomTypes[0];

  const selectedFacilities = (form.facilityIds || [])
    .map((fid: string) => amenities.find((a) => a.id === fid))
    .filter(Boolean) as Amenity[];
  const facilityTotal = selectedFacilities.reduce((sum, f) => sum + (f.price || 0), 0);

  const baseAmount = Number(form.baseAmount ?? selectedRoom?.basePrice ?? 0);
  const advancePaid = Number(form.advancePaid || 0);
  const totalEstimate = baseAmount + facilityTotal;
  const balanceDue = Math.max(0, totalEstimate - advancePaid);

  // Per-Step Real-Time Input Validation
  const validateStep = (s: number): boolean => {
    if (s === 1) {
      if (!form.guestName || form.guestName.trim().length < 2) {
        toast.error('Guest name is required (minimum 2 characters).', 'Validation Failed');
        return false;
      }
      const phone = (form.phone || form.guestPhone || '').trim();
      if (phone && phone.length < 7) {
        toast.error('Please enter a valid phone number (minimum 7 digits).', 'Invalid Phone');
        return false;
      }
      return true;
    }
    if (s === 2) {
      if (!form.checkInDate || !form.checkOutDate) {
        toast.error('Please select both Check-In and Check-Out dates.', 'Missing Dates');
        return false;
      }
      if (new Date(form.checkOutDate) <= new Date(form.checkInDate)) {
        toast.error('Check-Out date must be after Check-In date.', 'Invalid Date Range');
        return false;
      }
      if (!form.roomTypeId || roomTypes.length === 0) {
        toast.error('No valid room category available. Please add room categories under Rooms & Units first.', 'Room Category Required');
        return false;
      }
      return true;
    }
    if (s === 3) {
      if (advancePaid > totalEstimate) {
        toast.error('Advance payment cannot exceed the total stay price.', 'Invalid Advance');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = () => {
    if (!activeProperty?.id) {
      toast.error('No active property context found.', 'Error');
      return;
    }
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    // Sanitize values to prevent DTO class-validator errors
    const rawPhone = (form.phone || form.guestPhone || '').trim();
    const guestPhone = rawPhone.length > 0 ? rawPhone : undefined;

    const rawEmail = (form.email || form.guestEmail || '').trim();
    const guestEmail = rawEmail.includes('@') ? rawEmail : undefined;

    const rawNationality = (form.nationality || form.guestNationality || '').trim().toUpperCase();
    const guestNationality = rawNationality.length === 2 ? rawNationality : 'IN';

    // Ensure roomUnitId is a valid UUID if passed
    const isUuid = (val?: string) => val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const roomUnitId = isUuid(form.roomUnitId) ? form.roomUnitId : undefined;

    const payload: CreateBookingPayload = {
      guestName: form.guestName.trim(),
      guestPhone,
      guestEmail,
      guestNationality,
      checkInDate: form.checkInDate,
      checkOutDate: form.checkOutDate,
      roomTypeId: form.roomTypeId,
      roomUnitId,
      adults: Number(form.adults) || 1,
      children: Number(form.children) || 0,
      mealPlan: form.mealPlan || 'NONE',
      channel: form.channel || 'WALK_IN',
      agencyId: form.channel === 'AGENCY' && isUuid(form.agencyId) ? form.agencyId : undefined,
      baseAmount: baseAmount,
      advancePaid: advancePaid,
      facilityIds: form.facilityIds,
      notes: form.notes,
      propertyId: activeProperty.id,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        setShowSuccess(true);
        setTimeout(() => router.push('/bookings'), 1500);
      },
    });
  };

  // Success overlay
  if (showSuccess) {
    return (
      <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 font-sans antialiased">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg text-white">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {t('bookingCreatedSuccess') || 'Booking Created Successfully!'}
            </h2>
            <p className="text-xs text-slate-500 font-semibold">Redirecting to bookings list...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative">
      {/* Left Navigation Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <AppHeader
          actions={
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Step {step} of 4</span>
              <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>
          }
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t('newBooking')}
              </h1>
              <p className="text-xs font-medium text-neutral-500 dark:text-slate-400 mt-0.5 truncate">
                {activeProperty?.name || t('activeManagementHub')}
              </p>
            </div>
          </div>
        </AppHeader>

        {/* 2-Column Responsive Layout */}
        <main className="w-full px-6 py-6 flex-1 max-w-[1400px]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column (2/3): Booking Stepper & Wizard Form */}
            <div className="lg:col-span-2 space-y-6">
              <BookingStepperHeader step={step} setStep={setStep} />

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
                {/* Step Content */}
                <div>
                  {step === 1 && <StepGuestDetails form={form} onChange={handleChange} />}
                  {step === 2 && (
                    <StepRoomDates
                      form={form}
                      roomTypes={roomTypes}
                      agencies={agencies}
                      onChange={handleChange}
                    />
                  )}
                  {step === 3 && (
                    <StepPricingFacilities
                      form={form}
                      amenities={amenities}
                      selectedRoom={selectedRoom}
                      onChange={handleChange}
                      toggleFacility={toggleFacility}
                    />
                  )}
                  {step === 4 && (
                    <StepReviewConfirm
                      form={form}
                      selectedRoom={selectedRoom}
                      baseAmount={baseAmount}
                      facilityTotal={facilityTotal}
                      advancePaid={advancePaid}
                      totalEstimate={totalEstimate}
                      balanceDue={balanceDue}
                      onEditStep={setStep}
                    />
                  )}
                </div>

                {/* ═══ Navigation Buttons ═══ */}
                <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {t('back')}
                    </button>
                  ) : <div />}

                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                    >
                      {t('next')}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={createMutation.isPending}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>{createMutation.isPending ? t('creating') : t('confirmBooking')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (1/3): Live Booking Summary & Cost Estimator Card */}
            <div className="lg:col-span-1 space-y-4 sticky top-20">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Live Booking Summary
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                    {form.channel || 'WALK_IN'}
                  </span>
                </div>

                {/* Guest Profile Chip */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-400 font-semibold text-[11px]">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Guest Profile</span>
                  </div>
                  <p className="font-extrabold text-slate-900 dark:text-white truncate">
                    {form.guestName || 'Guest Name Not Entered'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {form.phone ? `Phone: ${form.phone}` : 'No phone number'}
                  </p>
                </div>

                {/* Room Category & Stay Dates */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400 font-semibold text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Category</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedRoom?.name || 'Deluxe Room'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 font-semibold text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Dates</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                      {form.checkInDate && form.checkOutDate
                        ? `${form.checkInDate} → ${form.checkOutDate}`
                        : 'Select dates'}
                    </span>
                  </div>
                </div>

                {/* Live Financial Estimator */}
                <div className="space-y-2.5 pt-1 text-xs">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 font-medium">
                    <span>Base Room Charge</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{baseAmount.toFixed(2)}</span>
                  </div>
                  {facilityTotal > 0 && (
                    <div className="flex justify-between text-slate-500 dark:text-slate-400 font-medium">
                      <span>Add-on Facilities</span>
                      <span className="font-bold text-slate-900 dark:text-white">₹{facilityTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Total Stay Estimate</span>
                    <span>₹{totalEstimate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Advance Payment</span>
                    <span>₹{advancePaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 font-extrabold text-sm pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                    <span>Balance Due</span>
                    <span>₹{balanceDue.toFixed(2)}</span>
                  </div>
                </div>

                {/* Staff Hint Box */}
                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <p className="leading-relaxed">
                    Advance payments are logged atomically into the property's append-only ledger upon confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
