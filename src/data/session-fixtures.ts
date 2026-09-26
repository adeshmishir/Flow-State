import type { FocusSession, QueuedTask, TodayProgress } from '@/types/session'
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

/** The task waiting in the wings. Stage 2 turns this into a real queue. */
export const mockQueuedTask: QueuedTask = {
  title: 'Write the ingest migration guide',
  project: 'Platform docs',
  plannedMinutes: 50,
  reason: 'Unblocked by the pipeline review you finished this afternoon',
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
