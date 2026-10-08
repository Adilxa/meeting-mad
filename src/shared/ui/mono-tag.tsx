import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';

/** A stamped label: Bergen-Mono-style micro type with an optional hairline border. */
export function MonoTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill border border-current px-2.5 py-1 font-mono text-xs leading-none tracking-[0.05em]',
        className,
      )}
    >
      {children}
    </span>
  );
}
