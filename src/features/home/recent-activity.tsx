'use client'

import { FileText } from 'lucide-react'
import Link from 'next/link'

import { Eyebrow } from '@/components/ui/eyebrow'
import { formatDuration, formatRelativeDay, formatTimeOfDay } from '@/lib/format'
import type { SessionLogEntry } from '@/types/session'

type RecentActivityProps = {
  entries: readonly SessionLogEntry[]
  now: number
}

interface DayGroup {
  label: string
  entries: SessionLogEntry[]
}

/** Buckets an already date-ordered list into day groups. */
function groupByDay(entries: readonly SessionLogEntry[], now: number): DayGroup[] {
  const groups: DayGroup[] = []

  for (const entry of entries) {
    const label = formatRelativeDay(new Date(entry.startedAt), new Date(now))
    const last = groups[groups.length - 1]

    if (last && last.label === label) {
      last.entries.push(entry)
    } else {
      groups.push({ label, entries: [entry] })
    }
  }

  return groups
}

/**
 * A short, honest log of what actually happened. No charts, no percentages: a
 * deep-work tool should be able to answer "what did I do" at a glance.
 *
 * Notes are shown as an indicator rather than inline text. The full note is
 * searchable from History and readable in the palette; six lines of someone's
 * scratchpad between two durations helps nobody.
 */
function RecentActivity({ entries, now }: RecentActivityProps) {
  if (entries.length === 0) {
    return (
      <section aria-labelledby="recent-activity-heading">
        <Eyebrow id="recent-activity-heading">Recent activity</Eyebrow>

        <div className="mt-4 pt-6 border-t border-line-subtle">
          <p className="max-w-reading text-sm text-ink-muted">
            No sessions yet. The first one only needs a task and a length — the numbers here build
            themselves from then on.
          </p>
          <p className="mt-3 text-xs text-ink-muted">
            <Link
              href="/tasks"
              className="focus-visible:outline-focus rounded-sm underline decoration-line-strong underline-offset-4 transition-colors duration-150 ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Set up your queue
            </Link>
          </p>
        </div>
      </section>
    )
  }

  const groups = groupByDay(entries, now)

  return (
    <section aria-labelledby="recent-activity-heading">
      <div className="gap-4 flex items-center justify-between">
        <Eyebrow id="recent-activity-heading">Recent activity</Eyebrow>
        <Link
          href="/history"
          className="focus-visible:outline-focus rounded-sm text-xs text-ink-muted transition-colors duration-150 ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          View all
        </Link>
      </div>

      <div className="mt-4">
        {groups.map((group) => (
          <section key={group.label} className="mt-6 first:mt-0">
            <h3 className="text-xs text-ink-muted">{group.label}</h3>
            <ul>
              {group.entries.map((entry) => (
                <li
                  key={entry.id}
                  className="gap-3 py-3 sm:gap-5 flex items-center border-t border-line-subtle"
                >
                  <time
                    dateTime={new Date(entry.startedAt).toISOString()}
                    className="tnum w-14 sm:w-20 shrink-0 text-xs text-ink-muted"
                  >
                    {formatTimeOfDay(new Date(entry.startedAt))}
                  </time>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{entry.taskTitle}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-muted">
                      {entry.project || 'Inbox'}
                      {entry.notes.trim() === '' ? null : (
                        <>
                          <span aria-hidden="true"> · </span>
                          <FileText aria-hidden="true" className="size-3 inline -translate-y-px" />
                          <span className="sr-only">Has a note</span>
                        </>
                      )}
                    </p>
                  </div>

                  <span className="tnum shrink-0 text-sm text-ink-secondary">
                    {formatDuration(entry.focusedMinutes)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  )
}

export { RecentActivity }
export type { RecentActivityProps }
