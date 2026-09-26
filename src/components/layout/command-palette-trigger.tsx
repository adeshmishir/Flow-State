'use client'

import { Search } from 'lucide-react'

import { IconButton } from '@/components/ui/icon-button'
import { Kbd } from '@/components/ui/kbd'
import { Tooltip } from '@/components/ui/tooltip'
import { useCommandPalette } from '@/features/command/command-palette-provider'
import { cn } from '@/lib/utils'

type CommandPaletteTriggerProps = {
  /** `icon` for the top bar, `rail` for the desktop sidebar. */
  variant?: 'icon' | 'rail'
}

/**
 * Opens the command palette.
 *
 * Exists as a component rather than a bare button because the shortcut is
 * undiscoverable on its own and invisible on a phone — there is no ⌘K key to
 * press and nothing on screen that mentions search. This is the affordance that
 * makes the feature reachable by touch and discoverable by a mouse.
 *
 * Both shortcut names are shown rather than the one for the current platform:
 * detecting macOS at render time means reading `navigator`, which is a
 * hydration mismatch for the sake of one tooltip. The tooltip is the one place
 * in the app that was going to be wrong for half its users, so it says both.
 *
 * `rail` is the sidebar form: a full-width row shaped like a destination, so
 * search sits in the same visual rhythm as Settings and the account menu rather
 * than reading as a stray icon. `icon` is the top bar form.
 */
function CommandPaletteTrigger({ variant = 'icon' }: CommandPaletteTriggerProps) {
  const { open } = useCommandPalette()

  const hint = (
    <span className="gap-1.5 flex items-center">
      Search
      <Kbd>⌘K</Kbd>
      <Kbd>Ctrl K</Kbd>
    </span>
  )

  if (variant === 'rail') {
    return (
      <Tooltip label={hint}>
        <button
          type="button"
          onClick={open}
          className={cn(
            'focus-visible:outline-focus h-9 gap-2.5 px-2 flex w-full items-center rounded-md',
            'text-sm text-ink-secondary transition-colors duration-150 ease-standard',
            'hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2',
          )}
        >
          <Search aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
          <span className="truncate">Search</span>
          <Kbd className="ml-auto">⌘K</Kbd>
        </button>
      </Tooltip>
    )
  }

  return (
    <Tooltip label={hint}>
      <IconButton label="Search and commands" variant="ghost" size="icon-sm" onClick={open}>
        <Search aria-hidden="true" />
      </IconButton>
    </Tooltip>
  )
}

export { CommandPaletteTrigger }
export type { CommandPaletteTriggerProps }
