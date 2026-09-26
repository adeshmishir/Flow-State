'use client'

import { Label as LabelPrimitive } from '@radix-ui/react-label'
import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/utils'

type LabelProps = ComponentPropsWithoutRef<typeof LabelPrimitive>

/**
 * Form label. Uppercase and wide-tracked to match the section labels, so form
 * furniture and page furniture read as the same system.
 */
function Label({ className, ...props }: LabelProps) {
  return (
    <LabelPrimitive
      data-slot="label"
      className={cn(
        'font-medium text-2xs tracking-[0.09em] text-ink-muted uppercase select-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}

export { Label }
export type { LabelProps }
