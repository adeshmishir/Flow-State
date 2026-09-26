import type { Metadata } from 'next'

import { RoutePlaceholder } from '@/components/layout/route-placeholder'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Surface } from '@/components/ui/surface'
import { formatDuration } from '@/lib/format'
import { type SearchParams, firstStringParam } from '@/lib/search-params'

export const metadata: Metadata = {
  title: 'Focus',
  description: 'A single room for a single task.',
}

type FocusPageProps = {
  searchParams: Promise<SearchParams>
}

export default async function FocusPage({ searchParams }: FocusPageProps) {
  const params = await searchParams
  const task = firstStringParam(params.task)
  const minutes = Number(firstStringParam(params.minutes))

  return (
    <RoutePlaceholder
      eyebrow="Focus"
      title="One room, one task."
      description="Everything that is not this task is out of the room. No inbox, no feed, no second monitor."
      stage="Stage 2"
      planned={[
        'A session clock you can read at a glance',
        'A locked-in task with the rest of the list hidden',
        'Gentle cues to step away and come back',
        'An interruption log, written by you, not guessed at',
        'A calm end-of-session review',
      ]}
    >
      {task ? (
        <Surface className="p-6 sm:p-8">
          <Eyebrow>Draft handed over from Home</Eyebrow>
          <p className="mt-4 font-medium tracking-tight sm:text-2xl text-xl text-ink">{task}</p>
          <p className="mt-2 text-sm text-ink-muted">
            {Number.isFinite(minutes) && minutes > 0
              ? `${formatDuration(minutes)} planned. The room itself is still to come.`
              : 'The room itself is still to come.'}
          </p>
        </Surface>
      ) : null}
    </RoutePlaceholder>
  )
}
