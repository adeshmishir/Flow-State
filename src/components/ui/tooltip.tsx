'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { motion } from 'motion/react'
import type { ReactElement, ReactNode } from 'react'

import { EASE_OUT } from '@/lib/motion'
import { cn } from '@/lib/utils'

function TooltipProvider({ children, delayMs = 250 }: { children: ReactNode; delayMs?: number }) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayMs} skipDelayDuration={400}>
      {children}
    </TooltipPrimitive.Provider>
  )
}

type TooltipProps = {
  /** The tooltip body. Keep it to a few words. */
  label: ReactNode
  /** The trigger. Must forward its ref and accept event handlers. */
  children: ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

/**
 * Tooltip with a single, opinionated look. Mounted once via `TooltipProvider`
 * in the app root; a delay is set so it never fires while the pointer is just
 * travelling across the UI.
 */
function Tooltip({
  label,
  children,
  side = 'top',
  align = 'center',
  sideOffset = 8,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={12}
          className="max-w-64 z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.13, ease: EASE_OUT }}
            className={cn(
              'px-2 py-1 leading-snug rounded-md border border-line bg-overlay text-xs text-ink',
              'shadow-md',
            )}
          >
            {label}
          </motion.div>
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

export { Tooltip, TooltipProvider }
export type { TooltipProps }
