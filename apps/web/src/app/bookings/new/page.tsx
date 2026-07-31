'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { usePropertyStore, useActivePropertyQuery } from '@/features/properties';
import { authService } from '@/features/auth';
import { useCreateBookingMutation } from '@/features/bookings/api/use-bookings';
import { useTranslation } from '@/lib/i18n';
import { httpClient } from '@/lib/api/http-client';
import { CreateBookingPayload, BookingChannel, MealPlan } from '@/features/bookings/types/booking.types';
import {
  Calendar,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Globe2,
  BedDouble,
  UtensilsCrossed,
  CreditCard,
  CheckCircle2,
  Loader2,
  Search,
} from 'lucide-react';

interface RoomType { id: string; name: string; basePrice: number; totalUnits: number; maxOccupancy: number; }
interface Amenity { id: string; name: string; price: number; icon?: string; }
interface Agency { id: string; name: string; contactPerson?: string; defaultTacRate?: number; }

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

  // Fetch room types, amenities, agencies for this property
  const { data: propertyData } = useQuery({
    queryKey: ['property-booking-data', activeProperty?.id],
    queryFn: async () => {
      if (!activeProperty?.id) return null;
      const [onb] = await Promise.all([
        httpClient.get<any>(`/properties/${activeProperty.id}/onboarding`),
      ]);
      return onb?.data || onb;
    },
    enabled: !!activeProperty?.id,
    staleTime: 30000,
  });

  const roomTypes: RoomType[] = propertyData?.roomTypes || [];
  const amenities: Amenity[] = propertyData?.amenities || [];
  const agencies: Agency[] = propertyData?.agencies || [];

  const selectedRoom = roomTypes.find((r) => r.id === form.roomTypeId);

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
    return sum + (a?.price || 0);
  }, 0);

  const baseAmount = form.baseAmount || selectedRoom?.basePrice || 0;
  const totalEstimate = baseAmount + facilityTotal;

  const handleSubmit = () => {
    if (!activeProperty?.id) return;
    const payload: CreateBookingPayload = {
      guestName: form.guestName || '',
      guestPhone: form.guestPhone,
      guestEmail: form.guestEmail,
      guestNationality: form.guestNationality,
      roomTypeId: form.roomTypeId || '',
      checkInDate: form.checkInDate || '',
      checkOutDate: form.checkOutDate || '',
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
    if (s === 1) return !!form.guestName;
    if (s === 2) return !!form.roomTypeId && !!form.checkInDate && !!form.checkOutDate;
    if (s === 3) return baseAmount > 0;
    return true;
  };

  const steps = [
    { num: 1, label: t('guestDetails'), icon: User },
    { num: 2, label: t('roomAndDates'), icon: BedDouble },
    { num: 3, label: t('pricingAndFacilities'), icon: CreditCard },
    { num: 4, label: t('reviewAndConfirm'), icon: CheckCircle2 },
  ];

  return (
    <div className="flex h-screen bg-slate-50/90 text-slate-900 font-sans antialiased relative overflow-hidden">
      {/* Ambient Rich Emerald Glow Elements */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      <DashboardSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto relative z-10">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
          <div className="px-6 py-4 flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('newBooking')}</h1>
              <p className="text-sm text-gray-500">{activeProperty?.name}</p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto p-6">
          {/* Stepper */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const active = step === s.num;
              const done = step > s.num;
              return (
                <React.Fragment key={s.num}>
                  <button
                    onClick={() => done && setStep(s.num)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : done ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-400'}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${step > s.num ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
                </React.Fragment>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6 space-y-5">
            {step === 1 && (
              <>
                <h2 className="text-lg font-semibold text-gray-900">{t('guestDetails')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('guestName')} *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={form.guestName || ''} onChange={(e) => handleChange('guestName', e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" placeholder={t('enterGuestName')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('phoneNumber')}</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="tel" value={form.guestPhone || ''} onChange={(e) => handleChange('guestPhone', e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" placeholder={t('enterPhone')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="email" value={form.guestEmail || ''} onChange={(e) => handleChange('guestEmail', e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" placeholder={t('enterEmail')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('nationality')}</label>
                    <div className="relative">
                      <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={form.guestNationality || ''} onChange={(e) => handleChange('guestNationality', e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" placeholder={t('enterNationality')} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-lg font-semibold text-gray-900">{t('roomAndDates')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('selectRoomType')} *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {roomTypes.map((rt) => (
                        <button
                          key={rt.id}
                          onClick={() => { handleChange('roomTypeId', rt.id); handleChange('baseAmount', rt.basePrice); }}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${form.roomTypeId === rt.id ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">{rt.name}</span>
                            <span className="text-emerald-600 font-bold">₹{rt.basePrice}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{rt.totalUnits} units • Max {rt.maxOccupancy} guests</p>
                        </button>
                      ))}
                      {roomTypes.length === 0 && <p className="text-sm text-gray-400 col-span-2">{t('noRoomTypesConfigured')}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkInDate')} *</label>
                      <input type="date" value={form.checkInDate || ''} onChange={(e) => handleChange('checkInDate', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkOutDate')} *</label>
                      <input type="date" value={form.checkOutDate || ''} onChange={(e) => handleChange('checkOutDate', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('adults')}</label>
                      <input type="number" min={1} value={form.adults || 1} onChange={(e) => handleChange('adults', parseInt(e.target.value) || 1)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('children')}</label>
                      <input type="number" min={0} value={form.children || 0} onChange={(e) => handleChange('children', parseInt(e.target.value) || 0)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('bookingChannel')}</label>
                    <select value={form.channel || 'WALK_IN'} onChange={(e) => handleChange('channel', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                      <option value="WALK_IN">{t('walkIn')}</option>
                      <option value="PHONE">{t('phoneBooking')}</option>
                      <option value="WEBSITE">Website</option>
                      <option value="AGENCY">{t('agencyBooking')}</option>
                      <option value="OTA">{t('otaBooking')}</option>
                    </select>
                  </div>
                  {form.channel === 'AGENCY' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('selectAgency')}</label>
                      <select value={form.agencyId || ''} onChange={(e) => handleChange('agencyId', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                        <option value="">{t('chooseAgency')}</option>
                        {agencies.map((a) => (
                          <option key={a.id} value={a.id}>{a.name} ({a.defaultTacRate}% TAC)</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-lg font-semibold text-gray-900">{t('pricingAndFacilities')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('mealPlan')}</label>
                    <select value={form.mealPlan || ''} onChange={(e) => handleChange('mealPlan', e.target.value || undefined)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                      <option value="">{t('noMealPlan')}</option>
                      <option value="EP">EP — {t('europeanPlan')}</option>
                      <option value="CP">CP — {t('continentalPlan')}</option>
                      <option value="MAP">MAP — {t('modifiedAmericanPlan')}</option>
                      <option value="AP">AP — {t('americanPlan')}</option>
                    </select>
                  </div>
                  {amenities.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('extraFacilities')}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {amenities.map((a) => {
                          const selected = (form.facilityIds || []).includes(a.id);
                          return (
                            <button
                              key={a.id}
                              onClick={() => toggleFacility(a.id)}
                              className={`px-3 py-2 rounded-xl border text-sm text-left transition-all ${selected ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                            >
                              <span className="font-medium">{a.name}</span>
                              <span className="block text-xs mt-0.5">₹{a.price}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('baseAmount')} (₹) *</label>
                      <input type="number" min={0} value={form.baseAmount || selectedRoom?.basePrice || ''} onChange={(e) => handleChange('baseAmount', parseFloat(e.target.value) || 0)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('advancePaid')} (₹)</label>
                      <input type="number" min={0} value={form.advancePaid || ''} onChange={(e) => handleChange('advancePaid', parseFloat(e.target.value) || 0)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('notes')}</label>
                    <textarea value={form.notes || ''} onChange={(e) => handleChange('notes', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" placeholder={t('bookingNotesPlaceholder')} />
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="text-lg font-semibold text-gray-900">{t('reviewAndConfirm')}</h2>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                    <div><span className="text-gray-500">{t('guest')}:</span><p className="font-semibold text-gray-900">{form.guestName}</p></div>
                    <div><span className="text-gray-500">{t('phoneNumber')}:</span><p className="font-semibold text-gray-900">{form.guestPhone || '—'}</p></div>
                    <div><span className="text-gray-500">{t('roomType')}:</span><p className="font-semibold text-gray-900">{selectedRoom?.name || '—'}</p></div>
                    <div><span className="text-gray-500">{t('channel')}:</span><p className="font-semibold text-gray-900">{form.channel}</p></div>
                    <div><span className="text-gray-500">{t('checkInDate')}:</span><p className="font-semibold text-gray-900">{form.checkInDate}</p></div>
                    <div><span className="text-gray-500">{t('checkOutDate')}:</span><p className="font-semibold text-gray-900">{form.checkOutDate}</p></div>
                    <div><span className="text-gray-500">{t('guests')}:</span><p className="font-semibold text-gray-900">{form.adults} {t('adults')}, {form.children || 0} {t('children')}</p></div>
                    <div><span className="text-gray-500">{t('mealPlan')}:</span><p className="font-semibold text-gray-900">{form.mealPlan || 'None'}</p></div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex justify-between"><span className="text-gray-600">{t('baseAmount')}:</span><span className="font-semibold">₹{baseAmount.toLocaleString('en-IN')}</span></div>
                    {facilityTotal > 0 && <div className="flex justify-between mt-1"><span className="text-gray-600">{t('facilities')}:</span><span className="font-semibold">₹{facilityTotal.toLocaleString('en-IN')}</span></div>}
                    <div className="flex justify-between mt-1"><span className="text-gray-600">{t('advancePaid')}:</span><span className="font-semibold">₹{(form.advancePaid || 0).toLocaleString('en-IN')}</span></div>
                    <hr className="my-2 border-emerald-200" />
                    <div className="flex justify-between text-base"><span className="font-bold text-emerald-800">{t('estimatedTotal')}:</span><span className="font-bold text-emerald-800">₹{totalEstimate.toLocaleString('en-IN')}</span></div>
                  </div>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t border-gray-100">
              {step > 1 ? (
                <button onClick={() => setStep(step - 1)} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">{t('back')}</button>
              ) : <div />}
              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed(step)}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200"
                >
                  {t('next')}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {createMutation.isPending ? t('creating') : t('confirmBooking')}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
