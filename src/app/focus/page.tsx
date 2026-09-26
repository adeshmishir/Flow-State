import type { Metadata } from 'next'

import { FocusWorkspace } from '@/features/focus/focus-workspace'
import { sanitizeDraftMinutes } from '@/features/session/session-form-schema'
import { type SearchParams, firstStringParam } from '@/lib/search-params'
import type { SessionDraft } from '@/types/session'

export const metadata: Metadata = {
  title: 'Focus',
  description: 'One room, one task, one block of time.',
}

/**
 * The focus route.
 *
 * Almost nothing happens here. The draft arrives in the URL — written by the
 * setup dialog — and is validated and normalised on the server, so the room's
 * heading, project and plan are all in the first HTML response. Everything with
 * a clock in it is a client leaf underneath.
 *
 * `searchParams` makes this route dynamic, which is correct: there is no such
 * thing as a cached focus room.
 */

type FocusPageProps = {
  searchParams: Promise<SearchParams>
}

function readDraft(params: SearchParams): SessionDraft | null {
  const title = firstStringParam(params.task)?.trim() ?? ''
  if (title === '') return null

  const minutes = sanitizeDraftMinutes(Number(firstStringParam(params.minutes)))

  return {
    taskId: firstStringParam(params.id),
    taskTitle: title.slice(0, 120),
    // A hand-edited URL should not be able to inject an unbounded project label.
    project: (firstStringParam(params.project) ?? '').trim().slice(0, 40),
    description: '',
    minutes: minutes ?? 50,
  }
}

export default async function FocusPage({ searchParams }: FocusPageProps) {
  const draft = readDraft(await searchParams)

  return <FocusWorkspace draft={draft} />
}
