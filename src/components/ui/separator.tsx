'use client'

import { Separator as SeparatorPrimitive } from '@radix-ui/react-separator'
import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/utils'

type SeparatorProps = ComponentPropsWithoutRef<typeof SeparatorPrimitive>

/**
 * Hairline rule. Flowstate uses hairlines instead of shadows to separate
 * regions, so this carries a lot of the layout's visual weight.
 */
function Separator({ className, orientation = 'horizontal', ...props }: SeparatorProps) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        'shrink-0 bg-line',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  )
}

export { Separator }
export type { SeparatorProps }
