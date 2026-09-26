'use client'

import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

import { AppToaster } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CommandPaletteProvider } from '@/features/command/command-palette-provider'
import { PersistenceNotice } from '@/features/persistence/persistence-notice'

/**
 * The single client boundary for cross-cutting browser concerns.
 *
 * Everything below this component still renders on the server — `children`
 * arrives as pre-rendered output, so the only JavaScript this adds is the motion
 * config, the tooltip context, the toast host, the command palette and the
 * storage-problem notice.
 *
 * Each of those is here rather than on the pages that need it because all of
 * them are app-wide: the palette shortcut can fire from any route, and storage
 * can fail on any route.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <CommandPaletteProvider>{children}</CommandPaletteProvider>
      </TooltipProvider>
      <PersistenceNotice />
      <AppToaster />
    </MotionConfig>
  )
}
