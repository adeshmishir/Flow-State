import type { Metadata } from 'next'

import { PageHeader } from '@/components/layout/page-header'
import { PageContainer } from '@/components/motion/page-container'
import { TaskQueue } from '@/features/tasks/task-queue'

/**
 * The task queue.
 *
 * A Server Component with no data of its own — the queue reads local storage in
 * the browser, so the client island below is the whole screen. `force-dynamic`
 * keeps this route out of the build-time cache, which matters because a cached
 * shell here would ship a stale `now` and a stale greeting.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tasks',
  description: 'What you are working on, and what is next.',
}

export default function TasksPage() {
  // eslint-disable-next-line react-hooks/purity -- `force-dynamic` renders this once per request and passes the instant down as a prop, so there is no client render to disagree with it.
  const now = Date.now()

  return (
    <PageContainer className="gap-8 flex flex-col">
      <PageHeader
        title="Queue"
        description="Ordered by what you want done next. Home always recommends the top of the list."
      />

      <TaskQueue now={now} />
    </PageContainer>
  )
}
