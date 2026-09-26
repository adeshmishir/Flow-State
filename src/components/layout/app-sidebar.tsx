'use client'

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { Logo } from '@/components/brand/logo'
import { AppNavLink } from '@/components/layout/app-nav-link'
import { CommandPaletteTrigger } from '@/components/layout/command-palette-trigger'
import { UserMenu } from '@/components/layout/user-menu'
import { Eyebrow } from '@/components/ui/eyebrow'
import { IconButton } from '@/components/ui/icon-button'
import { Tooltip } from '@/components/ui/tooltip'
import { primaryNavItems, settingsNavItem } from '@/data/navigation'
import { cn } from '@/lib/utils'

type AppSidebarProps = {
  collapsed: boolean
  onToggleCollapsed: () => void
  /**
   * True while a session is live. The rail is pinned to its icon form and the
   * toggle is hidden — offering an expand button that cannot do anything would
   * be a lie told with pixels.
   */
  locked?: boolean
}

/**
 * Desktop navigation rail.
 *
 * Collapses to a 64px icon rail on demand. The width change is a plain CSS
 * transition rather than a layout animation: it follows an explicit user
 * choice, and a spring here would feel like the UI is showing off.
 */
function AppSidebar({ collapsed, onToggleCollapsed, locked = false }: AppSidebarProps) {
  return (
    <aside
      data-collapsed={collapsed || undefined}
      data-chrome="rail"
      className={cn(
        'inset-y-0 left-0 w-60 lg:flex fixed z-30 hidden flex-col border-r border-line bg-canvas',
        'transition-[width] duration-200 ease-standard',
        collapsed && 'w-16',
      )}
    >
      <div className="h-16 px-4 flex shrink-0 items-center">
        <Logo className={collapsed ? 'mx-auto' : ''} markOnly={collapsed} />
        {collapsed || locked ? null : (
          <Tooltip label="Collapse sidebar" side="bottom">
            <IconButton
              label="Collapse sidebar"
              size="icon-sm"
              onClick={onToggleCollapsed}
              className="ml-auto text-ink-subtle"
            >
              <PanelLeftClose aria-hidden="true" />
            </IconButton>
          </Tooltip>
        )}
      </div>

      <nav aria-label="Primary" className="px-3 py-2 flex-1 overflow-y-auto">
        {collapsed ? null : <Eyebrow className="px-2 pt-1 pb-2">Workspace</Eyebrow>}
        <ul className="gap-0.5 flex flex-col">
          {primaryNavItems.map((item) =>
            collapsed ? (
              <li key={item.to}>
                <Tooltip label={item.label} side="right">
                  <div>
                    <AppNavLink item={item} variant="rail" showLabel={false} />
                  </div>
                </Tooltip>
              </li>
            ) : (
              <li key={item.to}>
                <AppNavLink item={item} variant="rail" />
              </li>
            ),
          )}
        </ul>
      </nav>

      <div className="p-3 shrink-0 border-t border-line">
        {collapsed ? (
          <ul className="gap-1 flex flex-col items-center">
            <li>
              <AppNavLink item={settingsNavItem} variant="rail" showLabel={false} />
            </li>
            <li>
              {/* Search is here as well as in the top bar: the rail is the
                  navigation surface on desktop, and a feature reachable only by a
                  keyboard chord is not really in the product. */}
              <CommandPaletteTrigger variant="rail" />
            </li>
            <li>
              <UserMenu variant="compact" />
            </li>
            <li>
              {locked ? null : (
                <Tooltip label="Expand sidebar" side="right">
                  <IconButton
                    label="Expand sidebar"
                    size="icon-sm"
                    onClick={onToggleCollapsed}
                    className="text-ink-muted"
                  >
                    <PanelLeftOpen aria-hidden="true" />
                  </IconButton>
                </Tooltip>
              )}
            </li>
          </ul>
        ) : (
          <>
            <AppNavLink item={settingsNavItem} variant="rail" />
            <div className="mt-1">
              <CommandPaletteTrigger variant="rail" />
            </div>
            <UserMenu variant="full" className="mt-1" />
          </>
        )}
      </div>
    </aside>
  )
}

export { AppSidebar }
export type { AppSidebarProps }
