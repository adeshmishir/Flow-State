import type { Metadata } from 'next'

import { PageHeader } from '@/components/layout/page-header'
import { PageContainer, PageSection } from '@/components/motion/page-container'
import {
  getRecentSessions,
  longestSessionMinutes,
  mockQueuedTask,
  mockTodayProgress,
  mockUser,
  queuedTaskId,
} from '@/data/session-fixtures'
import { NextBlock } from '@/features/home/next-block'
import { RecentActivity } from '@/features/home/recent-activity'
import { TodaySummary } from '@/features/home/today-summary'
import { firstNameOf, formatDuration, formatFullDate, greetingFor, pluralize } from '@/lib/format'

/**
 * The greeting, today's totals and the session log are all relative to the
 * request clock, so this route must not be prerendered at build time. Stage 2
 * replaces the fixtures with real data and this becomes cacheable again.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Today',
  description: 'Your next focus block, today’s progress, and recent sessions.',
}

export default function HomePage() {
  const now = new Date()
  const sessions = getRecentSessions(now)

  const lead = `${formatDuration(mockTodayProgress.focusedMinutes)} in, ${pluralize(
    mockTodayProgress.sessionsCompleted,
    'session',
  )} deep. The next block is yours — one task, no context switching.`

  return (
    <PageContainer className="gap-10 lg:gap-12 flex flex-col">
      <PageSection>
        <PageHeader
          eyebrow={formatFullDate(now)}
          title={`${greetingFor(now)}, ${firstNameOf(mockUser.name)}.`}
          description={lead}
        />
      </PageSection>

      <PageSection>
        <NextBlock task={mockQueuedTask} taskId={queuedTaskId} />
      </PageSection>

      <PageSection className="gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-x-14 xl:gap-x-20 grid">
        <RecentActivity sessions={sessions} now={now} />

        <div className="lg:order-last lg:self-start order-first">
          <TodaySummary
            progress={mockTodayProgress}
            longestBlockMinutes={longestSessionMinutes(sessions)}
          />
        </div>
      </PageSection>
    </PageContainer>
  )
}
