'use client'

import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'

import { AppToaster } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'

/**
 * The single client boundary for cross-cutting browser concerns.
 *
 * Everything below this component still renders on the server — `children`
 * arrives as pre-rendered output, so the only JavaScript this adds is the
 * motion config, the tooltip context and the toast host.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>{children}</TooltipProvider>
      <AppToaster />
    </MotionConfig>
  )
}
