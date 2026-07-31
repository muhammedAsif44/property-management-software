'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { useCreateBookingMutation } from '@/features/bookings/api/use-bookings';
import { useTranslation } from '@/lib/i18n';
import { httpClient } from '@/lib/api/http-client';
import { CreateBookingPayload, BookingChannel, MealPlan } from '@/features/bookings/types/booking.types';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
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
  useActivePropertyQuery();
  const activeProperty = usePropertyStore((s) => s.activeProperty);
  const createMutation = useCreateBookingMutation();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Partial<CreateBookingPayload>>({
    adults: 1,
    children: 0,
    channel: 'WALK_IN',
    advancePaid: 0,
    facilityIds: [],
  });

  const DEFAULT_ROOM_TYPES: RoomType[] = [
    { id: 'deluxe-default', name: 'Deluxe Room', basePrice: 2500, maxOccupancy: 2, totalUnits: 10 },
    { id: 'suite-default', name: 'Executive Suite', basePrice: 4500, maxOccupancy: 4, totalUnits: 5 },
    { id: 'standard-default', name: 'Standard Room', basePrice: 1800, maxOccupancy: 2, totalUnits: 12 },
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

  const fetchedRoomTypes: RoomType[] = propertyData?.property?.roomTypes || propertyData?.roomTypes || (activeProperty as any)?.roomTypes || [];
  const roomTypes: RoomType[] = fetchedRoomTypes.length > 0 ? fetchedRoomTypes : DEFAULT_ROOM_TYPES;
  const amenities: Amenity[] = propertyData?.property?.amenities || propertyData?.amenities || (activeProperty as any)?.amenities || [];
  const agencies: Agency[] = propertyData?.property?.agencies || propertyData?.agencies || (activeProperty as any)?.agencies || [];

  useEffect(() => {
    if (!form.checkInDate || !form.checkOutDate) {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      setForm((f) => ({
        ...f,
        checkInDate: f.checkInDate || today,
        checkOutDate: f.checkOutDate || tomorrow,
      }));
    }
  }, []);

  useEffect(() => {
    if (roomTypes.length > 0 && !form.roomTypeId) {
      setForm((f) => ({
        ...f,
        roomTypeId: roomTypes[0].id,
        baseAmount: roomTypes[0].basePrice,
      }));
    }
  }, [roomTypes, form.roomTypeId]);

  const selectedRoom = roomTypes.find((r) => r.id === form.roomTypeId) || roomTypes[0];

  const handleChange = (field: string, value: any) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const toggleFacility = (id: string) => {
    setForm((f) => {
      const ids = f.facilityIds || [];
      return { ...f, facilityIds: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] };
    });
  };

  const facilityTotal = (form.facilityIds || []).reduce((sum, id) => {
    const a = amenities.find((x) => x.id === id);
    return sum + Number(a?.price || 0);
  }, 0);

  const baseAmount = Number(form.baseAmount ?? selectedRoom?.basePrice ?? 2500);
  const advancePaid = Number(form.advancePaid || 0);
  const totalEstimate = baseAmount + facilityTotal;
  const balanceDue = Math.max(0, totalEstimate - advancePaid);

  const handleSubmit = () => {
    if (!activeProperty?.id) return;
    const payload: CreateBookingPayload = {
      guestName: form.guestName || 'Guest',
      guestPhone: form.guestPhone,
      guestEmail: form.guestEmail,
      guestNationality: form.guestNationality,
      roomTypeId: form.roomTypeId || selectedRoom?.id || roomTypes[0]?.id || '',
      checkInDate: form.checkInDate || new Date().toISOString().split('T')[0],
      checkOutDate: form.checkOutDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      adults: form.adults || 1,
      children: form.children || 0,
      mealPlan: form.mealPlan as MealPlan | undefined,
      channel: (form.channel || 'WALK_IN') as BookingChannel,
      agencyId: form.agencyId,
      baseAmount: baseAmount,
      advancePaid: form.advancePaid || 0,
      facilityIds: form.facilityIds,
      notes: form.notes,
      propertyId: activeProperty.id,
    };
    createMutation.mutate(payload, {
      onSuccess: () => router.push('/bookings'),
    });
  };

  const canProceed = (s: number) => {
    if (s === 1) return !!form.guestName && form.guestName.trim().length > 0;
    return true;
  };

  return (
    <div className="flex min-h-screen bg-slate-50/90 text-slate-900 font-sans antialiased relative overflow-hidden">
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      <DashboardSidebar />
      <main className="flex-1 min-w-0 transition-all duration-300 relative z-10">
        <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-emerald-200/80 sticky top-0 z-30 px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-emerald-50 rounded-xl text-slate-700 hover:text-emerald-900 transition-all cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                {t('newBooking')}
              </h1>
              <p className="text-[11px] font-bold text-emerald-700/80 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {activeProperty?.name || t('activeManagementHub')}
              </p>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-6 sm:p-8 w-full space-y-6 pb-20">
          <BookingStepperHeader step={step} setStep={setStep} />

          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-emerald-200/90 shadow-lg p-6 sm:p-8 space-y-6">
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
              />
            )}

            <div className="flex items-center justify-between pt-5 border-t border-slate-100">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  {t('back')}
                </button>
              ) : <div />}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed(step)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 active:scale-95 text-white text-xs font-black transition-all duration-200 shadow-md shadow-emerald-700/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {t('next')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 active:scale-95 text-white text-xs font-black transition-all duration-200 shadow-md shadow-emerald-700/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{createMutation.isPending ? t('creating') : t('confirmBooking')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
