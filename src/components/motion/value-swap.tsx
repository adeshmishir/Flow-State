'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import { EASE_ENTRANCE } from '@/lib/motion'
import { cn } from '@/lib/utils'

type ValueSwapProps = {
  /** The value being displayed. A change here is what triggers the transition. */
  value: string | number
  children?: ReactNode
  className?: string
}

/**
 * A number that acknowledges it changed.
 *
 * Metrics in this product are read, not watched, so there is no count-up: a
 * number rolling up from zero is a performance, and this is a tool for holding
 * still. Instead the value settles into place — a 4px rise and a fade over
 * 220ms — so that after finishing a session the eye lands on the one figure
 * that actually moved and the rest of the card stays quiet.
 *
 * Keyed on the value, so it only animates when the value really changes and not
 * on every re-render of the parent.
 */
function ValueSwap({ value, children, className }: ValueSwapProps) {
  return (
    <motion.span
      key={String(value)}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE_ENTRANCE }}
      className={cn('inline-block', className)}
    >
      {children ?? value}
    </motion.span>
  )
}

export { ValueSwap }
export type { ValueSwapProps }
