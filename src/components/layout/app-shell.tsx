'use client'

import type { ReactNode } from 'react'

import { AppTopbar, MobileTabBar } from '@/components/layout/app-chrome'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { useSidebarCollapsed } from '@/hooks/use-sidebar-collapsed'
import { cn } from '@/lib/utils'

type AppShellProps = {
  children: ReactNode
}

/**
 * Application frame.
 *
 * Three navigation surfaces, each sized to the device it serves:
 *   lg+   persistent 240px rail (collapsible to 64px)
 *   md–lg inline navigation in the top bar
 *   <md   thumb-reachable bottom tab bar
 *
 * Client-side because the rail width and the current route are browser-only
 * facts. `children` still arrives as server-rendered output, so pages inside
 * it are not dragged into the client bundle.
 */
function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, toggleSidebarCollapsed] = useSidebarCollapsed()

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className={cn(
          'px-3 py-2 font-medium sr-only z-50 rounded-md border border-line bg-raised text-sm text-ink shadow-md',
          'focus:top-4 focus:left-4 focus:not-sr-only focus:fixed',
        )}
      >
        Skip to content
      </a>

      <AppSidebar collapsed={sidebarCollapsed} onToggleCollapsed={toggleSidebarCollapsed} />
      <AppTopbar />

      <div
        className={cn(
          'flex-1 transition-[padding] duration-200 ease-standard',
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-60',
        )}
      >
        <main
          id="main-content"
          className={cn(
            'px-5 pt-8 sm:px-7 md:pt-10 mx-auto w-full max-w-shell',
            'md:pb-20 lg:pt-14 pb-[calc(4.5rem+env(safe-area-inset-bottom))]',
          )}
        >
          {children}
        </main>
      </div>

      <MobileTabBar />
    </div>
  )
}

export { AppShell }
export type { AppShellProps }
