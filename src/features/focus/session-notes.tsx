'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { Eyebrow } from '@/components/ui/eyebrow'
import { Label } from '@/components/ui/label'
import { setNotes } from '@/features/focus/session-store'
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
 */

const WRITE_DELAY_MS = 450

type SessionNotesProps = {
  open: boolean
  notes: string
  /** The task's own description, shown once as context. Optional. */
  description: string
  className?: string
}

function SessionNotes({ open, notes, description, className }: SessionNotesProps) {
  const [value, setValue] = useState(notes)
  const committed = useRef(notes)

  // Writing is debounced into the session record so that holding down a key does
  // not re-render the room on every character — the store only sees the value
  // once the user pauses. Blur flushes immediately, so nothing is lost by
  // pressing finish straight after typing.
  useEffect(() => {
    if (value === committed.current) return undefined
    const timer = window.setTimeout(() => {
      committed.current = value
      setNotes(value)
    }, WRITE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [value])

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
                <Eyebrow className="text-ink-subtle">Task</Eyebrow>
                <p className="mt-1.5 text-sm text-pretty text-ink-muted">{description}</p>
              </div>
            ) : null}

            <Label htmlFor="session-notes">Notes</Label>
            <textarea
              id="session-notes"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onBlur={() => {
                committed.current = value
                setNotes(value)
              }}
              rows={4}
              maxLength={2000}
              placeholder="What are you about to do? What did you just decide?"
              className={cn(
                'mt-2.5 p-3 w-full resize-y rounded-md border border-line bg-sunken',
                'text-sm text-ink placeholder:text-ink-subtle',
                'transition-[border-color,box-shadow] duration-150 ease-standard',
                'focus-visible:shadow-focus focus-visible:border-accent focus-visible:outline-none',
              )}
            />
            <p className="mt-2 text-2xs text-ink-subtle">
              Saved with the session. Nothing leaves this device.
            </p>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  )
}

export { SessionNotes }
export type { SessionNotesProps }
