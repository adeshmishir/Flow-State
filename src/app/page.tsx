import type { Metadata } from 'next'

import { PageHeader } from '@/components/layout/page-header'
import { PageContainer, PageSection } from '@/components/motion/page-container'
import { mockUser } from '@/data/session-fixtures'
import { HomeScreen } from '@/features/home/home-screen'
import { firstNameOf, formatFullDate, greetingFor } from '@/lib/format'

/**
 * Home.
 *
 * A Server Component that reads the clock once and hands the instant to a single
 * client island. The reason for that split is consistency: the greeting, today's
 * total and the day labels under the activity list all have to agree about what
 * time it is, and a page that read `Date.now()` in four components would be one
 * `setTimeout` away from disagreeing with itself.
 *
 * `force-dynamic` is required and stays: the greeting and the date are relative
 * to the request, and a statically prerendered greeting is confidently wrong
 * every afternoon.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Today',
  description: 'Your next focus block, today’s progress, and recent sessions.',
}

export default function HomePage() {
  // eslint-disable-next-line react-hooks/purity -- `force-dynamic` renders this exactly once per request, and the instant is passed to a client island as a prop, so there is no second render to disagree with this one.
  const now = Date.now()
  const date = new Date(now)

  return (
    <PageContainer className="gap-10 lg:gap-12 flex flex-col">
      <PageSection>
        <PageHeader
          eyebrow={formatFullDate(date)}
          title={`${greetingFor(date)}, ${firstNameOf(mockUser.name)}.`}
          description="One task, one block. Everything else on this page is just what happened last."
        />
      </PageSection>

      <HomeScreen now={now} />
    </PageContainer>
  )
}
