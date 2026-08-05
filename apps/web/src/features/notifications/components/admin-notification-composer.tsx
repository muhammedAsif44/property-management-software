import React, { useState } from 'react';
import { useCreateNotification } from '../api/use-notifications';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function AdminNotificationComposer() {
  const { t } = useTranslation();
  const toast = useToast();
  const { mutate: createNotification, isPending } = useCreateNotification();

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

    createNotification({
      title,
      message,
      type,
      targetRole: targetRole === 'ALL' ? undefined : targetRole,
    }, {
      onSuccess: () => {
        toast.success(t('notificationSent') || 'Notification sent successfully!', 'Success');
        setTitle('');
        setMessage('');
      },
      onError: (err: any) => {
        toast.error(err.message || 'Failed to send notification.', 'Error');
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-semibold text-lg">{t('composeNotification') || 'Compose Notification'}</h3>
        <p className="text-sm text-slate-500">
          {t('broadcastMessageDesc') || 'Broadcast a message to staff across the property or organization.'}
        </p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('title') || 'Title'}</label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('notificationTitle') || 'Enter title...'}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('type') || 'Type'}</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300"
              >
                <option value="SYSTEM">{t('system') || 'System'}</option>
                <option value="ALERT">{t('alert') || 'Alert'}</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('targetRole') || 'Target Role'}</label>
            <select 
              value={targetRole} 
              onChange={(e) => setTargetRole(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300"
            >
              <option value="ALL">{t('allStaff') || 'All Staff'}</option>
              <option value="MANAGER">{t('managers') || 'Managers'}</option>
              <option value="RECEPTION_STAFF">{t('receptionists') || 'Receptionists'}</option>
              <option value="HOUSEKEEPING">{t('housekeeping') || 'Housekeeping'}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('message') || 'Message'}</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('typeYourMessage') || 'Type your message here...'}
              rows={4}
              maxLength={500}
              className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
            />
          </div>

          <Button type="submit" disabled={isPending || !title || !message} className="w-full">
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {t('sendNotification') || 'Send Notification'}
          </Button>
        </form>
      </div>
    </div>
  );
}
