import { Suspense } from 'react'
import type { Metadata } from 'next'

import { PageHeader } from '@/components/layout/page-header'
import { PageContainer } from '@/components/motion/page-container'
import { HistoryScreen } from '@/features/history/history-screen'

/**
 * History.
 *
 * The screen is split in two because `useSearchParams` opts a route into
 * client-side rendering for the whole subtree, and the header has no business
 * being a client component. Suspense draws the boundary where that opt-in
 * actually applies, so only the filterable list loses server rendering.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'History',
  description: 'Every session you have logged, searchable and filterable.',
}

export default function HistoryPage() {
  // eslint-disable-next-line react-hooks/purity -- `force-dynamic` renders this once per request and passes the instant down as a prop, so there is no client render to disagree with it.
  const now = Date.now()

  return (
    <PageContainer className="gap-8 flex flex-col">
      <PageHeader
        title="History"
        description="What you actually worked on, and for how long. Everything here came from this device."
      />

      <Suspense fallback={<HistoryFallback />}>
        <HistoryScreen now={now} />
      </Suspense>
    </PageContainer>
  )
}

function HistoryFallback() {
  return (
    <div aria-busy="true" className="gap-4 flex flex-col">
      <div className="h-28 animate-pulse rounded-lg border border-line-subtle" />
      <div className="h-9 animate-pulse rounded-md border border-line-subtle" />
      <div className="h-40 animate-pulse rounded-lg border border-line-subtle" />
    </div>
  )
}
