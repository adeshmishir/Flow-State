'use client'

import { Progress, ProgressIndicator } from '@radix-ui/react-progress'
import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/utils'

type ProgressProps = Omit<ComponentPropsWithoutRef<typeof Progress>, 'value'> & {
  /** 0–100. */
  value: number
  tone?: 'accent' | 'success'
  /** Thickness of the track. */
  thickness?: 'sm' | 'md'
}

const thicknessClasses = { sm: 'h-1', md: 'h-1.5' } as const
const toneClasses = { accent: 'bg-accent', success: 'bg-success' } as const

/**
 * Determinate progress bar. A hairline track by default: on this product a
 * progress indicator is information, not a celebration.
 */
function ProgressBar({
  className,
  value,
  tone = 'accent',
  thickness = 'sm',
  ...props
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <Progress
      data-slot="progress"
      value={clamped}
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-ink/10',
        thicknessClasses[thickness],
        className,
      )}
      {...props}
    >
      <ProgressIndicator
        className={cn(
          'h-full w-full flex-1 transition-transform duration-500 ease-standard',
          toneClasses[tone],
        )}
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </Progress>
  )
}

export { ProgressBar as Progress }
export type { ProgressProps }
