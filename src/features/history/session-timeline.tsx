'use client'

import { FileText } from 'lucide-react'

import { formatDuration, formatTimeOfDay, pluralize } from '@/lib/format'
import type { SessionLogEntry } from '@/types/session'

/**
 * The session log, grouped by day.
 *
 * A timeline rather than a table. The interesting axis of a focus log is *when*,
 * and a table forces the reader to reconstruct time from a date column while
 * re-reading a number that is already on screen. Grouping by day and putting the
 * time first makes the shape of a week legible without a chart.
 *
 * Notes are collapsed behind a native `<details>`. Not an accordion component:
 * a native disclosure is keyboard accessible, works without JavaScript, and is
 * announced correctly by every screen reader, which is not something to reimplement
 * for the privilege of a nicer animation.
 */

type SessionTimelineProps = {
  groups: readonly { key: string; dayStart: number; entries: SessionLogEntry[] }[]
}

function SessionTimeline({ groups }: SessionTimelineProps) {
  return (
    <div className="gap-8 flex flex-col">
      {groups.map((group) => {
        const minutes = group.entries.reduce((sum, entry) => sum + entry.focusedMinutes, 0)

        return (
          <section key={group.key} aria-labelledby={`day-${group.key}`}>
            <div className="gap-4 flex items-baseline justify-between">
              <h3 id={`day-${group.key}`} className="text-xs text-ink-subtle">
                {new Intl.DateTimeFormat('en-US', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                }).format(new Date(group.dayStart))}
              </h3>
              <p className="tnum shrink-0 text-xs text-ink-subtle">
                {formatDuration(minutes)} · {pluralize(group.entries.length, 'session')}
              </p>
            </div>

            <ul className="mt-2 divide-y divide-line-subtle border-t border-line-subtle">
              {group.entries.map((entry) => (
                <SessionRow key={entry.id} entry={entry} />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

type SessionRowProps = {
  entry: SessionLogEntry
}

function SessionRow({ entry }: SessionRowProps) {
  const hasNotes = entry.notes.trim() !== ''

  return (
    <li className="py-4">
      <div className="gap-3 sm:gap-5 flex items-start">
        <time
          dateTime={new Date(entry.startedAt).toISOString()}
          className="tnum w-16 pt-0.5 sm:w-20 shrink-0 text-xs text-ink-subtle"
        >
          {formatTimeOfDay(new Date(entry.startedAt))}
        </time>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-ink">{entry.taskTitle}</p>
          <p className="mt-0.5 gap-x-2 flex flex-wrap items-center text-xs text-ink-subtle">
            <span className="truncate">{entry.project || 'Inbox'}</span>
            <span aria-hidden="true">·</span>
            <span className="tnum">{formatDuration(entry.focusedMinutes)} focused</span>
            {entry.reason === 'discarded' ? (
              <>
                <span aria-hidden="true">·</span>
                <span>discarded</span>
              </>
            ) : null}
            {entry.reason === 'finished-early' ? (
              <>
                <span aria-hidden="true">·</span>
                <span>finished early</span>
              </>
            ) : null}
            {entry.interruptions > 0 ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{pluralize(entry.interruptions, 'pause')}</span>
              </>
            ) : null}
          </p>

          {hasNotes ? (
            <details className="group mt-2.5">
              <summary className="focus-visible:outline-focus gap-1.5 inline-flex cursor-pointer list-none items-center rounded-sm text-xs text-ink-muted transition-colors duration-150 ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2">
                <FileText aria-hidden="true" className="size-3.5" />
                Note
              </summary>
              <p className="mt-2 max-w-prose pl-3 leading-relaxed border-l-2 border-line text-sm whitespace-pre-wrap text-ink-muted">
                {entry.notes}
              </p>
            </details>
          ) : null}
        </div>
      </div>
    </li>
  )
}

export { SessionTimeline }
export type { SessionTimelineProps }
