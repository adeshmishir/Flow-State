'use client'

import Link from 'next/link'

import { LogoMark } from '@/components/brand/logo-mark'
import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
  /** Hides the wordmark, leaving the mark only (collapsed rail). */
  markOnly?: boolean
}

/**
 * Wordmark. "Flow" carries full ink weight and "state" steps back one tone —
 * enough to feel authored, not enough to shout.
 *
 * Client-side only because it renders prefetch links inside the navigation,
 * which is the one part of the shell that must know the current route.
 */
function Logo({ className, markOnly = false }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        'group gap-2 inline-flex items-center rounded-md text-ink',
        'focus-visible:outline-focus focus-visible:outline-2 focus-visible:outline-offset-4',
        className,
      )}
    >
      <LogoMark />
      <span
        className={cn(
          'font-medium text-[0.9375rem] leading-none tracking-[-0.015em] whitespace-nowrap',
          markOnly && 'sr-only',
        )}
      >
        Flow<span className="text-ink-subtle">state</span>
      </span>
    </Link>
  )
}

export { Logo }
export type { LogoProps }
