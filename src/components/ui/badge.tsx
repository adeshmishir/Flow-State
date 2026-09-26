import { type VariantProps, cva } from 'class-variance-authority'
import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex shrink-0 items-center gap-1.5 rounded-sm font-medium whitespace-nowrap transition-colors duration-150 ease-standard',
  {
    variants: {
      tone: {
        neutral: 'bg-ink/6 text-ink-secondary',
        accent: 'bg-accent-soft text-accent-soft-ink',
        success: 'bg-success-soft text-success',
        warning: 'bg-warning-soft text-warning',
        danger: 'bg-danger-soft text-danger',
        outline: 'border border-line text-ink-muted',
      },
      size: {
        sm: 'h-5 px-1.5 text-2xs',
        md: 'h-6 px-2 text-xs',
      },
    },
    defaultVariants: {
      tone: 'neutral',
      size: 'sm',
    },
  },
)

type BadgeProps = ComponentPropsWithoutRef<'span'> & VariantProps<typeof badgeVariants>

function Badge({ className, tone, size, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ tone, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
export type { BadgeProps }
