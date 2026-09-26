import Link from 'next/link'

import { Eyebrow } from '@/components/ui/eyebrow'
import { formatDuration, formatRelativeDay, formatTimeOfDay } from '@/lib/format'
import type { FocusSession } from '@/types/session'

type RecentActivityProps = {
  sessions: readonly FocusSession[]
  /** The clock the labels are relative to. */
  now: Date
}

interface SessionGroup {
  label: string
  sessions: FocusSession[]
}

/** Buckets an already date-ordered list into day groups. */
function groupByDay(sessions: readonly FocusSession[], now: Date): SessionGroup[] {
  const groups: SessionGroup[] = []

  for (const session of sessions) {
    const label = formatRelativeDay(session.startedAt, now)
    const last = groups[groups.length - 1]

    if (last && last.label === label) {
      last.sessions.push(session)
    } else {
      groups.push({ label, sessions: [session] })
    }
  }

  return groups
}

/**
 * A short, honest log of what actually happened. No charts, no percentages:
 * a deep-work tool should be able to answer "what did I do" at a glance.
 */
function RecentActivity({ sessions, now }: RecentActivityProps) {
  const groups = groupByDay(sessions, now)

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
            <h3 className="text-xs text-ink-subtle">{group.label}</h3>
            <ul>
              {group.sessions.map((session) => (
                <li
                  key={session.id}
                  className="gap-3 py-3 sm:gap-5 flex items-center border-t border-line-subtle"
                >
                  <time
                    dateTime={session.startedAt.toISOString()}
                    className="tnum w-14 sm:w-20 shrink-0 text-xs text-ink-subtle"
                  >
                    {formatTimeOfDay(session.startedAt)}
                  </time>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{session.taskTitle}</p>
                    <p className="truncate text-xs text-ink-subtle">
                      {session.project}
                      {session.state === 'interrupted' ? ' · interrupted' : null}
                    </p>
                  </div>

                  <span className="tnum shrink-0 text-sm text-ink-secondary">
                    {formatDuration(session.durationMinutes)}
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
