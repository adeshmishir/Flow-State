'use client'

import { ChevronsUpDown, LogOut, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'

import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip } from '@/components/ui/tooltip'
import { mockUser } from '@/data/session-fixtures'
import { cn } from '@/lib/utils'

type UserMenuProps = {
  /**
   * `full` shows name and plan (sidebar footer). `compact` is the avatar-only
   * trigger used where there is no room for text.
   */
  variant: 'full' | 'compact'
  className?: string
}

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

/**
 * Account entry point. Read-only in Stage 1 — the items that need a backend
 * are present but disabled, which is also where the product shows its
 * disabled-state treatment.
 */
function UserMenu({ variant, className }: UserMenuProps) {
  return (
    <DropdownMenu>
      {variant === 'compact' ? (
        <Tooltip label="Account">
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'tap-target rounded-full transition-opacity duration-150 ease-standard hover:opacity-85',
                focusRing,
                className,
              )}
            >
              <Avatar initials={mockUser.initials} size="sm" tone="accent" />
            </button>
          </DropdownMenuTrigger>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'gap-2.5 p-1.5 flex w-full items-center rounded-md text-left',
              'transition-colors duration-150 ease-standard hover:bg-ink/5',
              'focus-visible:outline-focus focus-visible:outline-2 focus-visible:-outline-offset-2',
              className,
            )}
          >
            <Avatar initials={mockUser.initials} size="md" />
            <span className="min-w-0 flex-1">
              <span className="font-medium block truncate text-sm text-ink">{mockUser.name}</span>
              <span className="block truncate text-xs text-ink-muted">{mockUser.plan}</span>
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-ink-subtle" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
      )}

      <DropdownMenuContent className="min-w-60">
        <div className="px-2 py-2">
          <p className="font-medium truncate text-sm text-ink">{mockUser.name}</p>
          <p className="truncate text-xs text-ink-muted">{mockUser.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <SlidersHorizontal aria-hidden="true" />
            Preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="danger" disabled>
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { UserMenu }
export type { UserMenuProps }
