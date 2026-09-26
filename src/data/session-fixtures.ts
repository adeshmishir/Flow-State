import type { Task } from '@/types/session'
import type { UserProfile } from '@/types/user'

/**
 * First-run fixtures.
 *
 * Plain, typed module data — no store, no fetching, no effects. Shaped exactly
 * like the real domain objects, so a later stage can swap the source without
 * touching a single component.
 *
 * ## What is seeded, and what deliberately is not
 *
 * The **task queue** is seeded, because a queue with nothing in it has no
 * opinion about what to do next and the product's most important job is to have
 * one.
 *
 * The **session history is not.** No fake focus minutes, no invented streak, no
 * fictional sessions from "earlier today". Every number Flowstate shows is a
 * number the person in front of it produced, which is the only way a
 * statistics screen can be trusted — and it means the empty states on Home and
 * History are real, designed for, and exercised on first run.
 */

export const mockUser: UserProfile = {
  id: 'usr_mara',
  name: 'Mara Ellison',
  email: 'mara@flowstate.app',
  initials: 'ME',
  plan: 'Personal',
  timeZone: 'Europe/Lisbon',
}

/**
 * Id of the task Home recommends on a first visit.
 *
 * A plain string export so a server page can name a task in a URL or pass it to
 * a client control as a prop, without the server needing to know anything about
 * client state.
 */
export const queuedTaskId = 'tsk_ingest_guide'

/**
 * The starting task queue.
 *
 * A function, not a constant, because `createdAt` is relative to the caller's
 * clock — and one caller is the server, which must never serve a stale "three
 * days ago".
 *
 * The `base` argument exists so the server render and the first client render can
 * produce byte-identical output. Pass a fixed date during SSR; the store swaps in
 * the real one on the first client read, and no field the queue renders differs.
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
      status: 'open',
      createdAt: base - 86_400_000,
      completedAt: null,
      archivedAt: null,
    },
    {
      id: 'tsk_auth_flow',
      title: 'Sketch the authentication flow',
      description: null,
      estimatedMinutes: 25,
      project: 'Platform',
      status: 'open',
      createdAt: base - 172_800_000,
      completedAt: null,
      archivedAt: null,
    },
    {
      id: 'tsk_billing_retry',
      title: 'Rewrite the billing retry logic',
      description: 'Exponential backoff, plus a dead-letter queue for exhausted retries.',
      estimatedMinutes: 90,
      project: 'Billing',
      status: 'open',
      createdAt: base - 259_200_000,
      completedAt: null,
      archivedAt: null,
    },
    {
      id: 'tsk_onboarding_copy',
      title: 'Rework the onboarding flow copy',
      description: null,
      estimatedMinutes: 45,
      project: 'Growth',
      status: 'open',
      createdAt: base - 345_600_000,
      completedAt: null,
      archivedAt: null,
    },
  ]
}
