'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { useCreateBookingMutation } from '@/features/bookings/api/use-bookings';
import { useTranslation } from '@/lib/i18n';
import { httpClient } from '@/lib/api/http-client';
import { calculateTac } from '@/lib/utils/financial-math';
import { CreateBookingPayload } from '@/features/bookings/types/booking.types';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ArrowRight,
  User,
  BedDouble,
  Calendar,
  CreditCard,
  Building2,
  ShieldCheck,
  RotateCcw,
  Tag,
  Send,
  CalendarDays,
  FileText,
} from 'lucide-react';
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

function NewBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const toast = useToast();
  useActivePropertyQuery();
  const activeProperty = usePropertyStore((s) => s.activeProperty);
  const createMutation = useCreateBookingMutation();

  const paramCheckIn = searchParams.get('checkInDate') || searchParams.get('checkIn') || searchParams.get('date');
  const paramCheckOut = searchParams.get('checkOutDate') || searchParams.get('checkOut');
  const paramRoomTypeId = searchParams.get('roomTypeId');
  const paramRoomUnitId = searchParams.get('roomUnitId') || searchParams.get('unitId');
  const paramUnitNumber = searchParams.get('unitNumber');

  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState<any>({
    adults: 1,
    children: 0,
    channel: 'WALK_IN',
    advancePaid: 0,
    facilityIds: [],
    nationality: 'US',
    guestNationality: 'US',
    ...(paramCheckIn && { checkInDate: paramCheckIn }),
    ...(paramCheckOut && { checkOutDate: paramCheckOut }),
    ...(paramRoomTypeId && { roomTypeId: paramRoomTypeId }),
    ...(paramRoomUnitId && { allocatedRoomUnitId: paramRoomUnitId, roomUnitId: paramRoomUnitId }),
    ...(paramUnitNumber && { unitNumber: paramUnitNumber }),
  });

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
    if (paramCheckIn || paramCheckOut || paramRoomTypeId) {
      setForm((prev: any) => ({
        ...prev,
        ...(paramCheckIn && { checkInDate: paramCheckIn }),
        ...(paramCheckOut && { checkOutDate: paramCheckOut }),
        ...(paramRoomTypeId && { roomTypeId: paramRoomTypeId }),
      }));
    }
  }, [paramCheckIn, paramCheckOut, paramRoomTypeId]);

  useEffect(() => {
    if (roomTypes.length > 0 && !form.roomTypeId) {
      const selected = paramRoomTypeId ? roomTypes.find((r) => r.id === paramRoomTypeId) : roomTypes[0];
      const target = selected || roomTypes[0];
      setForm((prev: any) => ({
        ...prev,
        roomTypeId: target.id,
      }));
    }
  }, [roomTypes, paramRoomTypeId]);

  // Live synchronization of form.baseAmount whenever roomTypeId, checkInDate, checkOutDate change
  useEffect(() => {
    if (!form.roomTypeId || !roomTypes.length) return;
    const selected = roomTypes.find((r) => r.id === form.roomTypeId);
    if (!selected) return;

    const checkIn = form.checkInDate ? new Date(form.checkInDate) : null;
    const checkOut = form.checkOutDate ? new Date(form.checkOutDate) : null;
    const nights = checkIn && checkOut && checkOut > checkIn
      ? Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (86400 * 1000)))
      : 1;

    const nightlyRate = Number(selected.basePrice || 0);
    const calculatedBaseAmount = nightlyRate * nights;

    setForm((prev: any) => ({
      ...prev,
      baseAmount: calculatedBaseAmount,
    }));
  }, [form.roomTypeId, form.checkInDate, form.checkOutDate, roomTypes]);

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

  const handleClear = () => {
    if (step === 1) {
      setForm((prev: any) => ({
        ...prev,
        guestName: '',
        guestPhone: '',
        guestEmail: '',
        idType: '',
        idNumber: '',
        address: '',
        notes: '',
      }));
      toast.info('Guest details cleared', 'Reset');
    } else {
      setForm((prev: any) => ({
        adults: 1,
        children: 0,
        channel: 'WALK_IN',
        advancePaid: 0,
        facilityIds: [],
        nationality: 'US',
        guestNationality: 'US',
      }));
      setStep(1);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!form.guestName || !form.guestName.trim()) {
        toast.error('Please enter primary guest full name', 'Validation Error');
        return;
      }
      if (!form.guestPhone || !form.guestPhone.trim() || form.guestPhone.trim().length < 7) {
        toast.error('Please enter a valid phone number (at least 7 digits)', 'Validation Error');
        return;
      }
      if (form.guestEmail?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guestEmail.trim())) {
        toast.error('Please enter a valid email address', 'Validation Error');
        return;
      }
    }
    if (step === 2) {
      if (!form.roomTypeId) {
        toast.error('Please select a room category', 'Validation Error');
        return;
      }
      if (!form.checkInDate) {
        toast.error('Please select check-in date', 'Validation Error');
        return;
      }
      if (!form.checkOutDate) {
        toast.error('Please select check-out date', 'Validation Error');
        return;
      }
      const cin = new Date(form.checkInDate);
      const cout = new Date(form.checkOutDate);
      if (cout <= cin) {
        toast.error('Check-out date must be strictly after check-in date', 'Validation Error');
        return;
      }
      if (form.channel === 'AGENCY' && !form.agencyId) {
        toast.error('Please select a Travel Agency for TAC bookings', 'Validation Error');
        return;
      }
    }
    if (step === 3) {
      if (!form.baseAmount || Number(form.baseAmount) <= 0) {
        toast.error('Base room amount must be greater than ₹0', 'Validation Error');
        return;
      }
      if (Number(form.advancePaid || 0) > Number(totalEstimate || 0)) {
        toast.error('Advance payment cannot exceed total estimated amount', 'Validation Error');
        return;
      }
    }
    setStep((prev) => Math.min(4, prev + 1));
  };

  const handleBack = () => setStep((prev) => Math.max(1, prev - 1));

  const handleSubmit = async () => {
    if (!activeProperty?.id) {
      toast.error('No active property selected');
      return;
    }

    try {
      const selectedRoom = roomTypes.find((r) => r.id === form.roomTypeId);
      const basePrice = selectedRoom?.basePrice || form.baseAmount || 0;
      const baseAmount = form.baseAmount || basePrice;

      const facilityTotal = (form.facilityIds || []).reduce((acc: number, id: string) => {
        const fac = amenities.find((a) => a.id === id);
        return acc + (fac?.price || 0);
      }, 0);

      const checkIn = new Date(form.checkInDate);
      const checkOut = new Date(form.checkOutDate);
      const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (86400 * 1000)));

      const totalAmount = baseAmount * nights + facilityTotal;

      const payload: CreateBookingPayload = {
        propertyId: activeProperty.id,
        roomTypeId: form.roomTypeId,
        roomUnitId: form.roomUnitId || undefined,
        guestName: form.guestName,
        guestEmail: form.guestEmail || undefined,
        guestPhone: form.guestPhone,
        checkInDate: form.checkInDate,
        checkOutDate: form.checkOutDate,
        adults: Number(form.adults) || 1,
        children: Number(form.children) || 0,
        channel: form.channel || 'WALK_IN',
        advancePaid: Number(form.advancePaid) || 0,
        notes: form.notes || undefined,
        guestNationality: form.guestNationality || form.nationality || 'US',
        agencyId: form.channel === 'AGENCY' ? form.agencyId : undefined,
        baseAmount,
        facilityIds: form.facilityIds || [],
      };

      await createMutation.mutateAsync(payload);
      setShowSuccess(true);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create reservation');
    }
  };

  const formatMoney = (val: any) => `₹${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const selectedRoomType = roomTypes.find((r) => r.id === form.roomTypeId);
  const checkIn = form.checkInDate ? new Date(form.checkInDate) : null;
  const checkOut = form.checkOutDate ? new Date(form.checkOutDate) : null;
  const nights = checkIn && checkOut && checkOut > checkIn
    ? Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (86400 * 1000)))
    : 1;

  const nightlyPrice = Number(selectedRoomType?.basePrice || 0);
  const autoCalculatedBaseAmount = nightlyPrice * nights;
  const baseAmount = Number(form.baseAmount ?? autoCalculatedBaseAmount ?? 0);

  const roomSubtotal = baseAmount;
  const facilityTotal = (form.facilityIds || []).reduce((acc: number, id: string) => {
    const fac = amenities.find((a) => a.id === id);
    return acc + Number(fac?.price || 0);
  }, 0);

  const totalEstimate = roomSubtotal + facilityTotal;
  const advancePaid = Number(form.advancePaid) || 0;
  const balanceDue = Math.max(0, totalEstimate - advancePaid);

  if (showSuccess) {
    return (
      <AppShell
        sectionIcon={Calendar}
        breadcrumb={{ parent: t('bookingManagement') || 'Booking Management', parentHref: '/bookings' }}
        sectionTitle={t('newBooking') || 'New Reservation'}
        sectionDescription="Create a new reservation for your guest"
      >
        <div className="flex flex-col items-center justify-center p-6 min-h-[60vh]">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Booking Confirmed!</h2>
            <p className="text-xs text-slate-500">
              Reservation for <span className="font-semibold text-slate-700 dark:text-slate-300">{form.guestName}</span> has been created.
            </p>
            <div className="pt-4 flex gap-3">
              <button
                onClick={() => router.push('/bookings')}
                className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
              >
                Go to Reservations Feed
              </button>
              <button
                onClick={() => {
                  setShowSuccess(false);
                  setStep(1);
                  setForm({
                    adults: 1,
                    children: 0,
                    channel: 'WALK_IN',
                    advancePaid: 0,
                    facilityIds: [],
                    nationality: 'US',
                    guestNationality: 'US',
                  });
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 transition-all cursor-pointer"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      sectionIcon={Calendar}
      breadcrumb={{ parent: t('bookingManagement') || 'Booking Management', parentHref: '/bookings' }}
      sectionTitle={t('newBooking') || 'New Reservation'}
      sectionDescription="Create a new reservation for your guest"
      sectionActions={
        <button
          onClick={() => router.push('/bookings')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Bookings</span>
        </button>
      }
      layout="full"
    >
      <div className="space-y-6 w-full">
        {/* ══════════════════════════════════════════════════════════════════
           1. STEPPER HEADER (Exact Match with Reference)
           ══════════════════════════════════════════════════════════════════ */}
        <BookingStepperHeader step={step} setStep={(s: number) => setStep(s)} />

        {/* ══════════════════════════════════════════════════════════════════
           2. MAIN WORKSPACE GRID: Form (8 cols) + Sticky Summary (4 cols)
           ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Form Container (Left) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs">
            {step === 1 && <StepGuestDetails form={form} onChange={handleChange} />}
            {step === 2 && <StepRoomDates form={form} roomTypes={roomTypes} agencies={agencies} onChange={handleChange} />}
            {step === 3 && (
              <StepPricingFacilities
                form={form}
                amenities={amenities}
                agencies={agencies}
                onChange={handleChange}
                toggleFacility={toggleFacility}
              />
            )}
            {step === 4 && (
              <StepReviewConfirm
                form={form}
                selectedRoom={selectedRoomType}
                agencies={agencies}
                baseAmount={baseAmount}
                facilityTotal={facilityTotal}
                advancePaid={advancePaid}
                totalEstimate={totalEstimate}
                balanceDue={balanceDue}
                onEditStep={(s: number) => setStep(s)}
              />
            )}

            {/* Bottom Actions inside Card */}
            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              {step === 1 ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Clear</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-98"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="px-6 py-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50 active:scale-98"
                >
                  {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Confirm Reservation</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Sticky Reservation Summary */}
          <div className="lg:col-span-4 sticky top-6 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-4">
              {/* Summary Header */}
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <FileText className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold">Reservation Summary</h3>
              </div>

              {/* Key Values */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Guest</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {form.guestName?.trim() ? form.guestName : 'Not entered'}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Dates</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {form.checkInDate && form.checkOutDate
                      ? `${form.checkInDate} → ${form.checkOutDate}`
                      : 'Dates pending'}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Category</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedRoomType?.name || 'Not selected'}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Room</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {form.unitNumber ? `Room ${form.unitNumber}` : 'Not selected'}
                  </span>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Room Rate (1 Night)</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatMoney(nightlyPrice)}</span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Total Estimate</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatMoney(totalEstimate)}</span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Advance Payment</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatMoney(advancePaid)}</span>
                </div>

                <div className="flex justify-between text-amber-700 dark:text-amber-400 font-bold pt-1">
                  <span>Balance Due</span>
                  <span className="font-black">{formatMoney(balanceDue)}</span>
                </div>
              </div>

              {/* Payment Note Box */}
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-emerald-800 dark:text-emerald-400">
                  <span>PAYMENT NOTE</span>
                </div>
                <div className="flex items-start gap-2 pt-0.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px]">
                    Advance payments are logged automatically into the property&apos;s append-only ledger upon confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
           3. WHAT'S NEXT? GUIDANCE BAR (Matching Reference)
           ══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-3 pt-2">
          <div>
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-400">What&apos;s Next?</h4>
            <p className="text-[11px] text-slate-400 font-medium">After adding guest details, you can:</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Select Room & Dates</h5>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Choose room, check-in & check-out dates</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Set Pricing & Add-ons</h5>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Review rates, taxes and additional services</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Confirm Reservation</h5>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Review all details before confirming the booking</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Send className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Send Confirmation</h5>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Confirmation will be sent to the guest</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading reservation wizard...</div>}>
      <NewBookingContent />
    </Suspense>
  );
}
