'use client'

import { Logo } from '@/components/brand/logo'
import { AppNavLink } from '@/components/layout/app-nav-link'
import { UserMenu } from '@/components/layout/user-menu'
import { mobileNavItems, primaryNavItems } from '@/data/navigation'

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

        <nav aria-label="Primary" className="md:flex ml-auto hidden h-full items-stretch">
          {primaryNavItems.map((item) => (
            <AppNavLink key={item.to} item={item} variant="bar" />
          ))}
        </nav>

        <div className="md:ml-2 ml-auto">
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
      <ul className="h-14 grid grid-cols-4">
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
