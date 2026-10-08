'use client';

import { Toaster as Sonner } from 'sonner';

/** Toasts are live regions, so every success/failure is announced without stealing focus. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: '!rounded-card !border-2 !border-ink !bg-bone !text-ink !shadow-none !font-sans',
          error: '!bg-bubblegum',
          success: '!bg-matcha',
        },
      }}
    />
  );
}
