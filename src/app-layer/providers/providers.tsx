'use client';

import type { ReactNode } from 'react';
import { Toaster } from '@/shared/ui';
import { QueryProvider } from './query-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <Toaster />
    </QueryProvider>
  );
}
