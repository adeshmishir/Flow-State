'use client'

import type { ReactNode } from 'react'

import { AppTopbar, MobileTabBar } from '@/components/layout/app-chrome'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { useIsFocusRoom } from '@/features/focus/use-is-focus-room'
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
 * And one exception: while a session is live, the chrome is asked to leave. The
 * `data-focus-room` attribute is the whole mechanism — see the rules for it in
 * `globals.css`. The rail does not disappear, because a person who has been
 * staring at one task for fifty minutes still needs to know where they are.
 *
 * Client-side because the rail width, the current route and the live session
 * are all browser-only facts. `children` still arrives as server-rendered
 * output, so pages inside it are not dragged into the client bundle.
 */
function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, toggleSidebarCollapsed] = useSidebarCollapsed()
  const focusRoom = useIsFocusRoom()
  const railCollapsed = sidebarCollapsed || focusRoom

  return (
    <div data-focus-room={focusRoom || undefined} className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className={cn(
          'px-3 py-2 font-medium sr-only z-50 rounded-md border border-line bg-raised text-sm text-ink shadow-md',
          'focus:top-4 focus:left-4 focus:not-sr-only focus:fixed',
        )}
      >
        Skip to content
      </a>

      <AppSidebar
        collapsed={railCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
        locked={focusRoom}
      />
      <AppTopbar />

      <div
        className={cn(
          'flex-1 transition-[padding] duration-200 ease-standard',
          railCollapsed ? 'lg:pl-16' : 'lg:pl-60',
        )}
      >
        <main
          id="main-content"
          className={cn(
            'px-5 pt-8 sm:px-7 md:pt-10 lg:pt-14 mx-auto w-full max-w-shell',
            'md:pb-20 pb-[calc(4.5rem+env(safe-area-inset-bottom))]',
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
