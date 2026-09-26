import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/utils'

type EyebrowProps = ComponentPropsWithoutRef<'p'>

/**
 * Section label. Small, uppercase, wide-tracked, quiet. Used above every major
 * region so the eye can scan the page by its labels alone.
 */
function Eyebrow({ className, ...props }: EyebrowProps) {
  return (
    <p
      className={cn('font-medium text-2xs tracking-[0.11em] text-ink-muted uppercase', className)}
      {...props}
    />
  )
}

export { Eyebrow }
export type { EyebrowProps }
