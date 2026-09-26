'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'

import { Eyebrow } from '@/components/ui/eyebrow'
import { Label } from '@/components/ui/label'
import { registerNotesFlush, setNotes } from '@/features/focus/session-store'
import { focusRevealVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * Session notes.
 *
 * Not a dialog. Notes belong to the room, and a modal would take the clock away
 * from someone whose whole reason for opening notes is to jot a line and get
 * back to work. So it unfolds under the controls, in the same space, and the
 * timer never leaves the screen.
 *
 * The panel is mounted with the session's id as its key by the room, so a
 * different session gets a fresh textarea rather than a synchronising effect
 * that would fight the person typing.
 *
 * ## Saving
 *
 * Writing is debounced by 450ms so holding a key down does not re-render the room
 * on every character. That creates two obligations this component now meets
 * explicitly:
 *
 *   1. **Never lie about state.** A person who looks away and comes back needs
 *      to know whether their words are safe. The status line is a live region
 *      because "Saved" is genuinely useful information to a screen reader too,
 *      and it is `aria-live="polite"` so it never interrupts.
 *   2. **Never lose the last 450ms.** The debounce is registered with the session
 *      store, which asks for a flush before it writes the completion summary.
 *      Blur and unmount flush locally, so every other route out of this panel
 *      ends with the text committed.
 *
 * The store holds a single flush callback, so this is safe even if two panels
 * were ever mounted: the most recent registration wins, and the unmount
 * cleanup only clears if it is still the current one.
 */

const WRITE_DELAY_MS = 450

/** The two states worth showing. "Saving" only appears on a real debounce. */
type SaveState = 'idle' | 'pending' | 'saved'

type SessionNotesProps = {
  open: boolean
  notes: string
  /** The task's own description, shown once as context. Optional. */
  description: string
  className?: string
}

function SessionNotes({ open, notes, description, className }: SessionNotesProps) {
  const [value, setValue] = useState(notes)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const committed = useRef(notes)
  const timer = useRef<number | null>(null)
  // The saved confirmation should fade rather than vanish instantly, but it
  // should also not sit there claiming a save that happened nine minutes ago.
  const savedTimer = useRef<number | null>(null)

  const write = useCallback((next: string) => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }

    if (next === committed.current) {
      setSaveState('idle')
      return
    }

    committed.current = next
    setNotes(next)
    setSaveState('saved')

    if (savedTimer.current !== null) window.clearTimeout(savedTimer.current)
    savedTimer.current = window.setTimeout(() => setSaveState('idle'), 2400)
  }, [])

  useEffect(() => {
    if (value === committed.current) return undefined

    setSaveState('pending')
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => write(value), WRITE_DELAY_MS)

    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current)
        timer.current = null
      }
    }
  }, [value, write])

  // Flush whatever the debounce is still holding, without keeping a copy of the
  // text in a ref that render would have to write into.
  //
  // `useEffectEvent` is the right tool: its identity never changes, so the session
  // store can hold onto it for the life of the session, and yet the body always
  // closes over the current `value`. A `useRef` synced during render does the same
  // job, but React is right to object — refs are not render output, and writing one
  // during render is how a stale value escapes into a callback.
  const flush = useEffectEvent(() => write(value))

  useEffect(() => registerNotesFlush(flush), [])

  // Navigating away mid-debounce is a real way to lose text: the timer is cancelled
  // by this component's cleanup, so anything still pending has to be written on the
  // way out. `write` is a no-op when the text already matches what was committed, so
  // this is safe to call unconditionally on unmount.
  useEffect(() => {
    return () => {
      flush()
      if (savedTimer.current !== null) window.clearTimeout(savedTimer.current)
    }
  }, [])

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.section
          key="notes"
          variants={focusRevealVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn('w-full overflow-hidden', className)}
        >
          <div className="p-4 sm:p-5 rounded-lg border border-line bg-surface text-left">
            {description ? (
              <div className="mb-4 pb-4 border-b border-line">
                <Eyebrow className="text-ink-muted">Task</Eyebrow>
                <p className="mt-1.5 text-sm text-pretty text-ink-muted">{description}</p>
              </div>
            ) : null}

            <Label htmlFor="session-notes">Notes</Label>
            <textarea
              id="session-notes"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              // A DOM handler may close over `value` directly — it is rebuilt on every
              // render anyway, so it is always current, and unlike the store
              // registration above it is not a callback React requires to be stable.
              onBlur={() => write(value)}
              rows={4}
              maxLength={2000}
              placeholder="What are you about to do? What did you just decide?"
              className={cn(
                'mt-2.5 p-3 w-full resize-y rounded-md border border-line-control bg-sunken',
                'text-sm text-ink placeholder:text-ink-muted',
                'transition-[border-color,box-shadow] duration-150 ease-standard',
                'focus-visible:shadow-focus focus-visible:border-accent focus-visible:outline-none',
              )}
            />

            <div className="mt-2 gap-3 flex items-center justify-between">
              <p className="text-2xs text-ink-muted">
                Saved with the session. Nothing leaves this device.
              </p>

              <p
                aria-live="polite"
                className={cn(
                  'tnum shrink-0 text-2xs transition-opacity duration-150 ease-standard',
                  saveState === 'idle' ? 'opacity-0' : 'opacity-100',
                  saveState === 'pending' ? 'text-ink-muted' : 'text-success',
                )}
              >
                {saveState === 'pending' ? 'Saving…' : 'Saved'}
              </p>
            </div>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  )
}

export { SessionNotes }
export type { SessionNotesProps }
