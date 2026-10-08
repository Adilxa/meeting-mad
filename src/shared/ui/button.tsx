import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type * as React from 'react';
import { cn } from '@/shared/lib';

/*
 * The design system has no filled colour CTA: the primary action is a cream pill, the
 * secondary one a yellow outline (dark surfaces) or an ink outline (light surfaces).
 */
const buttonVariants = cva(
  "focus-ring inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-pill font-bold tracking-[0.05em] transition-colors select-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        pill: 'bg-bone text-ink hover:bg-white',
        outline: 'border-2 border-hi-vis text-hi-vis hover:bg-hi-vis/10',
        'outline-ink': 'border-2 border-ink text-ink hover:bg-ink/5',
        ghost: 'text-ink hover:bg-ink/5',
        'ghost-light': 'text-bone hover:bg-bone/10',
      },
      size: {
        md: 'h-11 px-[17px] text-base',
        sm: 'h-9 px-4 text-sm',
        icon: 'size-11',
      },
    },
    defaultVariants: {
      variant: 'pill',
      size: 'md',
    },
  },
);

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      data-slot="button"
      // A button inside a form submits by default — make that an explicit choice.
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
