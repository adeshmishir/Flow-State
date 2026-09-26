/** A single block of focused work. */
export type SessionState = 'completed' | 'interrupted'

export interface FocusSession {
  id: string
  /** The one task the session was about. */
  taskTitle: string
  /** Optional grouping, e.g. `"Billing"`. */
  project: string
  startedAt: Date
  /** Minutes actually spent focused. */
  durationMinutes: number
  /** Times the user stepped away before finishing. */
  interruptions: number
  state: SessionState
}

/** Aggregates for the small "today" summary on Home. */
export interface TodayProgress {
  focusedMinutes: number
  goalMinutes: number
  sessionsCompleted: number
  streakDays: number
}

/** The task queued up for the next block. */
export interface QueuedTask {
  title: string
  project: string
  reason: string
  plannedMinutes: number
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
 * timestamp. Nothing here is a countdown: the elapsed time is always
 * *derived* from these values, which is what keeps the clock honest across
 * throttled tabs, backgrounded windows and rerenders.
 */
export interface ActiveSession {
  id: string
  taskId: string | null
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
export type SessionEndReason = 'completed' | 'finished-early' | 'discarded'

/** A finished session, as written to the local log. */
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
 * Tasks
 * ------------------------------------------------------------------------- */

export type TaskStatus = 'queued' | 'active' | 'done'

/**
 * A task the user might focus on.
 *
 * Nullable rather than optional fields: `description` and `estimatedMinutes`
 * are always present in the shape and simply hold `null` when unset, so there
 * is no ambiguity between "absent" and "undefined" anywhere downstream.
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
