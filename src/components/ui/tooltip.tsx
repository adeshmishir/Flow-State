'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { motion } from 'motion/react'
import { cloneElement, type ReactElement, type ReactNode, type Ref } from 'react'

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
  children: ReactElement<{ ref?: Ref<unknown> | undefined }>
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  /**
   * Passed to the trigger, so a `Tooltip` can sit inside another Radix
   * `asChild` without swallowing that parent's ref. A plain prop rather than
   * `forwardRef` because this is React 19.
   */
  ref?: Ref<unknown> | undefined
}

/**
 * Tooltip with a single, opinionated look. Mounted once via `TooltipProvider`
 * in the app root; a delay is set so it never fires while the pointer is just
 * travelling across the UI.
 *
 * ## Why the ref is forwarded
 *
 * Because this component is what people reach for when they want a tooltip on a
 * button, it tends to end up *inside* another Radix `asChild` — a
 * `DropdownMenuTrigger` wrapping a `Tooltip` wrapping the real button, which is
 * the only way to give an icon-only trigger both a name and a hint.
 *
 * That nesting used to fail silently. `Tooltip` did not forward its ref, so the
 * `DropdownMenuTrigger` cloned an element that could not hold one, had nothing to
 * anchor to, and the menu simply never opened. There was no error to notice.
 * Passing the incoming ref down to the child keeps the composition working, and
 * matches the contract the prop documentation has always claimed.
 */
function Tooltip({
  label,
  children,
  side = 'top',
  align = 'center',
  sideOffset = 8,
  ref,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{cloneElement(children, { ref })}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={12}
          data-slot="tooltip-content"
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