import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib';

/** Decorative: the surrounding element carries `aria-busy` and the words. */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 aria-hidden className={cn('size-4 animate-spin', className)} />;
}
