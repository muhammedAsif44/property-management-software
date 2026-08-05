import React from 'react';
import { useNotificationsQuery, useMarkNotificationRead, Notification } from '../api/use-notifications';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '@/lib/i18n';

export function NotificationInbox() {
  const { t } = useTranslation();
  const { data, isLoading } = useNotificationsQuery();
  const { mutate: markRead } = useMarkNotificationRead();

  const notifications = Array.isArray(data) ? data : data?.data || [];
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'ALERT': return <AlertTriangle className="h-4 w-4 text-rose-500" />;
      case 'BOOKING': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'PAYMENT': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-slate-500" />;
    }
  };

  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="relative text-slate-500 dark:text-slate-400"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-md border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-950 z-50 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4">
          <h4 className="font-semibold">{t('notifications') || 'Notifications'}</h4>
          <span className="text-xs text-slate-500">{unreadCount} unread</span>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              {t('noNotifications') || 'No notifications right now.'}
            </div>
          ) : (
            notifications.map((n: Notification) => (
              <div 
                key={n.id} 
                className={`flex gap-3 p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${!n.isRead ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}`}
                onClick={() => {
                  if (!n.isRead) markRead(n.id);
                }}
              >
                <div className="shrink-0 mt-1">{getIcon(n.type)}</div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <p className={`text-sm leading-tight ${!n.isRead ? 'font-semibold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                      {n.title}
                    </p>
                    {/* Unread indicator dot */}
                    {!n.isRead && <div className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5" />}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-slate-400">
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
