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
  plannedMinutes: number
  /** Why this is next — one line, shown under the task. */
  reason: string
}
