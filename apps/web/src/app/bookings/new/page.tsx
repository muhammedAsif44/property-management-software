'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
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

  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState<any>({
    adults: 1,
    children: 0,
    channel: 'WALK_IN',
    advancePaid: 0,
    facilityIds: [],
    nationality: 'IN',
    ...(paramCheckIn && { checkInDate: paramCheckIn }),
    ...(paramCheckOut && { checkOutDate: paramCheckOut }),
    ...(paramRoomTypeId && { roomTypeId: paramRoomTypeId }),
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

  // Live synchronization of form.baseAmount whenever roomTypeId, checkInDate, checkOutDate or roomTypes change
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

      const totalAmount = (baseAmount * nights) + facilityTotal;

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
        guestNationality: form.nationality || 'IN',
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

  const formatMoney = (val: any) => (Number(val) || 0).toFixed(2);

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
      <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex bg-slate-50/70 dark:bg-slate-950">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Reservation Confirmed!</h2>
            <p className="text-xs text-slate-500 font-medium">
              Booking for <strong className="text-slate-800 dark:text-slate-200">{form.guestName}</strong> from{' '}
              {form.checkInDate} to {form.checkOutDate} has been created.
            </p>
            <div className="pt-4 flex gap-3">
              <button
                onClick={() => router.push('/bookings/room-calendar')}
                className="flex-1 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs transition-all cursor-pointer shadow-md"
              >
                Go to Room Calendar
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
                    nationality: 'IN',
                  });
                }}
                className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 transition-all cursor-pointer"
              >
                New Booking
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased flex relative overflow-hidden bg-slate-50/70 dark:bg-slate-950">
      <DashboardSidebar />

      <div className="flex-1 min-w-0 transition-all duration-300 relative z-10 flex flex-col min-h-screen overflow-y-auto">
        <AppHeader>
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/bookings/room-calendar')}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer shrink-0"
              title={t('backToBookings')}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 bg-slate-50/90 dark:bg-slate-850 px-4 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-800 shadow-2xs min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate">
                  {activeProperty?.name || 'Azura Resorts & Spa'}
                </h1>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 leading-tight truncate">
                  Create Reservation
                </span>
              </div>
            </div>
          </div>
        </AppHeader>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full space-y-6 pb-20">
          <BookingStepperHeader step={step} setStep={(s: number) => setStep(s)} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
              {step === 1 && <StepGuestDetails form={form} onChange={handleChange} />}
              {step === 2 && <StepRoomDates form={form} roomTypes={roomTypes} agencies={agencies} onChange={handleChange} />}
              {step === 3 && <StepPricingFacilities form={form} amenities={amenities} agencies={agencies} onChange={handleChange} toggleFacility={toggleFacility} />}
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

              {/* Sticky Bottom Actions Bar */}
              <div className="sticky bottom-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pt-4 pb-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 mt-6">
                {step > 1 ? (
                  <button
                    onClick={handleBack}
                    className="px-5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-200 transition-all cursor-pointer shadow-2xs"
                  >
                    Back
                  </button>
                ) : <div />}

                {step < 4 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs transition-all cursor-pointer shadow-md shadow-emerald-900/20 flex items-center gap-2"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending}
                    className="px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs transition-all cursor-pointer shadow-md shadow-emerald-900/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Confirm Booking
                  </button>
                )}
              </div>
            </div>

            {/* Right Summary Sidebar */}
            <div className="lg:col-span-4 sticky top-20 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Reservation Summary</h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                    <span>Guest</span>
                    <span className="font-bold text-slate-900 dark:text-white">{form.guestName || 'Not entered'}</span>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                    <span>Dates</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {form.checkInDate ? `${form.checkInDate} (${nights}n)` : 'Dates pending'}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                    <span>Category</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedRoomType?.name || 'Pending selection'}</span>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                    <span>Room Rate ({nights}n)</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{formatMoney(baseAmount)}</span>
                  </div>

                  {facilityTotal > 0 && (
                    <div className="flex justify-between text-slate-500 dark:text-slate-400 font-medium">
                      <span>Add-on Facilities</span>
                      <span className="font-bold text-slate-900 dark:text-white">₹{formatMoney(facilityTotal)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Total Estimate</span>
                    <span>₹{formatMoney(totalEstimate)}</span>
                  </div>

                  {form.channel === 'AGENCY' && form.agencyId && (() => {
                    const agency = agencies.find((a) => a.id === form.agencyId);
                    const rate = Number(agency?.defaultTacRate || 10);
                    const { tacAmount, propertyAmount } = calculateTac(totalEstimate, rate);

                    return (
                      <div className="p-2.5 bg-blue-50/90 dark:bg-blue-950/50 rounded-xl border border-blue-200 dark:border-blue-800/80 space-y-1">
                        <div className="flex justify-between font-extrabold text-blue-900 dark:text-blue-300 text-[11px]">
                          <span>TAC Partner ({rate}%)</span>
                          <span className="truncate max-w-[100px] text-right">{agency?.name || 'Agency'}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-blue-800 dark:text-blue-400 text-[11px]">
                          <span>Commission</span>
                          <span>- ₹{formatMoney(tacAmount)}</span>
                        </div>
                        <div className="flex justify-between font-black text-blue-950 dark:text-blue-200 text-[11px] border-t border-blue-200 dark:border-blue-800 pt-1 mt-1">
                          <span>Net Property</span>
                          <span>₹{formatMoney(propertyAmount)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold mt-2">
                    <span>Advance Payment</span>
                    <span>₹{formatMoney(advancePaid)}</span>
                  </div>

                  <div className="flex justify-between text-amber-600 dark:text-amber-400 font-extrabold text-sm pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                    <span>Balance Due</span>
                    <span>₹{formatMoney(balanceDue)}</span>
                  </div>
                </div>

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

export default function NewBookingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading reservation wizard...</div>}>
      <NewBookingContent />
    </Suspense>
  );
}
