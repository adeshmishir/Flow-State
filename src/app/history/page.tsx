import type { Metadata } from 'next'

import { RoutePlaceholder } from '@/components/layout/route-placeholder'

export const metadata: Metadata = {
  title: 'History',
  description: 'Every session you have run, kept honestly.',
}

export default function HistoryPage() {
  return (
    <RoutePlaceholder
      eyebrow="History"
      title="Every session, kept honestly."
      description="Not a scoreboard. A record you can actually learn from — what you worked on, for how long, and where the interruptions came from."
      stage="Stage 3"
      planned={[
        'A full session log you can search and filter',
        'Patterns by project, by hour, by weekday',
        'Interrupted sessions separated from finished ones',
        'Notes attached to any session',
        'Export your own data, any time',
      ]}
    />
  )
}
