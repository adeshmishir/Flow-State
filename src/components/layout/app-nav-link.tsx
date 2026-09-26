'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import type { NavItem } from '@/types/navigation'

type NavLinkVariant = 'rail' | 'bar' | 'tab'

type NavLinkProps = {
  item: NavItem
  /**
   * `rail` — desktop sidebar. `bar` — tablet top navigation. `tab` — phone
   * bottom bar. One component so all three always agree on the current route.
   */
  variant: NavLinkVariant
  /** Rail only: hide the label because the sidebar is collapsed. */
  showLabel?: boolean
  className?: string
}

const shell = [
  'relative transition-colors duration-150 ease-standard',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
].join(' ')

const surface: Record<NavLinkVariant, string> = {
  rail: 'flex h-9 items-center gap-2.5 rounded-md px-2 text-sm',
  bar: 'flex h-full items-center gap-2 px-3 text-sm',
  tab: 'flex h-full flex-col items-center justify-center gap-1 text-2xs font-medium',
}

const hover: Record<NavLinkVariant, string> = {
  rail: 'hover:bg-ink/5 hover:text-ink',
  bar: 'hover:bg-ink/5 hover:text-ink',
  tab: '',
}

/** The current-destination marker, placed per surface. */
const indicator: Record<NavLinkVariant, string> = {
  rail: 'top-1/2 -left-3 h-4 w-0.5 -translate-y-1/2 rounded-full',
  bar: 'inset-x-2 bottom-0 h-0.5 rounded-full',
  tab: 'inset-x-0 top-0 h-0.5 rounded-full',
}

/**
 * One nav item, rendered for all three navigation surfaces.
 *
 * Client-side because active-route state is only knowable in the browser.
 * `prefetch` is left on for these links deliberately — they are the four
 * destinations of the entire product, so prefetching all of them is a
 * predictable, tiny cost that makes navigation feel instant.
 */
function AppNavLink({ item, variant, showLabel = true, className }: NavLinkProps) {
  const pathname = usePathname()
  const Icon = item.icon
  const isPhoneBar = variant === 'tab'

  const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)

  return (
    <Link
      href={item.to}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        shell,
        surface[variant],
        isActive ? 'font-medium text-ink' : cn('text-ink-secondary', hover[variant]),
        variant === 'rail' && !showLabel && 'px-0 justify-center',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute transition-colors duration-150 ease-standard',
          indicator[variant],
          isActive ? 'bg-accent' : 'bg-transparent',
        )}
      />
      <Icon
        className={cn('shrink-0', isPhoneBar ? 'size-[1.125rem]' : 'size-4')}
        strokeWidth={isActive ? 2 : 1.75}
        aria-hidden="true"
      />
      {showLabel || isPhoneBar ? <span className="truncate">{item.label}</span> : null}
    </Link>
  )
}

export { AppNavLink }
export type { NavLinkProps, NavLinkVariant }
