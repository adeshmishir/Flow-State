'use client'

import { useTasks, getRecommendedTask } from '@/features/tasks/task-store'
import { useActiveSession, focusedMs } from '@/features/focus/session-store'
import { usePreferences } from '@/features/preferences/preferences-store'
import { useSessionLog } from '@/features/focus/session-store'
import { NextBlock } from '@/features/home/next-block'
import { RecentActivity } from '@/features/home/recent-activity'
import { TodaySummary } from '@/features/home/today-summary'
import { todayStats, streakDays } from '@/features/insights/derive'
import { PageSection } from '@/components/motion/page-container'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/**
 * Home.
 *
 * The page exists to answer three questions, in this order:
 *
 *   1. What should I work on?      → the next block
 *   2. How much have I done today?  → today's position against the goal
 *   3. What have I been doing?     → recent activity
 *
 * One client component, because all three answers come from the same two stores
 * and the same `now`. Splitting them across three subscriptions would mean three
 * clock reads that could disagree across a midnight boundary — and "42 minutes
 * today" next to "no sessions today" is the kind of bug that makes a person stop
 * trusting the app.
 *
 * `now` is passed in from the server rather than read here. That keeps the whole
 * screen on one instant, keeps the surrounding page server-rendered, and removes
 * the most common hydration mismatch in a date-heavy app: two clocks, a few
 * milliseconds apart, disagreeing about what day it is.
 */
function HomeScreen({ now }: { now: number }) {
  // Subscribing to the tasks is what makes the queue live. The recommended task
  // is read through the getter so the same memoised value is used for the card
  // and for its start controls.
  useTasks()
  const session = useActiveSession()
  const log = useSessionLog()
  const preferences = usePreferences()

  const recommended = getRecommendedTask()
  const stats = todayStats(log, now)
  const streak = streakDays(log, now)
  const live = session !== null && session.status !== 'completed'
  const liveFocusMs = live ? focusedMs(session, now) : 0

  return (
    <>
      <PageSection>
        <NextBlock task={recommended} live={live} liveFocusMs={liveFocusMs} />
      </PageSection>

      <PageSection className="gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-x-14 xl:gap-x-20 grid">
        <RecentActivity entries={log.slice(0, 8)} now={now} />

        <div className="lg:order-last lg:self-start order-first">
          <TodaySummary
            focusedMinutes={stats.focusedMinutes}
            sessionsCompleted={stats.sessionsCompleted}
            longestBlockMinutes={stats.longestBlockMinutes}
            averageBlockMinutes={stats.averageBlockMinutes}
            streakDays={streak}
            goalMinutes={preferences.dailyGoalMinutes}
          />

          {stats.focusedMinutes === 0 && log.length === 0 ? (
            <p className="mt-5 text-xs text-ink-muted">
              <Link
                href="/history"
                className="focus-visible:outline-focus gap-1 inline-flex items-center rounded-sm underline decoration-line-strong underline-offset-4 transition-colors duration-150 ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                How Flowstate counts
                <ArrowRight aria-hidden="true" className="size-3" />
              </Link>
            </p>
          ) : null}
        </div>
      </PageSection>
    </>
  )
}

export { HomeScreen }
