/** A single block of focused work. */
export type SessionState = 'completed' | 'interrupted'

/** How a finished session came to an end, in the terms a person would use. */
export type SessionOutcome = 'completed' | 'finished-early' | 'discarded'

/* ------------------------------------------------------------------------- *
 * Tasks
 * ------------------------------------------------------------------------- */

export type TaskStatus = 'open' | 'done'

/**
 * A task the user might focus on.
 *
 * Nullable rather than optional fields: `description` and `estimatedMinutes`
 * are always present in the shape and simply hold `null` when unset, so there
 * is no ambiguity between "absent" and "undefined" anywhere downstream. The
 * same goes for the two timestamps — a task is never "half archived".
 *
 * ## Why there is no `active` status
 *
 * Stage 2 had `queued | active | done`. `active` was a fact the *session*
 * already knows, and storing it in a second place meant the two could disagree —
 * a task stuck on "active" with no session running, or a live session pointing
 * at a task marked otherwise. It is now derived at render time from the live
 * session, so it cannot be wrong. Two sources of truth would be one too many.
 *
 * ## Focus time is not stored here
 *
 * "How long have I spent on this?" is answered from the session log, not from a
 * counter on the task. A counter would drift the moment a session were deleted
 * or a log entry quarantined, and would be wrong for every task that predates
 * the counter.
 */
export interface Task {
  id: string
  title: string
  description: string | null
  /** The user's own estimate, in minutes. `null` when they did not give one. */
  estimatedMinutes: number | null
  project: string
  status: TaskStatus
  createdAt: number
  /** When the task was marked done. `null` while it is open. */
  completedAt: number | null
  /**
   * When the task was archived out of the queue. Archived tasks keep their id
   * so history entries referencing them still resolve, and can be restored.
   */
  archivedAt: number | null
}

/**
 * What the setup dialog hands to the workspace. Travels in the URL so the room
 * renders its task server-side and survives a reload without client state.
 */
export interface SessionDraft {
  taskId: string | null
  taskTitle: string
  project: string
  description: string
  minutes: number
}

/* ------------------------------------------------------------------------- *
 * Live session
 * ------------------------------------------------------------------------- */

/**
 * Lifecycle of the session currently on screen.
 *
 * `running` → `paused` → `running` → `completed`. There is deliberately no
 * `idle`: a room either holds a session or holds nothing at all, and "nothing"
 * is expressed by the absence of a record rather than by a fourth state.
 */
export type SessionStatus = 'running' | 'paused' | 'completed'

/** Offered session lengths, in minutes. */
export const SESSION_DURATIONS = [25, 50, 90] as const
export type SessionDuration = (typeof SESSION_DURATIONS)[number]

/**
 * The session in progress.
 *
 * Every field is either immutable for the life of the session or an absolute
 * timestamp. Nothing here is a countdown: the elapsed time is always *derived*
 * from these values, which is what keeps the clock honest across throttled tabs,
 * backgrounded windows and rerenders.
 */
export interface ActiveSession {
  id: string
  taskId: string | null
  /**
   * Denormalised on purpose. A session must render correctly in history long
   * after its task has been archived or deleted, so it carries the words it was
   * about rather than only an id to look up.
   */
  taskTitle: string
  project: string
  description: string
  /** The original plan, in ms. Grows when the user extends a session. */
  plannedMs: number
  status: SessionStatus
  /** Epoch ms of the very first start. */
  startedAt: number
  /** Focused ms banked by every finished run segment. */
  bankedMs: number
  /** Epoch ms the current run segment began. `null` unless running. */
  runStartedAt: number | null
  /** Epoch ms the session was last paused. `null` unless paused. */
  pausedAt: number | null
  /** Focused ms frozen at completion. `null` until completed. */
  finishedMs: number | null
  finishedAt: number | null
  /** Number of times the session was paused. */
  interruptions: number
  notes: string
}

/** How a session came to an end. */
export type SessionEndReason = SessionOutcome

/**
 * A finished session, as written to the local log.
 *
 * Immutable once written. A session that runs to zero and is then extended is
 * still one session, and its history entry is replaced rather than appended to,
 * so `id` is a real primary key and every total derived from this log stays
 * honest.
 */
export interface SessionLogEntry {
  id: string
  taskId: string | null
  taskTitle: string
  project: string
  plannedMinutes: number
  focusedMinutes: number
  interruptions: number
  startedAt: number
  endedAt: number
  reason: SessionEndReason
  notes: string
}

/* ------------------------------------------------------------------------- *
 * Preferences
 * ------------------------------------------------------------------------- */

/**
 * The handful of choices a person makes once.
 *
 * Small on purpose: each field has to earn its place against the alternative of
 * asking again, and each is read in at least two places.
 */
export interface Preferences {
  /** Daily focus target, in minutes. Drives the only progress bar in the app. */
  dailyGoalMinutes: number
  /** Length a session starts at unless the task's own estimate says otherwise. */
  defaultSessionMinutes: SessionDuration
  /** Monday or Sunday, for week boundaries in history and insights. */
  /**
   * `0` is Sunday, `1` is Monday, `6` is Saturday.
   *
   * Saturday is here because it is a real week start across much of Asia, and a
   * product that only offers Sunday and Monday has decided where its users live.
   * Nothing in the app hard-codes a week boundary; this is the only source.
   */
  weekStartsOn: 0 | 1 | 6
}
