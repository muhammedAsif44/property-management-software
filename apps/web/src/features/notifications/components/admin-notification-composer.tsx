import React, { useState } from 'react';
import { useBroadcastAnnouncement } from '../api/use-notifications';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Megaphone, Users, Radio } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useQueryClient } from '@tanstack/react-query';

export function AdminNotificationComposer() {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { mutate: broadcastAnnouncement, isPending } = useBroadcastAnnouncement();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('SYSTEM');
  const [targetRole, setTargetRole] = useState('ALL');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error(t('fillRequiredFields') || 'Please fill out title and message.');
      return;
    }

    broadcastAnnouncement({
      title,
      message,
      type,
      targetRole: targetRole === 'ALL' ? undefined : targetRole,
    }, {
      onSuccess: () => {
        toast.success(t('notificationSent') || 'Broadcast sent to all organizations!', 'Success');
        setTitle('');
        setMessage('');
        // Immediately invalidate notifications so bell picks it up
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
      onError: (err: any) => {
        toast.error(err.message || 'Failed to broadcast notification.', 'Error');
      }
    });
  };

  const selectClass = "flex h-9 w-full items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium ring-offset-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:ring-offset-1 dark:border-slate-700 dark:bg-slate-800 dark:ring-offset-slate-950 dark:focus:ring-emerald-400/30 transition-shadow";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs h-full">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-600" />
              {t('broadcastAnnouncements') || 'Broadcast Announcement'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('broadcastMessageDesc') || 'Send a broadcast to all tenant organizations. Notifications appear instantly in the PMS notification bell.'}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Radio className="w-3 h-3" />
            LIVE
          </span>
        </div>
      </div>
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                {t('targetRole') || 'Target Audience'}
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className={selectClass}
              >
                <option value="ALL">{t('allStaff') || 'All Staff & Owners'}</option>
                <option value="OWNER">{t('owners') || 'Owners Only'}</option>
                <option value="MANAGER">{t('managers') || 'Managers'}</option>
                <option value="RECEPTION_STAFF">{t('receptionists') || 'Receptionists'}</option>
                <option value="HOUSEKEEPING">{t('housekeeping') || 'Housekeeping'}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                {t('type') || 'Type'}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={selectClass}
              >
                <option value="SYSTEM">{t('system') || 'System Announcement'}</option>
                <option value="ALERT">{t('alert') || 'Urgent Alert'}</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {t('title') || 'Title'}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('notificationTitle') || 'Enter broadcast title...'}
              maxLength={100}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {t('message') || 'Message'}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('typeYourMessage') || 'Type your broadcast message...'}
              rows={3}
              maxLength={500}
              className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30 focus-visible:ring-offset-1 dark:border-slate-700 dark:bg-slate-800 dark:ring-offset-slate-950 dark:placeholder:text-slate-500 dark:focus-visible:ring-emerald-400/30 transition-shadow resize-none"
            />
            <p className="text-[10px] text-slate-400 text-right">{message.length}/500</p>
          </div>

          <Button type="submit" disabled={isPending || !title || !message} className="w-full h-9 text-xs font-bold">
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-2" />
            )}
            {t('sendNotification') || 'Broadcast to All Organizations'}
          </Button>
        </form>
      </div>
    </div>
  );
}
