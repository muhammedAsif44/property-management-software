'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useOtaChannels, useConnectChannel, useSyncAri, useSimulateOtaWebhook } from '../api/use-channels';
import { 
  Globe, 
  RefreshCw, 
  CheckCircle2, 
  Zap, 
  TrendingUp, 
  PlusCircle, 
  Flag, 
  SlidersHorizontal, 
  X, 
  Key, 
  Hash, 
  Layers, 
  ArrowUpRight,
  Radio,
  Check
} from 'lucide-react';

interface Props {
  propertyId: string;
}

interface OtaMeta {
  key: string;
  label: string;
  category: 'INDIAN' | 'GLOBAL' | 'AGGREGATOR';
  accentColor: string;
  brandBg: string;
  brandText: string;
  description: string;
}

const OTA_CATALOG: OtaMeta[] = [
  { key: 'MAKEMYTRIP', label: 'MakeMyTrip', category: 'INDIAN', accentColor: '#e61923', brandBg: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20', brandText: 'MMT', description: 'Largest OTA network in India. Instant 2-way rate & booking sync.' },
  { key: 'GOIBIBO', label: 'Goibibo', category: 'INDIAN', accentColor: '#ff6600', brandBg: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20', brandText: 'IBIBO', description: 'Popular budget & business travel booking network in India.' },
  { key: 'EASEMYTRIP', label: 'EaseMyTrip', category: 'INDIAN', accentColor: '#0084ff', brandBg: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20', brandText: 'EMT', description: 'Fast-growing zero-convenience-fee OTA platform.' },
  { key: 'YATRA', label: 'Yatra', category: 'INDIAN', accentColor: '#ea2330', brandBg: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20', brandText: 'YATRA', description: 'Corporate & leisure travel channel across tier 1 & 2 Indian cities.' },
  { key: 'BOOKING_COM', label: 'Booking.com', category: 'GLOBAL', accentColor: '#003580', brandBg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20', brandText: 'BKNG', description: 'World leader in hotel reservations and homestays.' },
  { key: 'AGODA', label: 'Agoda', category: 'GLOBAL', accentColor: '#5869ff', brandBg: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20', brandText: 'AGD', description: 'Leading APAC & international travel booking portal.' },
  { key: 'AIRBNB', label: 'Airbnb', category: 'GLOBAL', accentColor: '#ff5a5f', brandBg: 'bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20', brandText: 'ABNB', description: 'Global homestay, villa, and boutique stay marketplace.' },
  { key: 'AIOSELL', label: 'Aiosell API Connect', category: 'AGGREGATOR', accentColor: '#059669', brandBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20', brandText: 'AIO', description: 'India-native 2-way Channel Manager engine (₹400/mo).' },
  { key: 'CHANNEX', label: 'Channex.io API', category: 'AGGREGATOR', accentColor: '#6366f1', brandBg: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20', brandText: 'CHNX', description: 'Whitelabel REST & Webhooks Connectivity API.' },
];

export const ChannelManagerDashboard: React.FC<Props> = ({ propertyId }) => {
  const { t } = useTranslation();
  const { data: channels } = useOtaChannels(propertyId);
  const connectChannel = useConnectChannel();
  const syncAri = useSyncAri();
  const simulateWebhook = useSimulateOtaWebhook();

  const [activeTab, setActiveTab] = useState<'channels' | 'pricing'>('channels');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Connection Credentials Modal state
  const [selectedOta, setSelectedOta] = useState<OtaMeta | null>(null);
  const [hotelIdInput, setHotelIdInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');

  const connectedCount = channels?.filter((c) => c.isConnected).length || 0;
  const indianActiveCount = OTA_CATALOG.filter((meta) => meta.category === 'INDIAN' && channels?.some((c) => c.channel === meta.key && c.isConnected)).length;
  const globalActiveCount = OTA_CATALOG.filter((meta) => meta.category === 'GLOBAL' && channels?.some((c) => c.channel === meta.key && c.isConnected)).length;
  const totalImported = channels?.reduce((acc, curr) => acc + (curr.totalBookingsImported || 0), 0) || 0;

  const handleSyncAll = async () => {
    try {
      await syncAri.mutateAsync({ propertyId });
      setSuccessMsg(t('otaSyncSuccess'));
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('ARI Sync failed', err);
    }
  };

  const handleOpenConnectModal = (meta: OtaMeta) => {
    const existing = channels?.find((c) => c.channel === meta.key);
    setSelectedOta(meta);
    setHotelIdInput(existing?.credentials?.hotelId || '');
    setApiKeyInput(existing?.credentials?.apiKey || '');
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOta) return;

    try {
      await connectChannel.mutateAsync({
        propertyId,
        channel: selectedOta.key,
        credentials: {
          hotelId: hotelIdInput,
          apiKey: apiKeyInput,
          configuredAt: new Date().toISOString(),
        },
      });
      setSelectedOta(null);
      setSuccessMsg(`Successfully connected ${selectedOta.label}!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to save connection', err);
    }
  };

  const handleDisconnect = async (key: string) => {
    try {
      await connectChannel.mutateAsync({
        propertyId,
        channel: key,
        credentials: { enabled: false },
      });
      setSuccessMsg(`Disconnected channel successfully`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to disconnect channel', err);
    }
  };

  const handleTestWebhook = async () => {
    try {
      await simulateWebhook.mutateAsync({
        eventType: 'RESERVATION_CREATED',
        channel: 'MAKEMYTRIP',
        externalReservationId: `MMT-TEST-${Math.floor(100000 + Math.random() * 900000)}`,
        propertyId,
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        totalAmount: 4500,
        guestName: 'Kerala Guest (Sandbox Test)',
        guestPhone: '+919876543210',
      });
      setSuccessMsg('Simulated Instant MMT Reservation Created!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Webhook simulation failed', err);
    }
  };

  const renderOtaCard = (meta: OtaMeta) => {
    const channelData = channels?.find((c) => c.channel === meta.key);
    const isConnected = channelData?.isConnected ?? false;

    return (
      <div
        key={meta.key}
        className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 flex flex-col justify-between gap-4 transition-all shadow-xs hover:shadow-md min-w-0 group"
      >
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-black tracking-wider uppercase border shrink-0 ${meta.brandBg}`}>
                {meta.brandText}
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate min-w-0">
                {meta.label}
              </h3>
              {meta.category === 'INDIAN' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 shrink-0">
                  India Native
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 min-w-0 line-clamp-2 leading-relaxed">
              {meta.description}
            </p>
          </div>

          <div className="shrink-0 pt-0.5">
            {isConnected ? (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            ) : (
              <span className="inline-flex rounded-full h-3 w-3 bg-slate-300 dark:bg-slate-700" />
            )}
          </div>
        </div>

        <div className="space-y-2 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-3 min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <span className="text-slate-500 dark:text-slate-400 font-medium truncate">{t('liveStatus')}:</span>
            <span className={`font-extrabold text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
              isConnected 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}>
              {isConnected ? 'ACTIVE' : 'READY TO CONNECT'}
            </span>
          </div>

          <div className="flex items-center justify-between min-w-0">
            <span className="text-slate-500 dark:text-slate-400 font-medium truncate">{t('importedBookings')}:</span>
            <span className="text-slate-900 dark:text-white font-mono font-bold shrink-0">
              {channelData?.totalBookingsImported || 0}
            </span>
          </div>
        </div>

        <div className="pt-1 min-w-0 flex items-center gap-2">
          {isConnected ? (
            <>
              <button
                onClick={() => handleOpenConnectModal(meta)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Configure</span>
              </button>
              <button
                onClick={() => handleDisconnect(meta.key)}
                className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-xs font-bold transition shrink-0"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={() => handleOpenConnectModal(meta)}
              disabled={connectChannel.isPending}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-2 shadow-xs shrink-0"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('connectChannel')}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Modern SaaS Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 min-w-0">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight min-w-0 truncate">
              {t('channelManager')}
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 shrink-0">
              2-Way Instant Sync
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium min-w-0 truncate">
            {t('channelManagerDesc')}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleTestWebhook}
            disabled={simulateWebhook.isPending}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition flex items-center gap-2 shadow-2xs shrink-0"
          >
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">Test Sandbox Webhook</span>
          </button>

          <button
            onClick={handleSyncAll}
            disabled={syncAri.isPending}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${syncAri.isPending ? 'animate-spin' : ''} shrink-0`} />
            <span className="truncate">{syncAri.isPending ? t('otaSyncing') : t('syncNow')}</span>
          </button>
        </div>
      </div>

      {/* Modern SaaS KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-w-0">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-1 min-w-0 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase min-w-0 truncate">
            {t('connectedChannels')}
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 shrink-0">
            {connectedCount} / {OTA_CATALOG.length}
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-1 min-w-0 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase min-w-0 truncate">
            Indian OTAs Active
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 shrink-0">
            {indianActiveCount}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-1 min-w-0 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase min-w-0 truncate">
            Global OTAs Active
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 shrink-0">
            {globalActiveCount}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-1 min-w-0 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase min-w-0 truncate">
            {t('importedBookings')}
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono shrink-0">
            {totalImported}
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 min-w-0">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="min-w-0 truncate font-bold">{successMsg}</span>
        </div>
      )}

      {/* Modern SaaS Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 min-w-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'channels'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 font-bold'
          }`}
        >
          <Globe className="w-4 h-4 shrink-0" />
          <span>{t('activeOtaIntegrations')}</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'pricing'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 font-bold'
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span>{t('pricingTiersTitle')}</span>
        </button>
      </div>

      {/* Tab 1: OTA Channels Divided into Categorized Sections */}
      {activeTab === 'channels' && (
        <div className="space-y-8 min-w-0">
          {/* Section 1: Indian OTA Channels */}
          <div className="space-y-4 min-w-0">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-black text-sm uppercase tracking-wider border-b border-slate-200 dark:border-slate-800/60 pb-2 min-w-0">
              <Flag className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">{t('indianChannelsSection')}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 min-w-0">
              {OTA_CATALOG.filter((meta) => meta.category === 'INDIAN').map(renderOtaCard)}
            </div>
          </div>

          {/* Section 2: Global OTA Channels */}
          <div className="space-y-4 min-w-0">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-black text-sm uppercase tracking-wider border-b border-slate-200 dark:border-slate-800/60 pb-2 min-w-0">
              <Globe className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="truncate">{t('globalChannelsSection')}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 min-w-0">
              {OTA_CATALOG.filter((meta) => meta.category === 'GLOBAL').map(renderOtaCard)}
            </div>
          </div>

          {/* Section 3: Aggregators */}
          <div className="space-y-4 min-w-0">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-black text-sm uppercase tracking-wider border-b border-slate-200 dark:border-slate-800/60 pb-2 min-w-0">
              <Layers className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">{t('aggregatorSection')}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-w-0">
              {OTA_CATALOG.filter((meta) => meta.category === 'AGGREGATOR').map(renderOtaCard)}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Subscription Tiers & Profitability Calculator */}
      {activeTab === 'pricing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 space-y-5 min-w-0 shadow-lg">
            <div className="flex items-center justify-between min-w-0">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-wider shrink-0">
                RECOMMENDED
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white shrink-0">₹699 / mo</span>
            </div>

            <div className="space-y-1 min-w-0">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white min-w-0 truncate">{t('allInOnePlanTitle')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 min-w-0 truncate">{t('proPlanSub')}</p>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 min-w-0">
              <li className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate font-semibold">Complete Front Desk, Tape Chart, GST Invoicing & Malayalam i18n</span>
              </li>
              <li className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate font-semibold">2-Way Instant Sync with MakeMyTrip, Goibibo, EaseMyTrip, Booking.com, Agoda, Airbnb</span>
              </li>
              <li className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate font-semibold">Automated Rates & Inventory (ARI) push</span>
              </li>
            </ul>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1 min-w-0">
              <div className="font-bold text-emerald-700 dark:text-emerald-400">Net Profit Breakdown:</div>
              <div>Hotel Subscription Revenue: ₹699 / mo</div>
              <div>Vendor Channel API Fee: ₹400 / mo</div>
              <div className="font-extrabold text-slate-900 dark:text-white text-sm pt-1">Net Monthly Profit to Orvyn: ₹299 per hotel</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 min-w-0 shadow-lg">
            <div className="space-y-1 min-w-0">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white min-w-0 truncate">Tiered Subscription Option</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 min-w-0 truncate">For properties requiring PMS only vs full OTA channel sync</p>
            </div>

            <div className="space-y-4 min-w-0">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 min-w-0">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white text-sm min-w-0 truncate">{t('starterPlanTitle')}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 min-w-0 truncate">PMS Core Suite (No OTA Sync)</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">₹399 / mo</div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">100% Net Profit</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 min-w-0">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white text-sm min-w-0 truncate">{t('proPlanTitle')}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 min-w-0 truncate">Full PMS + 2-Way OTA Channel Manager</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">₹899 / mo</div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">₹466 Profit / hotel</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Setup Modal */}
      {selectedOta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 relative min-w-0">
            <button
              onClick={() => setSelectedOta(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white min-w-0 truncate">
                {t('configureCredentials')} - {selectedOta.label}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 min-w-0 truncate">
                Enter your property API credentials or mapping key
              </p>
            </div>

            <form onSubmit={handleSaveConnection} className="space-y-4 min-w-0">
              <div className="space-y-1.5 min-w-0">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t('hotelId')}</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MMT-489102"
                  value={hotelIdInput}
                  onChange={(e) => setHotelIdInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition min-w-0 font-medium"
                />
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{t('apiKey')}</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Paste API Secret Token"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition min-w-0 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedOta(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connectChannel.isPending}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{t('saveConnection')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
