import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
};

/** Ids a control should put into `aria-describedby` for its hint and error. */
export function fieldDescribedBy(id: string, { error, hint }: { error?: string; hint?: string }) {
  return (
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') ||
    undefined
  );
}

/** Label + control + hint + error, wired for screen readers. Lives on dark (lilac) panels. */
export function Field({ id, label, error, hint, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="font-mono text-xs uppercase tracking-[0.05em] text-bone">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="font-mono text-xs text-bone/90">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          className="w-fit rounded-card bg-bubblegum px-2 py-1 font-mono text-xs leading-snug text-ink"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
