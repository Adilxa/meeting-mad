import { cn } from '@/shared/lib';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-card bg-ink/10', className)} />;
}
