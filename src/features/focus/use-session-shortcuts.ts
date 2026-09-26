'use client'

import { useEffect, useRef } from 'react'

/**
 * Focus-room keyboard shortcuts.
 *
 * Three rules, and they matter more than the bindings:
 *
 *   1. **Never steal a keystroke from a field.** Space must insert a space
 *      while you are typing a note; `n` must type an `n`. Anything with a
 *      caret gets the key back.
 *   2. **Never fight a dialog.** While a Radix dialog is open it owns Escape,
 *      and it does that better than this hook could.
 *   3. **Never take a modified keystroke.** Cmd/Ctrl/Alt combinations belong to
 *      the browser and the OS.
 *
 * The handler is attached once and reads the latest callbacks through a ref, so
 * a re-render never re-binds a listener.
 */

export type SessionShortcutHandlers = {
  onToggleRunState: () => void
  onToggleNotes: () => void
  onFinish: () => void
  onExit: () => void
  /** Escape, after any dialog has had its chance to handle it. */
  onEscape: () => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'
}

function hasOpenDialog(): boolean {
  return document.querySelector('[role="dialog"][data-state="open"]') !== null
}

export function useSessionShortcuts(enabled: boolean, handlers: SessionShortcutHandlers): void {
  const latest = useRef(handlers)

  useEffect(() => {
    latest.current = handlers
  })

  useEffect(() => {
    if (!enabled) return undefined

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      if (event.key === 'Escape') {
        if (hasOpenDialog()) return
        event.preventDefault()
        latest.current.onEscape()
        return
      }

      if (isTypingTarget(event.target)) return

      // A held key auto-repeats, and one keystroke that toggles must stay one
      // keystroke: holding Space for a second would otherwise flip pause and
      // resume several times over.
      if (event.repeat) return

      switch (event.key) {
        case ' ':
        case 'Spacebar':
          event.preventDefault()
          latest.current.onToggleRunState()
          break
        case 'n':
        case 'N':
          event.preventDefault()
          latest.current.onToggleNotes()
          break
        case 'f':
        case 'F':
          event.preventDefault()
          latest.current.onFinish()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled])
}

/** Shown in the room so the shortcuts are discoverable without a manual. */
export const SESSION_SHORTCUTS: readonly { keys: string; action: string }[] = [
  { keys: 'Space', action: 'Pause or resume' },
  { keys: 'N', action: 'Open or close notes' },
  { keys: 'F', action: 'Finish the session' },
  { keys: 'Esc', action: 'Leave the room' },
]
