'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/react-query';
import { ToastProvider } from '@/components/ui/toast';
import { LanguageProvider } from '@/lib/i18n';

export function Providers({ children }: { children: any }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
