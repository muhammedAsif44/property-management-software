import React, { useEffect, useCallback, useRef } from 'react';
import { useNotificationsQuery, useMarkNotificationRead, Notification, NOTIFICATIONS_QUERY_KEY } from '../api/use-notifications';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2, Info, AlertTriangle, AlertCircle, Megaphone, CheckCheck, Loader2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '@/lib/i18n';
import { useQueryClient } from '@tanstack/react-query';

export function NotificationInbox() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useNotificationsQuery();
  const { mutate: markRead } = useMarkNotificationRead();

  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Robust 100% reliable Click-Outside handler for desktop & mobile
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Bulletproof multi-level unwrapping:
  const rawList = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.data?.data)
      ? (data as any).data.data
      : Array.isArray((data as any)?.data)
        ? (data as any).data
        : Array.isArray((data as any)?.notifications)
          ? (data as any).notifications
          : Array.isArray((data as any)?.items)
            ? (data as any).items
            : [];

  const notifications: Notification[] = Array.isArray(rawList) ? rawList : [];
  const unreadCount = notifications.filter((n: Notification) => n && !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'ALERT': return <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />;
      case 'BOOKING': return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
      case 'PAYMENT': return <AlertCircle className="h-4 w-4 text-blue-500 shrink-0" />;
      case 'SYSTEM': return <Megaphone className="h-4 w-4 text-violet-500 shrink-0" />;
      default: return <Info className="h-4 w-4 text-slate-500 shrink-0" />;
    }
  };

  const handleMarkAllRead = useCallback(() => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    unreadNotifications.forEach(n => markRead(n.id));
  }, [notifications, markRead]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) refetch();
        }}
        className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-4.5 h-4.5 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 shrink-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-extrabold text-white leading-none shadow-xs ring-2 ring-white dark:ring-slate-950 animate-in zoom-in-50 duration-200">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20 md:bg-transparent" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-[340px] rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950 z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in-0 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{t('notifications') || 'Notifications'}</h4>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors cursor-pointer"
                    title={t('markAllRead') || 'Mark all as read'}
                  >
                    <CheckCheck className="w-3 h-3" />
                    {t('markAllRead') || 'Mark all read'}
                  </button>
                )}
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {isLoading ? (
                <div className="p-8 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin mb-2" />
                  <p className="text-xs text-slate-400 font-medium">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <Bell className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {t('noNotifications') || 'All caught up!'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">No new notifications right now.</p>
                </div>
              ) : (
                notifications.map((n: Notification) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${!n.isRead ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''}`}
                    onClick={() => {
                      if (!n.isRead) markRead(n.id);
                    }}
                  >
                    <div className="shrink-0 mt-0.5">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-xs leading-tight ${!n.isRead ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
                          {n.title}
                        </p>
                        {!n.isRead && <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 mt-1 animate-pulse" />}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
