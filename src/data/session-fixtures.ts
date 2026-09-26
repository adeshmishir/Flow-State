import type { FocusSession, QueuedTask, Task, TodayProgress } from '@/types/session'
import type { UserProfile } from '@/types/user'

/**
 * Stage 1 fixtures.
 *
 * Plain, typed module data — no store, no fetching, no effects. Everything
 * here is shaped exactly like the real domain objects so a later stage can swap
 * the source without touching a single component.
 *
 * Anything date-dependent is produced by a function rather than stored at module
 * scope, so a long-lived server process never serves a stale "today".
 */

function atTime(now: Date, dayOffset: number, hours: number, minutes: number): Date {
  const date = new Date(now)
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hours, minutes, 0, 0)
  return date
}

export const mockUser: UserProfile = {
  id: 'usr_mara',
  name: 'Mara Ellison',
  email: 'mara@flowstate.app',
  initials: 'ME',
  plan: 'Personal',
  timeZone: 'Europe/Lisbon',
}

/**
 * The task waiting in the wings. Doubles as the seed for the first entry in the
 * task queue, so the setup dialog is never empty on a first visit.
 */
export const mockQueuedTask: QueuedTask = {
  title: 'Write the ingest migration guide',
  project: 'Platform docs',
  reason: 'Unblocked by the pipeline review you finished this afternoon',
  plannedMinutes: 50,
}

/**
 * Id of the task the Home page is describing.
 *
 * Exported as a plain string so the server page can hand it to the client setup
 * dialog as a prop. The dialog reads the task queue from local storage, and this
 * is how the two agree on which task "Start a session" means without the server
 * having to know anything about client state.
 */
export const queuedTaskId = 'tsk_ingest_guide'

/**
 * The starting task queue.
 *
 * A function, not a constant, for the same reason as the session fixtures: the
 * relative ordering has to follow the caller's clock, and this module is
 * imported by server routes that must never serve a stale "today".
 */
export function getInitialTasks(now: Date = new Date()): Task[] {
  const base = now.getTime()

  return [
    {
      id: queuedTaskId,
      title: 'Write the ingest migration guide',
      description: 'Cover the backfill order, the dual-write window, and the rollback path.',
      estimatedMinutes: 50,
      project: 'Platform docs',
      status: 'queued',
      createdAt: base - 86_400_000,
    },
    {
      id: 'tsk_auth_flow',
      title: 'Sketch the authentication flow',
      description: null,
      estimatedMinutes: 25,
      project: 'Platform',
      status: 'queued',
      createdAt: base - 172_800_000,
    },
    {
      id: 'tsk_billing_retry',
      title: 'Rewrite the billing retry logic',
      description: 'Exponential backoff, plus a dead-letter queue for exhausted retries.',
      estimatedMinutes: 90,
      project: 'Billing',
      status: 'queued',
      createdAt: base - 259_200_000,
    },
    {
      id: 'tsk_onboarding_copy',
      title: 'Rework the onboarding flow copy',
      description: null,
      estimatedMinutes: 45,
      project: 'Growth',
      status: 'queued',
      createdAt: base - 345_600_000,
    },
  ]
}

export const mockTodayProgress: TodayProgress = {
  focusedMinutes: 120,
  goalMinutes: 180,
  sessionsCompleted: 3,
  streakDays: 12,
}

/**
 * Recent sessions, newest first, anchored to the caller's clock.
 * Grouping and formatting happen in the view, not here.
 */
export function getRecentSessions(now: Date = new Date()): FocusSession[] {
  return [
    {
      id: 'ses_8f21',
      taskTitle: 'Review PR #482 — ingest pipeline',
      project: 'Platform',
      startedAt: atTime(now, 0, 14, 10),
      durationMinutes: 30,
      interruptions: 0,
      state: 'completed',
    },
    {
      id: 'ses_7c04',
      taskTitle: 'Draft the Q3 architecture notes',
      project: 'Platform',
      startedAt: atTime(now, 0, 11, 20),
      durationMinutes: 45,
      interruptions: 1,
      state: 'completed',
    },
    {
      id: 'ses_6a98',
      taskTitle: 'Rewrite the billing retry logic',
      project: 'Billing',
      startedAt: atTime(now, 0, 9, 5),
      durationMinutes: 45,
      interruptions: 0,
      state: 'completed',
    },
    {
      id: 'ses_5b73',
      taskTitle: 'Rework the onboarding flow copy',
      project: 'Growth',
      startedAt: atTime(now, -1, 16, 5),
      durationMinutes: 90,
      interruptions: 2,
      state: 'interrupted',
    },
    {
      id: 'ses_4d15',
      taskTitle: 'Fix the flaky checkout test',
      project: 'Billing',
      startedAt: atTime(now, -2, 10, 30),
      durationMinutes: 25,
      interruptions: 1,
      state: 'completed',
    },
  ]
}

/** Longest single block in the given sessions, in minutes. */
export function longestSessionMinutes(sessions: readonly FocusSession[]): number {
  return sessions.reduce((longest, session) => Math.max(longest, session.durationMinutes), 0)
}
