import type { SessionLogEntry, Task } from '@/types/session'

/**
 * Flowstate — search
 * ---------------------------------------------------------------------------
 * One matcher, two surfaces: the command palette and the History filter.
 *
 * It is a module of pure functions rather than a component or a hook, for the
 * usual reason — a hook cannot be called from a debounce callback, a command, or
 * a test without ceremony, and the *only* interesting part is the scoring.
 *
 * ## Matching
 *
 * Substring, case-insensitive, ranked rather than filtered:
 *
 *   1. title starts with the query
 *   2. title contains it
 *   3. project contains it
 *   4. body text (description, notes) contains it
 *
 * Ranking matters more than it sounds. Typing "ing" should surface
 * "Ingest migration guide" above three sessions that merely mention ingestion in
 * a note, and a flat `includes` filter would return them in arbitrary order.
 *
 * ## Cost
 *
 * A pass is O(n) over a few hundred short strings — well under a millisecond —
 * which is why the debounce that callers use is about interaction latency rather
 * than about protecting the CPU.
 */

/** Below this, results are noise and the empty state is more honest. */
const MIN_QUERY_LENGTH = 2

export type TaskMatch = {
  kind: 'task'
  task: Task
  score: number
}

export type SessionMatch = {
  kind: 'session'
  entry: SessionLogEntry
  score: number
}

export type SearchResult = TaskMatch | SessionMatch

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase()
}

/** Whether a query is worth running at all. */
export function isSearchable(query: string): boolean {
  return normalizeQuery(query).length >= MIN_QUERY_LENGTH
}

function scoreTitle(title: string, needle: string): number {
  const haystack = title.toLowerCase()
  if (haystack.startsWith(needle)) return 100
  if (haystack.includes(needle)) return 80
  return 0
}

export function searchTasks(tasks: readonly Task[], query: string, limit = 6): TaskMatch[] {
  const needle = normalizeQuery(query)
  if (needle.length < MIN_QUERY_LENGTH) return []

  const matches: TaskMatch[] = []

  for (const task of tasks) {
    const archived = task.archivedAt !== null ? -20 : 0
    const score = scoreTitle(task.title, needle)

    if (score > 0) {
      matches.push({ kind: 'task', task, score: score + archived })
      continue
    }
    if (task.project.toLowerCase().includes(needle)) {
      matches.push({ kind: 'task', task, score: 60 + archived })
      continue
    }
    if (task.description?.toLowerCase().includes(needle)) {
      matches.push({ kind: 'task', task, score: 40 + archived })
    }
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, limit)
}

export function searchSessions(
  log: readonly SessionLogEntry[],
  query: string,
  limit = 6,
): SessionMatch[] {
  const needle = normalizeQuery(query)
  if (needle.length < MIN_QUERY_LENGTH) return []

  const matches: SessionMatch[] = []

  for (const entry of log) {
    let score = scoreTitle(entry.taskTitle, needle)

    if (score === 0 && entry.project.toLowerCase().includes(needle)) score = 60
    if (score === 0 && entry.notes.toLowerCase().includes(needle)) score = 40
    if (score === 0) continue

    matches.push({ kind: 'session', entry, score })
  }

  return matches
    .sort((a, b) => b.score - a.score || b.entry.startedAt - a.entry.startedAt)
    .slice(0, limit)
}

/** Tasks and sessions together, in one ranked list. */
export function searchAll(
  tasks: readonly Task[],
  log: readonly SessionLogEntry[],
  query: string,
  limit = 8,
): SearchResult[] {
  return [...searchTasks(tasks, query, limit), ...searchSessions(log, query, limit)]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Rank anything by a single string, with the same ladder the records use.
 *
 * The palette's navigation actions are not tasks and sessions: they have no
 * project and no body text. But "his" should still put "Open history" first,
 * and duplicating a scoring rule in the component is how two surfaces drift
 * apart. Sharing the ladder keeps one idea of a better match across the app.
 */
export function rankByText<T>(
  items: readonly T[],
  query: string,
  text: (item: T) => string,
  limit = 8,
): T[] {
  const needle = normalizeQuery(query)
  if (needle.length < MIN_QUERY_LENGTH) return []

  return items
    .map((item) => ({ item, score: scoreTitle(text(item), needle) }))
    .filter((scored) => scored.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((scored) => scored.item)
}
