'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

import { Eyebrow } from '@/components/ui/eyebrow'
import { Surface } from '@/components/ui/surface'
import { useSessionLog } from '@/features/focus/session-store'
import { HistoryControls, type TaskOption } from '@/features/history/history-controls'
import { SessionTimeline } from '@/features/history/session-timeline'
import { WeekStrip } from '@/features/insights/week-strip'
import {
  entriesInRange,
  filterHistory,
  groupByDay,
  taskIdsInLog,
  totalFocusedMs,
  type HistoryFilter,
  type HistoryPeriod,
  type HistorySort,
} from '@/features/insights/derive'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { formatFocused, pluralize } from '@/lib/format'

/**
 * History.
 *
 * ## The filter is the URL
 *
 * `?q=&period=&task=&sort=` — so a view can be bookmarked, reloaded, or reached
 * from the command palette, and the back button steps through filter changes the
 * way a person expects. It also means this component owns no filter state, so
 * there is nothing to lose on a refresh.
 *
 * ## The week strip is over the last 7 days, whatever the period is
 *
 * It is an orientation aid — "have I been showing up?" — not a chart of the
 * current filter. Changing it with the filters would make it jump on every
 * keystroke, and a chart that flickers is a chart nobody reads.
 *
 * ## Two empty states, not one
 *
 * "No sessions yet" and "nothing matches these filters" are different situations
 * and get different words. Telling someone with a year of history that they have
 * "no sessions" because they typed the wrong filter is the kind of small lie that
 * makes people distrust a search box.
 */

const SEARCH_DEBOUNCE_MS = 140

type HistoryScreenProps = {
  now: number
}

function HistoryScreen({ now }: HistoryScreenProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const log = useSessionLog()

  const filter = useMemo(() => readFilter(searchParams), [searchParams])

  // Only the search term is debounced. Period, task and sort are discrete clicks
  // and should respond on the click.
  const debouncedQuery = useDebouncedValue(filter.query, SEARCH_DEBOUNCE_MS)
  const effective = useMemo<HistoryFilter>(
    () => ({ ...filter, query: debouncedQuery }),
    [filter, debouncedQuery],
  )

  const entries = useMemo(() => filterHistory(log, effective, now), [log, effective, now])
  const groups = useMemo(() => groupByDay(entries), [entries])

  const taskOptions = useMemo<TaskOption[]>(() => {
    const ids = new Set(taskIdsInLog(log))
    const titles = new Map<string, string>()

    for (const entry of log) {
      if (entry.taskId !== null && !titles.has(entry.taskId)) {
        titles.set(entry.taskId, entry.taskTitle)
      }
    }

    return [...ids]
      .map((id) => ({ id, title: titles.get(id) ?? 'Removed task' }))
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [log])

  const update = (patch: Partial<HistoryFilter>) => {
    const next = { ...filter, ...patch }
    router.replace(`${pathname}?${toQueryString(next)}`, { scroll: false })
  }

  const week = useMemo(() => entriesInRange(log, now, 7), [log, now])
  // Milliseconds, not the rounded minutes: a thirty-second session is a session,
  // and `formatFocused` is the one formatter that admits that instead of saying "0m".
  const weekMs = totalFocusedMs(week)

  return (
    <div className="gap-8 flex flex-col">
      <Surface className="p-5 sm:p-6">
        <div className="gap-3 flex flex-wrap items-baseline justify-between">
          <Eyebrow>Last 7 days</Eyebrow>
          <p className="tnum text-xs text-ink-muted">
            {week.length === 0
              ? 'No focus logged'
              : `${formatFocused(weekMs)} across ${pluralize(week.length, 'session')}`}
          </p>
        </div>
        <WeekStrip log={log} now={now} className="mt-5" />
      </Surface>

      <HistoryControls
        filter={filter}
        onFilterChange={update}
        taskOptions={taskOptions}
        resultCount={entries.length}
      />

      {groups.length === 0 ? (
        <EmptyHistory log={log} filter={filter} />
      ) : (
        <SessionTimeline groups={groups} />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------------- *
 * URL <-> filter
 * ------------------------------------------------------------------------- */

const PERIODS: readonly HistoryPeriod[] = ['week', 'month', 'all']
const SORTS: readonly HistorySort[] = ['newest', 'oldest', 'longest']

function readFilter(params: Readonly<URLSearchParams>): HistoryFilter {
  const period = params.get('period')
  const sort = params.get('sort')
  const task = params.get('task')

  return {
    query: params.get('q') ?? '',
    period: PERIODS.includes(period as HistoryPeriod) ? (period as HistoryPeriod) : 'week',
    sort: SORTS.includes(sort as HistorySort) ? (sort as HistorySort) : 'newest',
    taskId: task === null || task === '' ? null : task,
  }
}

function toQueryString(filter: HistoryFilter): string {
  const params = new URLSearchParams()

  if (filter.query.trim() !== '') params.set('q', filter.query)
  if (filter.period !== 'week') params.set('period', filter.period)
  if (filter.taskId !== null) params.set('task', filter.taskId)
  if (filter.sort !== 'newest') params.set('sort', filter.sort)

  // Defaults are left out so a bookmark stays short and readable.
  return params.toString()
}

type EmptyHistoryProps = {
  log: readonly unknown[]
  filter: HistoryFilter
}

function EmptyHistory({ log, filter }: EmptyHistoryProps) {
  if (log.length === 0) {
    return (
      <div className="pt-6 border-t border-line-subtle">
        <p className="text-sm text-ink-muted">Nothing logged yet.</p>
        <p className="mt-1.5 max-w-reading text-xs text-ink-muted">
          Every session you finish or extend lands here, with its notes. The first one takes about a
          minute.
        </p>
      </div>
    )
  }

  const filtered = filter.query.trim() !== '' || filter.taskId !== null || filter.period !== 'all'

  return (
    <div className="pt-6 border-t border-line-subtle">
      <p className="text-sm text-ink-muted">
        {filtered ? 'Nothing matches those filters.' : 'Nothing in this period.'}
      </p>
      <p className="mt-1.5 max-w-reading text-xs text-ink-muted">
        {filtered
          ? 'Try a shorter search, a wider period, or all tasks.'
          : 'Your history starts at your first session. Nothing older is kept locally.'}
      </p>
    </div>
  )
}

export { HistoryScreen }
export type { HistoryScreenProps }
