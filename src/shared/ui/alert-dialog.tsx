'use client';

import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  /** The confirming control — usually a `<Button>`; the dialog does not close on its own. */
  confirm: ReactNode;
  cancelLabel?: string;
};

/**
 * Radix AlertDialog: focus trap, Esc, focus return and `role="alertdialog"` handled. The
 * confirm action is a slot so the caller can keep it open while the request is in flight.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirm,
  cancelLabel = 'Отмена',
}: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/50" />
        <AlertDialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-card border-2 border-ink bg-bone p-6 text-ink">
          <AlertDialogPrimitive.Title className="font-display font-black text-2xl leading-none">
            {title}
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="text-base leading-snug">
            {description}
          </AlertDialogPrimitive.Description>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <AlertDialogPrimitive.Cancel className="focus-ring inline-flex h-11 items-center justify-center rounded-pill border-2 border-ink px-[17px] font-bold tracking-[0.05em] hover:bg-ink/5">
              {cancelLabel}
            </AlertDialogPrimitive.Cancel>
            {confirm}
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
