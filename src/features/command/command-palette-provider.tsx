'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { CommandPalette } from '@/features/command/command-palette'
import { getSession, subscribeToSession } from '@/features/focus/session-store'
import { useIsFocusRoom } from '@/features/focus/use-is-focus-room'

/**
 * Owns the command palette's open state and the global shortcut.
 *
 * Mounted once at the app root. Two things need to agree on `open`, and only a
 * provider can make that true: the ⌘K listener, which may fire from anywhere, and
 * the trigger buttons in the top bar and the sidebar, which exist on different
 * routes. A keydown handler per trigger would be three handlers racing to open
 * the same dialog.
 *
 * ## Shortcut
 *
 * `⌘K` on Apple platforms, `Ctrl-K` everywhere else, which is the convention
 * Linear and Raycast established and people now press without being told.
 *
 * The handler bails out while focus is in a text field, *except* for the
 * shortcut itself. Two reasons: a person typing a task title must not have a
 * palette flash over their work, and pressing ⌘K while typing is unambiguously
 * meant as the palette.
 *
 * The palette is suppressed entirely in the focus room. During a session the
 * screen has one job, and a modal that can appear over it — from a keystroke
 * someone is using to type a note — is a bug, not a feature. The check is a
 * boolean subscription rather than a route match, because what matters is that a
 * session is live, not which URL is in the address bar.
 */

type CommandPaletteContextValue = {
  open: () => void
  toggle: () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null)

function useCommandPalette(): CommandPaletteContextValue {
  const context = useContext(CommandPaletteContext)
  if (context === null) {
    throw new Error('useCommandPalette must be used inside <CommandPaletteProvider>')
  }
  return context
}

type CommandPaletteProviderProps = {
  children: ReactNode
}

function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const [open, setOpen] = useState(false)
  const focusRoom = useIsFocusRoom()

  const openPalette = useCallback(() => setOpen(true), [])
  const toggle = useCallback(() => setOpen((value) => !value), [])

  useEffect(() => {
    if (focusRoom) return undefined

    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return
      // ⌘⇧K is a different gesture, and one that some browser and OS layers
      // already claim.
      if (event.shiftKey || event.altKey) return

      event.preventDefault()
      setOpen((value) => !value)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [focusRoom])

  // A session can start from the palette itself, or from a stale keyboard event
  // that landed in the same tick. Closing from a store *subscription callback*
  // rather than from an effect that watches `focusRoom`: the state change then
  // arrives with the session that caused it, so the palette never renders a frame
  // with `open` still true inside a focus room — and if the room ends, `open` has
  // already been cleared, so the palette does not spring back open unbidden.
  useEffect(() =>
    subscribeToSession(() => {
      if (getSession() !== null) setOpen(false)
    }),
  )

  const value = useMemo(() => ({ open: openPalette, toggle }), [openPalette, toggle])

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {focusRoom ? null : <CommandPalette open={open} onOpenChange={setOpen} />}
    </CommandPaletteContext.Provider>
  )
}

export { CommandPaletteProvider, useCommandPalette }
export type { CommandPaletteContextValue, CommandPaletteProviderProps }
