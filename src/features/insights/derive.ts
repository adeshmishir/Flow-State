import { addDays, dayKey, daysBetween, isSameDay, startOfDay, startOfWeek } from '@/lib/dates'
import type { SessionLogEntry, Task } from '@/types/session'

/**
 * Flowstate — derivations
 * ---------------------------------------------------------------------------
 * Every number the product shows about past work, computed here.
 *
 * Why a module of pure functions rather than fields on the records:
 *
 *   • **One answer per question.** "How long have I spent on this task?" is asked
 *     by the queue, by Home, by History and by the command palette. Four
 *     implementations of it is four chances to disagree.
 *   • **Nothing to keep in sync.** A `focusedMinutes` counter on a task has to
 *     survive deleting a session, quarantining a corrupt log, and importing
 *     yesterday's data. A sum over the log cannot be wrong in any of those
 *     cases, because it has no stored copy to fall out of date.
 *   • **Server-safe.** No `'use client'`, no hooks, no storage. The same
 *     function can compute a number during SSR and after hydration, which is
 *     what lets a page render its structure on the server and only its data on
 *     the client.
 *
 * All functions are pure and take `now` explicitly rather than reading the clock,
 * so a caller can compute an entire screen against a single consistent instant.
 */

const MINUTE_MS = 60_000

/** Focus time from one log entry, in ms. */
function focusedMs(entry: SessionLogEntry): number {
  return Math.max(0, entry.focusedMinutes) * MINUTE_MS
}

/** Log entries that happened on the local day containing `ms`. */
export function entriesOnDay(log: readonly SessionLogEntry[], ms: number): SessionLogEntry[] {
  return log.filter((entry) => isSameDay(entry.startedAt, ms))
}

/** Log entries inside the last `days` local days, oldest-inclusive. */
export function entriesInRange(
  log: readonly SessionLogEntry[],
  now: number,
  days: number,
): SessionLogEntry[] {
  const from = addDays(now, -(days - 1))
  return log.filter((entry) => entry.startedAt >= startOfDay(from))
}

export function entriesInWeek(
  log: readonly SessionLogEntry[],
  now: number,
  weekStartsOn: 0 | 1 | 6 = 1,
): SessionLogEntry[] {
  const from = startOfWeek(now, weekStartsOn)
  return log.filter((entry) => entry.startedAt >= from)
}

export function totalFocusedMs(entries: readonly SessionLogEntry[]): number {
  let total = 0
  for (const entry of entries) total += focusedMs(entry)
  return total
}

export function totalFocusedMinutes(entries: readonly SessionLogEntry[]): number {
  return Math.round(totalFocusedMs(entries) / MINUTE_MS)
}

/* ------------------------------------------------------------------------- *
 * Today
 * ------------------------------------------------------------------------- */

export type TodayStats = {
  focusedMinutes: number
  sessionsCompleted: number
  longestBlockMinutes: number
  averageBlockMinutes: number
}

/**
 * Today, in four numbers.
 *
 * A session with no focus time is excluded from the average: a discarded or
 * instantly-abandoned session would otherwise drag a real number toward a
 * meaningless one.
 */
export function todayStats(log: readonly SessionLogEntry[], now: number): TodayStats {
  const entries = entriesOnDay(log, now)
  const withFocus = entries.filter((entry) => entry.focusedMinutes > 0)

  return {
    focusedMinutes: totalFocusedMinutes(entries),
    sessionsCompleted: entries.length,
    longestBlockMinutes: entries.reduce(
      (longest, entry) => Math.max(longest, entry.focusedMinutes),
      0,
    ),
    averageBlockMinutes:
      withFocus.length === 0 ? 0 : Math.round(totalFocusedMinutes(withFocus) / withFocus.length),
  }
}

/**
 * Consecutive days ending today that contain at least one session.
 *
 * Today not counting yet does not break the streak — a streak is a statement
 * about yesterday and before, and resetting it at midnight would mean the number
 * is wrong for most of the day.
 */
export function streakDays(log: readonly SessionLogEntry[], now: number): number {
  if (log.length === 0) return 0

  const days = new Set(log.map((entry) => dayKey(entry.startedAt)))
  let cursor = startOfDay(now)

  if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1)

  let streak = 0
  while (days.has(dayKey(cursor))) {
    streak += 1
    cursor = addDays(cursor, -1)
  }

  return streak
}

/* ------------------------------------------------------------------------- *
 * Series
 * ------------------------------------------------------------------------- */

export type DayPoint = {
  /** Local midnight for the day. */
  dayStart: number
  focusedMinutes: number
  sessions: number
}

/**
 * One point per local day, oldest first, with empty days present as zeroes.
 *
 * Empty days are the point: a chart that only draws the days you worked hides
 * exactly the information a week view exists to show.
 */
export function dailySeries(
  log: readonly SessionLogEntry[],
  now: number,
  days: number,
): DayPoint[] {
  const totals = new Map<number, { minutes: number; sessions: number }>()

  for (const entry of log) {
    if (daysBetween(entry.startedAt, now) >= days) continue
    const key = startOfDay(entry.startedAt)
    const bucket = totals.get(key) ?? { minutes: 0, sessions: 0 }
    bucket.minutes += Math.max(0, entry.focusedMinutes)
    bucket.sessions += 1
    totals.set(key, bucket)
  }

  return Array.from({ length: days }, (_, index) => {
    const dayStart = addDays(now, index - days + 1)
    const bucket = totals.get(dayStart)
    return {
      dayStart,
      focusedMinutes: bucket?.minutes ?? 0,
      sessions: bucket?.sessions ?? 0,
    }
  })
}

/* ------------------------------------------------------------------------- *
 * Tasks
 * ------------------------------------------------------------------------- */

export type TaskFocus = {
  taskId: string
  /** Minutes across every session logged against the task. */
  focusedMinutes: number
  sessions: number
  lastFocusedAt: number
}

/**
 * Focus time per task, from the log.
 *
 * A task that has never been focused is absent rather than present with a zero —
 * the queue only asks this question for tasks it is about to display, and a map
 * with no entry is a cheaper "no" than a scan would be.
 */
export function focusByTask(log: readonly SessionLogEntry[]): Map<string, TaskFocus> {
  const totals = new Map<string, TaskFocus>()

  for (const entry of log) {
    if (entry.taskId === null) continue
    const current = totals.get(entry.taskId) ?? {
      taskId: entry.taskId,
      focusedMinutes: 0,
      sessions: 0,
      lastFocusedAt: 0,
    }
    current.focusedMinutes += Math.max(0, entry.focusedMinutes)
    current.sessions += 1
    current.lastFocusedAt = Math.max(current.lastFocusedAt, entry.startedAt)
    totals.set(entry.taskId, current)
  }

  return totals
}

export function focusedMinutesFor(log: readonly SessionLogEntry[], taskId: string | null): number {
  if (taskId === null) return 0
  return focusByTask(log).get(taskId)?.focusedMinutes ?? 0
}

export type TopTask = {
  id: string
  title: string
  project: string
  focusedMinutes: number
  sessions: number
}

/**
 * The tasks that have absorbed the most focus, newest activity breaking ties.
 *
 * `taskId === null` sessions are ad-hoc — work with no task behind it — and are
 * left out rather than shown as an unnamed bar, because a bar you cannot read
 * is decoration.
 */
export function topTasks(
  log: readonly SessionLogEntry[],
  tasks: readonly Task[],
  limit: number,
): TopTask[] {
  const byId = new Map(tasks.map((task) => [task.id, task]))
  const totals = focusByTask(log)

  return [...totals.values()]
    .map((focus) => {
      const task = byId.get(focus.taskId)
      return {
        id: focus.taskId,
        // A deleted or archived task still has its sessions; fall back to the
        // title the log carried so history never shows a blank bar.
        title: task?.title ?? 'Removed task',
        project: task?.project ?? '',
        focusedMinutes: focus.focusedMinutes,
        sessions: focus.sessions,
      }
    })
    .sort((a, b) => b.focusedMinutes - a.focusedMinutes)
    .slice(0, limit)
}

/* ------------------------------------------------------------------------- *
 * Filtering
 * ------------------------------------------------------------------------- */

export type HistorySort = 'newest' | 'oldest' | 'longest'

export const HISTORY_SORTS: readonly { value: HistorySort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'longest', label: 'Longest' },
] as const

export type HistoryPeriod = 'week' | 'month' | 'all'

export const HISTORY_PERIODS: readonly { value: HistoryPeriod; label: string }[] = [
  { value: 'week', label: '7 days' },
  { value: 'month', label: '30 days' },
  { value: 'all', label: 'All time' },
] as const

export type HistoryFilter = {
  query: string
  period: HistoryPeriod
  /** `null` means every task. */
  taskId: string | null
  sort: HistorySort
}

export function filterHistory(
  log: readonly SessionLogEntry[],
  filter: HistoryFilter,
  now: number,
): SessionLogEntry[] {
  const needle = filter.query.trim().toLowerCase()

  const filtered = log.filter((entry) => {
    if (filter.taskId !== null && entry.taskId !== filter.taskId) return false

    if (filter.period === 'week') {
      if (daysBetween(entry.startedAt, now) >= 7) return false
    } else if (filter.period === 'month') {
      if (daysBetween(entry.startedAt, now) >= 30) return false
    }

    if (needle === '') return true
    return (
      entry.taskTitle.toLowerCase().includes(needle) ||
      entry.project.toLowerCase().includes(needle) ||
      entry.notes.toLowerCase().includes(needle)
    )
  })

  return sortHistory(filtered, filter.sort)
}

export function sortHistory(
  entries: readonly SessionLogEntry[],
  sort: HistorySort,
): SessionLogEntry[] {
  const sorted = [...entries]

  if (sort === 'longest') {
    sorted.sort((a, b) => b.focusedMinutes - a.focusedMinutes || b.startedAt - a.startedAt)
  } else if (sort === 'oldest') {
    sorted.sort((a, b) => a.startedAt - b.startedAt)
  } else {
    sorted.sort((a, b) => b.startedAt - a.startedAt)
  }

  return sorted
}

/** Groups an already date-ordered list into day buckets, newest day first. */
export type DayGroup = {
  key: string
  dayStart: number
  entries: SessionLogEntry[]
}

export function groupByDay(entries: readonly SessionLogEntry[]): DayGroup[] {
  const groups: DayGroup[] = []

  for (const entry of entries) {
    const key = dayKey(entry.startedAt)
    const last = groups[groups.length - 1]

    if (last && last.key === key) {
      last.entries.push(entry)
    } else {
      groups.push({ key, dayStart: startOfDay(entry.startedAt), entries: [entry] })
    }
  }

  return groups
}

/** Distinct task ids in the log, for the history filter menu. */
export function taskIdsInLog(log: readonly SessionLogEntry[]): string[] {
  const seen = new Set<string>()
  const ids: string[] = []

  for (const entry of log) {
    if (entry.taskId === null || seen.has(entry.taskId)) continue
    seen.add(entry.taskId)
    ids.push(entry.taskId)
  }

  return ids
}
