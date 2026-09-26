'use client'

import { useSyncExternalStore } from 'react'

import {
  MIGRATIONS,
  VERSIONS,
  activeSessionSchema,
  sessionLogSchema,
} from '@/features/persistence/persisted-schemas'
import { createExternalStore } from '@/lib/local-store'
import { STORAGE_KEYS, readPersisted, removePersisted, writePersisted } from '@/lib/persistence'
import { startClock, subscribeToClock } from '@/lib/ticker'
import type {
  ActiveSession,
  SessionDraft,
  SessionEndReason,
  SessionLogEntry,
  SessionStatus,
} from '@/types/session'

/**
 * The session engine.
 *
 * ## Why there is no countdown
 *
 * The obvious implementation keeps a number in state and subtracts a second on
 * an interval. It is wrong in a way that matters for a focus tool:
 *
 *   • it drifts, because every tick is a rounding error that accumulates;
 *   • it stops when the tab is backgrounded, because browsers clamp intervals
 *     in hidden tabs, so a 25 minute session would "finish" minutes late;
 *   • it cannot express "the user was paused for four minutes", so paused time
 *     gets counted as focus time.
 *
 * So this store never holds remaining time. It holds four absolute timestamps
 * and nothing else. Every elapsed value is a pure function of those timestamps
 * and `Date.now()`:
 *
 *     focused = banked + (running ? now - runStartedAt : 0)
 *     remaining = max(0, planned - focused)
 *
 * A throttled tab, a dropped frame, a rerender and a reload all resolve to the
 * same answer, because none of them can change what the clock said. The
 * display layer polls this derivation twice a second through the shared ticker
 * (`lib/ticker.ts`) — the interval is the only moving part, and it only exists
 * while something is looking at the clock.
 *
 * ## Actions are idempotent
 *
 * Every transition checks the current status first, so holding down the pause
 * button, double-clicking finish, or a shortcut firing twice in the same tick
 * cannot drive the session into an impossible state.
 */

const SESSION_KEY = STORAGE_KEYS.session
const LOG_KEY = STORAGE_KEYS.sessionLog

const MINUTE_MS = 60_000

/** The longest log kept locally. Stage 4 replaces this with real storage. */
const MAX_LOG_ENTRIES = 200

const store = createExternalStore<ActiveSession | null>(null)

const logStore = createExternalStore<readonly SessionLogEntry[]>([])

const EMPTY_LOG: readonly SessionLogEntry[] = []

let seeded = false
let logSeeded = false

function createId(): string {
  return `ses_${Math.random().toString(36).slice(2, 10)}`
}

function ensureSeeded(): void {
  if (seeded) return
  seeded = true

  const stored = readPersisted({
    key: SESSION_KEY,
    version: VERSIONS.session,
    schema: activeSessionSchema,
    migrate: MIGRATIONS.session,
    fallback: () => null,
  })

  store.setState(normalizeSession(stored))
}

/**
 * Repairs a session that could not have happened.
 *
 * Storage is the one place untrusted data enters the app, and a session with
 * impossible timestamps would make the clock show something absurd rather than
 * merely wrong. Two invariants matter and both are cheap to restore:
 *
 *   • a `running` session must have a `runStartedAt`, and a paused or completed
 *     one must not — otherwise elapsed time is either frozen or double-counted;
 *   • a session that finished before it started is discarded, not repaired.
 */
function normalizeSession(session: ActiveSession | null): ActiveSession | null {
  if (session === null) return null
  if (session.startedAt > Date.now()) return null

  if (session.status === 'running' && session.runStartedAt === null) {
    return { ...session, status: 'paused', pausedAt: Date.now() }
  }
  if (session.status !== 'running' && session.runStartedAt !== null) {
    return { ...session, runStartedAt: null }
  }
  if (session.status === 'completed' && session.finishedMs === null) {
    return { ...session, finishedMs: session.bankedMs }
  }

  return session
}

function commit(session: ActiveSession | null): void {
  store.setState(session)
  if (session === null) removePersisted(SESSION_KEY)
  else writePersisted(SESSION_KEY, VERSIONS.session, session)
}

/**
 * A running session needs the shared clock; the transition into `running` has to
 * wake it, because a paused session's subscribers are gated off and would
 * otherwise be holding a snapshot the stopped clock never refreshes.
 */
function commitRunning(session: ActiveSession): void {
  commit(session)
  startClock()
}

/* ------------------------------------------------------------------------- *
 * Derivations — the only place time is interpreted
 * ------------------------------------------------------------------------- */

/**
 * Focused milliseconds so far, excluding paused time.
 *
 * When a session completes, the total is frozen into `finishedMs` so a
 * completed session can never drift if the browser clock is adjusted.
 */
export function focusedMs(session: ActiveSession, now: number): number {
  if (session.status === 'completed') return session.finishedMs ?? session.bankedMs
  if (session.status === 'running' && session.runStartedAt !== null) {
    return session.bankedMs + Math.max(0, now - session.runStartedAt)
  }
  return session.bankedMs
}

export function remainingMs(session: ActiveSession, now: number): number {
  if (session.status === 'completed') return 0
  return Math.max(0, session.plannedMs - focusedMs(session, now))
}

/** 0 → 1. Clamped, because a clock adjustment must not produce a negative ring. */
export function sessionProgress(session: ActiveSession, now: number): number {
  if (session.plannedMs <= 0) return 0
  return Math.min(1, Math.max(0, focusedMs(session, now) / session.plannedMs))
}

/* ------------------------------------------------------------------------- *
 * Reads
 * ------------------------------------------------------------------------- */

export function getSession(): ActiveSession | null {
  ensureSeeded()
  return store.getState()
}

/** Subscribe to the session itself. Changes only when the user acts. */
export function useActiveSession(): ActiveSession | null {
  return useSyncExternalStore(
    (listener) => {
      ensureSeeded()
      return store.subscribe(listener)
    },
    getSession,
    () => null,
  )
}

/** Non-React subscription to session changes. */
export function subscribeToSession(listener: () => void): () => void {
  ensureSeeded()
  return store.subscribe(listener)
}

export function getSessionLog(): readonly SessionLogEntry[] {
  if (!logSeeded) {
    logSeeded = true
    logStore.setState(
      readPersisted({
        key: LOG_KEY,
        version: VERSIONS.sessionLog,
        schema: sessionLogSchema,
        migrate: MIGRATIONS.sessionLog,
        fallback: () => EMPTY_LOG,
      }),
    )
  }
  return logStore.getState()
}

export function useSessionLog(): readonly SessionLogEntry[] {
  return useSyncExternalStore(
    (listener) => {
      getSessionLog()
      return logStore.subscribe(listener)
    },
    getSessionLog,
    () => EMPTY_LOG,
  )
}

/** Human label for a status, shared by the room, the live region and toasts. */
export function describeStatus(status: SessionStatus): string {
  if (status === 'running') return 'Running'
  if (status === 'paused') return 'Paused'
  return 'Complete'
}

/* ------------------------------------------------------------------------- *
 * Actions
 * ------------------------------------------------------------------------- */

/**
 * Creates a session and starts it immediately.
 *
 * The room has no "are you sure?" before the clock starts. The setup dialog
 * already asked the two questions that matter, and a confirmation step between
 * that and the work is friction, not safety — the finish and exit paths are
 * where confirmation belongs, because that is where work is lost.
 */
export function startSession(draft: SessionDraft, now: number = Date.now()): ActiveSession {
  const session: ActiveSession = {
    id: createId(),
    taskId: draft.taskId,
    taskTitle: draft.taskTitle,
    project: draft.project,
    description: draft.description,
    plannedMs: draft.minutes * MINUTE_MS,
    status: 'running',
    startedAt: now,
    bankedMs: 0,
    runStartedAt: now,
    pausedAt: null,
    finishedMs: null,
    finishedAt: null,
    interruptions: 0,
    notes: '',
  }

  commitRunning(session)
  return session
}

/** Banks the elapsed run segment, then stops the clock. No-op unless running. */
export function pauseSession(now: number = Date.now()): void {
  const session = getSession()
  if (!session || session.status !== 'running' || session.runStartedAt === null) return

  commit({
    ...session,
    status: 'paused',
    bankedMs: session.bankedMs + Math.max(0, now - session.runStartedAt),
    runStartedAt: null,
    pausedAt: now,
    interruptions: session.interruptions + 1,
  })
}

/** No-op unless paused, so a stray second Space cannot double-start a segment. */
export function resumeSession(now: number = Date.now()): void {
  const session = getSession()
  if (!session || session.status !== 'paused') return

  commitRunning({ ...session, status: 'running', runStartedAt: now, pausedAt: null })
}

/**
 * Puts a session in the log, replacing any earlier entry for the same id.
 *
 * Replacement rather than append because a session can be completed more than
 * once: it reaches zero, the user takes another ten minutes, and it completes
 * again. That is one session, not two, and a log that counted it twice would
 * quietly inflate every total the history view eventually shows.
 */
function recordInLog(entry: SessionLogEntry): void {
  const log = [entry, ...getSessionLog().filter((existing) => existing.id !== entry.id)].slice(
    0,
    MAX_LOG_ENTRIES,
  )
  logStore.setState(log)
  writePersisted(LOG_KEY, VERSIONS.sessionLog, log)
}

/**
 * Ends the session and writes it to the local log.
 *
 * The only place a session stops, whether the plan ran out, the user pressed
 * finish, or the user chose to leave — which is what makes the completion state
 * a single code path rather than three near-identical ones.
 */
export function completeSession(reason: SessionEndReason, now: number = Date.now()): void {
  const before = getSession()
  if (!before || before.status === 'completed') return

  // Anything typed but not yet debounced is written first, and the session is
  // re-read afterwards — otherwise the commit and the log entry below would
  // both snapshot the pre-flush value and drop the note.
  flushNotes?.()
  const session = getSession()
  if (!session || session.status === 'completed') return

  const focused = focusedMs(session, now)

  commit({
    ...session,
    status: 'completed',
    finishedMs: focused,
    finishedAt: now,
    runStartedAt: null,
    pausedAt: session.pausedAt ?? now,
  })

  recordInLog({
    id: session.id,
    taskId: session.taskId,
    taskTitle: session.taskTitle,
    project: session.project,
    plannedMinutes: Math.round(session.plannedMs / MINUTE_MS),
    focusedMinutes: Math.round(focused / MINUTE_MS),
    interruptions: session.interruptions,
    startedAt: session.startedAt,
    endedAt: now,
    reason,
    notes: session.notes,
  })
}

/** Adds time to a completed session and starts it again. */
export function extendSession(extraMinutes: number, now: number = Date.now()): void {
  const session = getSession()
  if (!session || session.status !== 'completed' || extraMinutes <= 0) return

  const banked = session.finishedMs ?? session.bankedMs

  commitRunning({
    ...session,
    status: 'running',
    plannedMs: session.plannedMs + extraMinutes * MINUTE_MS,
    bankedMs: banked,
    runStartedAt: now,
    pausedAt: null,
    finishedMs: null,
    finishedAt: null,
  })
}

/** Ends the session and clears the room. `discarded` writes nothing to the log. */
export function endAndClear(reason: SessionEndReason, now: number = Date.now()): void {
  const session = getSession()
  if (!session) return

  if (reason !== 'discarded') completeSession(reason, now)
  clearSession()
}

/** Drops a finished session without writing anything new to the log. */
export function clearSession(): void {
  commit(null)
}

export function setNotes(notes: string): void {
  const session = getSession()
  if (!session || session.notes === notes) return
  commit({ ...session, notes })
}

/* ------------------------------------------------------------------------- *
 * Notes that have been typed but not yet written
 * ------------------------------------------------------------------------- */

/**
 * The notes panel debounces writes by ~450ms so that holding a key down does not
 * re-render the room on every character. That leaves a window where the text
 * exists only in a textarea.
 *
 * If the session ends inside that window — pressing `F` finishes without ever
 * blurring the field — the note would be dropped on the floor, because
 * `completeSession` reads `session.notes` and has no way to know a newer value
 * exists.
 *
 * Rather than poll, or force a blur, or ask the panel to guess: the panel
 * registers the one thing it can do about it, and completion asks for it first.
 * One registration, cleared on unmount, and the failure mode is closed.
 */
let flushNotes: (() => void) | null = null

export function registerNotesFlush(flush: () => void): () => void {
  flushNotes = flush
  return () => {
    if (flushNotes === flush) flushNotes = null
  }
}

/* ------------------------------------------------------------------------- *
 * Automatic completion
 * ------------------------------------------------------------------------- */

/**
 * Closes a session whose time has run out.
 *
 * Subscribes to the shared clock rather than living inside a component: this is
 * a rule about the session, not about the screen, and it has to hold even if the
 * dial is unmounted. Because the check reads timestamps, a session that ran to
 * zero in a hidden tab is caught on the first tick after the user returns
 * (or the moment the clock resumes, whichever is first).
 */
export function watchForCompletion(): () => void {
  return subscribeToClock(
    () => {
      const session = getSession()
      if (!session || session.status !== 'running') return
      if (remainingMs(session, Date.now()) <= 0) completeSession('completed')
    },
    () => getSession()?.status === 'running',
  )
}
