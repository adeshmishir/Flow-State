'use client'

import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Play } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Kbd } from '@/components/ui/kbd'
import { EndSessionDialog } from '@/features/focus/end-session-dialog'
import { SessionComplete } from '@/features/focus/session-complete'
import { SessionControls } from '@/features/focus/session-controls'
import { SessionDial } from '@/features/focus/session-dial'
import { SessionNotes } from '@/features/focus/session-notes'
import {
  focusedMs as deriveFocusedMs,
  getSession,
  pauseSession,
  resumeSession,
  startSession,
  useActiveSession,
  watchForCompletion,
} from '@/features/focus/session-store'
import { SESSION_SHORTCUTS, useSessionShortcuts } from '@/features/focus/use-session-shortcuts'
import { SessionSetupDialog } from '@/features/session/session-setup-dialog'
import { formatDurationLong, formatFocused } from '@/lib/format'
import { focusDialVariants, focusRoomVariants, focusTitleVariants } from '@/lib/motion'
import type { ActiveSession, SessionDraft } from '@/types/session'

/**
 * The focus room.
 *
 * Everything on screen earns its place, in this order: what you are working on,
 * how long is left, what state you are in, what you can do next. The chrome
 * around it — top bar, tab bar, sidebar labels — is asked to leave by a
 * `data-focus-room` attribute on the app shell (see `styles/focus.css`), because
 * the strongest signal that work has started is that the app stops competing for
 * attention.
 *
 * ## Hydration
 *
 * The room is server-rendered from the draft in the URL, so the first paint
 * already shows the task and the full plan. `previewSession` builds exactly the
 * record the real session will have one frame later, which makes the swap from
 * preview to live session invisible — the dial reads "50:00" in both.
 *
 * ## Rendering cost
 *
 * This component subscribes to the *session*, not to the clock. It re-renders
 * when the user acts — pause, notes, finish — and orders of magnitude less
 * often than the dial, which is the only thing polling the ticker.
 */

type FocusWorkspaceProps = {
  /** Carried in the URL by the setup dialog. `null` when arriving cold. */
  draft: SessionDraft | null
}

const MINUTE_MS = 60_000

/** A session-shaped record for the first frame, before one exists. */
function previewSession(draft: SessionDraft): ActiveSession {
  return {
    id: 'preview',
    taskId: draft.taskId,
    taskTitle: draft.taskTitle,
    project: draft.project,
    description: draft.description,
    plannedMs: draft.minutes * MINUTE_MS,
    status: 'running',
    startedAt: 0,
    bankedMs: 0,
    runStartedAt: null,
    pausedAt: null,
    finishedMs: null,
    finishedAt: null,
    interruptions: 0,
    notes: '',
  }
}

type PendingEnd = {
  mode: 'finish' | 'exit'
  /** Read at the moment the dialog opened, so the copy cannot go stale. */
  session: ActiveSession
  focusedMs: number
}

function FocusWorkspace({ draft }: FocusWorkspaceProps) {
  const router = useRouter()
  const active = useActiveSession()
  const [preview] = useState<ActiveSession | null>(() => (draft ? previewSession(draft) : null))
  const [notesOpen, setNotesOpen] = useState(false)
  const [pendingEnd, setPendingEnd] = useState<PendingEnd | null>(null)
  const [setupOpen, setSetupOpen] = useState(false)

  // A draft supersedes a *finished* session but never a live one: reloading
  // mid-session has to resume, not restart.
  useEffect(() => {
    const existing = getSession()
    if (!existing) {
      if (draft) startSession(draft)
      return
    }
    if (existing.status === 'completed' && draft) startSession(draft)
  }, [draft])

  useEffect(() => watchForCompletion(), [])

  const session = active ?? preview
  const completed = session?.status === 'completed'
  // Notes cannot outlive the session they belong to, and deriving this beats an
  // effect that would set state during render.
  const notesVisible = notesOpen && !completed

  const openEnd = (mode: 'finish' | 'exit') => {
    const current = getSession()
    if (!current) return
    setPendingEnd({ mode, session: current, focusedMs: deriveFocusedMs(current, Date.now()) })
  }

  const toggleRunState = () => {
    if (getSession()?.status === 'running') pauseSession()
    else resumeSession()
  }

  useSessionShortcuts(session !== null && !completed, {
    onToggleRunState: toggleRunState,
    onToggleNotes: () => setNotesOpen((open) => !open),
    onFinish: () => openEnd('finish'),
    onExit: () => openEnd('exit'),
    onEscape: () => {
      if (notesVisible) {
        setNotesOpen(false)
        return
      }
      if (getSession()) openEnd('exit')
      else router.push('/')
    },
  })

  return (
    <motion.div
      variants={focusRoomVariants}
      initial="hidden"
      animate="visible"
      className="px-5 py-10 sm:px-7 sm:py-12 relative flex min-h-dvh flex-col items-center justify-center"
    >
      {/*
        The room's only piece of atmosphere: one soft light behind the dial, so
        the surface reads as lit rather than decorated. No second surface, no
        border, no shadow — the canvas wash already does the rest.
      */}
      <div
        aria-hidden="true"
        className="focus-backdrop inset-0 pointer-events-none absolute -z-10"
      />

      {session === null ? (
        <EmptyRoom onStart={() => setSetupOpen(true)} />
      ) : (
        <div className="max-w-xl gap-8 sm:gap-10 flex w-full flex-col items-center">
          <motion.header variants={focusTitleVariants} className="gap-3 flex flex-col items-center">
            <div className="gap-x-3 gap-y-2 flex flex-wrap items-center justify-center">
              <Eyebrow className="text-ink-muted">Focus</Eyebrow>
              {session.project ? (
                <Badge tone="outline" size="md">
                  {session.project}
                </Badge>
              ) : null}
            </div>

            <h1 className="font-medium tracking-tight sm:text-3xl max-w-[22ch] text-center text-xl text-balance text-ink">
              {session.taskTitle}
            </h1>
          </motion.header>

          <motion.div variants={focusDialVariants} className="w-full">
            <SessionDial session={session} />
          </motion.div>

          {/*
            One polite live region for the whole room, and it only ever carries
            state — never the clock. Announcing a countdown every second would
            make the screen unusable with a screen reader, so the ticking value
            lives in `role="timer"` instead, which is silent by default.
          */}
          <p role="status" className="sr-only">
            {completed
              ? `Session complete. ${formatFocused(session.finishedMs ?? session.bankedMs)} of focus on ${session.taskTitle}.`
              : session.status === 'paused'
                ? 'Session paused.'
                : `Session running. ${formatDurationLong(
                    session.plannedMs / MINUTE_MS,
                  )} of focus ahead.`}
          </p>

          <AnimatePresence mode="wait" initial={false}>
            {completed ? (
              <SessionComplete key="complete" session={session} />
            ) : (
              <motion.div
                key="live"
                className="gap-6 flex w-full flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <SessionControls
                  status={session.status}
                  notesOpen={notesVisible}
                  onToggleRunState={toggleRunState}
                  onToggleNotes={() => setNotesOpen((open) => !open)}
                  onFinish={() => openEnd('finish')}
                  onExit={() => openEnd('exit')}
                  className="max-w-md"
                />

                <SessionNotes
                  key={session.id}
                  open={notesVisible}
                  notes={session.notes}
                  description={session.description}
                  className="max-w-md"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <ShortcutsHint visible={!completed} />
        </div>
      )}

      {pendingEnd ? (
        <EndSessionDialog
          open
          mode={pendingEnd.mode}
          session={pendingEnd.session}
          focusedMs={pendingEnd.focusedMs}
          onOpenChange={(open) => {
            if (!open) setPendingEnd(null)
          }}
        />
      ) : null}

      <SessionSetupDialog open={setupOpen} onOpenChange={setSetupOpen} initialTaskId={null} />
    </motion.div>
  )
}

/** A single, quiet line of shortcut hints. Phones have no keyboard, so it hides. */
function ShortcutsHint({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <ul className="gap-x-4 gap-y-1.5 md:flex hidden flex-wrap items-center justify-center text-2xs text-ink-muted">
      {SESSION_SHORTCUTS.map((shortcut) => (
        <li key={shortcut.keys} className="gap-1.5 flex items-center">
          <Kbd>{shortcut.keys}</Kbd>
          <span>{shortcut.action}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Arriving at `/focus` with nothing queued. Rare, and it should feel like a
 * pause rather than an error: no red, no apology, just the next step.
 */
function EmptyRoom({ onStart }: { onStart: () => void }) {
  return (
    <div className="px-5 flex flex-col items-center text-center">
      <Eyebrow className="text-ink-muted">Focus</Eyebrow>
      <h1 className="mt-4 font-medium tracking-tight sm:text-3xl max-w-[20ch] text-2xl text-balance text-ink">
        The room is empty.
      </h1>
      <p className="mt-3 max-w-[42ch] text-sm text-pretty text-ink-muted">
        A session needs one task and a length of time. Pick both and the door closes behind you.
      </p>

      <div className="mt-8 gap-3 flex flex-col items-center">
        <Button type="button" variant="primary" size="lg" onClick={onStart}>
          <Play aria-hidden="true" fill="currentColor" />
          Start a session
        </Button>
        <Link href="/" className={buttonVariants({ variant: 'ghost', size: 'md' })}>
          <ArrowLeft aria-hidden="true" />
          Back to today
        </Link>
      </div>
    </div>
  )
}

export { FocusWorkspace }
export type { FocusWorkspaceProps }
