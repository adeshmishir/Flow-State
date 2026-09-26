'use client'

import { Logo } from '@/components/brand/logo'
import { AppNavLink } from '@/components/layout/app-nav-link'
import { UserMenu } from '@/components/layout/user-menu'
import { CommandPaletteTrigger } from '@/components/layout/command-palette-trigger'
import { mobileNavItems, primaryNavItems } from '@/data/navigation'
import { cn } from '@/lib/utils'

/**
 * Top navigation for phones and tablets.
 *
 * Below `md` it carries identity and the account only — the destinations move
 * to the bottom bar, where a thumb can actually reach them. From `md` up there
 * is room for the destinations inline, so the bottom bar steps aside.
 */
function AppTopbar() {
  return (
    <header
      data-chrome="topbar"
      className="top-0 lg:hidden sticky z-30 border-b border-line bg-canvas"
    >
      <div className="h-14 gap-3 px-5 md:h-16 md:px-7 flex items-center">
        <Logo />

        {/* Destinations stay hidden below `md`, where the bottom bar already
            carries them. From `md` up they move inline — and the row scrolls
            rather than overflowing, because four destinations plus the account
            menu is tight on a 768px tablet. */}
        <nav
          aria-label="Primary"
          className="hide-scrollbar md:flex ml-auto hidden h-full items-stretch overflow-x-auto"
        >
          {primaryNavItems.map((item) => (
            <AppNavLink key={item.to} item={item} variant="bar" />
          ))}
        </nav>

        <div className={cn('gap-1.5 ml-auto flex items-center', 'md:ml-2')}>
          {/* The palette is the only way to reach anything on a phone, where
              there is no ⌘K to press, so the trigger is not desktop-only. */}
          <CommandPaletteTrigger />
          <UserMenu variant="compact" />
        </div>
      </div>
    </header>
  )
}

/**
 * Phone bottom navigation.
 *
 * Deliberately not a squeezed sidebar: a thumb-reachable bar with a top marker
 * for the current destination. Hidden from `md` up, where the top bar takes over.
 */
function MobileTabBar() {
  return (
    <nav
      data-chrome="tabbar"
      aria-label="Sections"
      className="inset-x-0 bottom-0 md:hidden fixed z-30 border-t border-line bg-canvas pb-[env(safe-area-inset-bottom)]"
    >
      {/* Five destinations today, so five equal columns. Deriving the count from
          the list means adding a section cannot silently leave a tab squeezed into
          a four-wide grid — which is exactly the bug a hard-coded `grid-cols-4`
          invites. Each tab still clears the 44px touch target at 360px wide. */}
      <ul
        className="h-14 grid"
        style={{ gridTemplateColumns: `repeat(${mobileNavItems.length}, minmax(0, 1fr))` }}
      >
        {mobileNavItems.map((item) => (
          <li key={item.to} className="flex">
            <AppNavLink item={item} variant="tab" className="flex-1" />
          </li>
        ))}
      </ul>
    </nav>
  )
}

export { AppTopbar, MobileTabBar }
