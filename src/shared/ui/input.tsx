import type * as React from 'react';
import { cn } from '@/shared/lib';

export const controlClassName =
  'focus-ring h-11 w-full rounded-card border-2 border-ink bg-bone px-3 text-base text-ink placeholder:text-ink/50 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-firecracker aria-invalid:bg-bubblegum/40';

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return <input className={cn(controlClassName, className)} {...props} />;
}
