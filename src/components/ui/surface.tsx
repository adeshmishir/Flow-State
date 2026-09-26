import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/utils'

type SurfaceTone = 'default' | 'sunken' | 'raised' | 'ghost'

const toneClasses: Record<SurfaceTone, string> = {
  default: 'border-line bg-surface',
  sunken: 'border-line-subtle bg-sunken',
  raised: 'border-line bg-raised',
  ghost: 'border-transparent bg-transparent',
}

type SurfaceProps = ComponentPropsWithoutRef<'div'> & {
  tone?: SurfaceTone
  /** Adds a hairline top border only — used to section long pages. */
  divided?: boolean
}

/**
 * The single container primitive in Flowstate.
 *
 * Intentionally not a multi-slot "Card": sections here compose their own
 * internal rhythm, and one configurable surface keeps borders and radii from
 * drifting between them.
 */
function Surface({ className, tone = 'default', divided = false, ...props }: SurfaceProps) {
  return (
    <div
      data-slot="surface"
      data-divided={divided || undefined}
      className={cn('rounded-lg border', toneClasses[tone], divided && 'border-t-line', className)}
      {...props}
    />
  )
}

export { Surface }
export type { SurfaceProps, SurfaceTone }
