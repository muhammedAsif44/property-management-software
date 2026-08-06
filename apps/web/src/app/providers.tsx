'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/react-query';
import { ToastProvider } from '@/components/ui/toast';
import { LanguageProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';
import { usePropertyRealtimeSync } from '@/lib/realtime/use-socket';

function RealtimeListenerBridge({ children }: { children: React.ReactNode }) {
  usePropertyRealtimeSync();
  return <>{children}</>;
}

export function Providers({ children }: { children: any }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <LanguageProvider>
            <RealtimeListenerBridge>{children}</RealtimeListenerBridge>
          </LanguageProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
