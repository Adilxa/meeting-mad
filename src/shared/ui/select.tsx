import { ChevronDown } from 'lucide-react';
import type * as React from 'react';
import { cn } from '@/shared/lib';
import { controlClassName } from './input';

/**
 * Native select on purpose: keyboard, screen readers and the mobile wheel picker come for
 * free, and a time list of 15-minute steps is exactly what it was made for.
 */
export function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select className={cn(controlClassName, 'appearance-none pr-10', className)} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-ink"
      />
    </div>
  );
}
