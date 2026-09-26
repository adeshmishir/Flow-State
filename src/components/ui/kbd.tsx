import { cn } from '@/lib/utils'

type KbdProps = {
  children: React.ReactNode
  className?: string | undefined
}

/**
 * A keyboard key, drawn small.
 *
 * Shortcut hints are part of the interface, not documentation: showing `Space`
 * next to the pause control teaches the interaction once, and the same
 * treatment is used wherever a shortcut is offered so they read as one system.
 * Hidden on phones, where there is no keyboard to press.
 */
function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      aria-hidden="true"
      className={cn(
        'h-5 min-w-5 px-1.5 hidden items-center justify-center rounded-xs border border-line bg-surface',
        'sm:inline-flex font-mono text-2xs text-ink-subtle',
        className,
      )}
    >
      {children}
    </kbd>
  )
}

export { Kbd }
export type { KbdProps }
