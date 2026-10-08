import { AlertTriangle, Info, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';

type AlertTone = 'warning' | 'error' | 'info';

type AlertProps = {
  tone?: AlertTone;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
};

const toneStyles: Record<AlertTone, string> = {
  // Hi-Vis Yellow is reserved for «the most important thing on screen».
  warning: 'bg-hi-vis text-ink',
  error: 'bg-bubblegum text-ink',
  info: 'bg-bone text-ink',
};

const toneIcons = { warning: AlertTriangle, error: XCircle, info: Info } as const;

/**
 * A flat paint card with a message. Warnings and errors are announced (`role="alert"`),
 * info is polite (`role="status"`).
 */
export function Alert({ tone = 'info', title, children, action, className }: AlertProps) {
  const Icon = toneIcons[tone];
  return (
    <div
      role={tone === 'info' ? 'status' : 'alert'}
      className={cn(
        'flex gap-3 rounded-card border-2 border-ink p-card',
        toneStyles[tone],
        className,
      )}
    >
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="font-bold leading-snug">{title}</p>
        {children ? <div className="text-sm leading-snug">{children}</div> : null}
        {action ? <div className="mt-1.5">{action}</div> : null}
      </div>
    </div>
  );
}
