import { Clock3 } from 'lucide-react'

import { StartSessionControls } from '@/features/session/start-session-controls'
import { Badge } from '@/components/ui/badge'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Surface } from '@/components/ui/surface'
import { formatDuration } from '@/lib/format'
import type { QueuedTask } from '@/types/session'

type NextBlockProps = {
  task: QueuedTask
  /** Stable id of `task`, so the setup dialog can preselect it. */
  taskId: string
}

/**
 * The one thing that matters on this screen: what happens next, and the single
 * action that starts it. Rendered on the server — only the controls below the
 * hairline hydrate.
 */
function NextBlock({ task, taskId }: NextBlockProps) {
  return (
    <Surface className="overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="gap-x-3 gap-y-2 flex flex-wrap items-center">
          <span className="gap-2.5 flex items-center">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-accent shadow-[0_0_0_3px_var(--accent-soft)]"
            />
            <Eyebrow className="text-ink-muted">Next block</Eyebrow>
          </span>
          <Badge tone="outline" size="md" className="ml-auto">
            {task.project}
          </Badge>
        </div>

        <h2 className="mt-5 font-medium tracking-tight sm:text-3xl max-w-reading text-2xl text-ink">
          {task.title}
        </h2>
        <p className="mt-2 max-w-reading text-sm text-ink-muted">{task.reason}</p>

        <p className="mt-5 gap-x-4 gap-y-1 flex flex-wrap items-center text-xs text-ink-secondary">
          <span className="gap-1.5 flex items-center">
            <Clock3 className="size-3.5 shrink-0 text-ink-subtle" aria-hidden="true" />
            {formatDuration(task.plannedMinutes)} planned
          </span>
          <span aria-hidden="true" className="h-3 w-px bg-line" />
          <span>Deep work</span>
        </p>
      </div>

      <div className="gap-2 px-6 py-4 sm:px-8 flex items-center border-t border-line">
        <StartSessionControls taskId={taskId} />
      </div>
    </Surface>
  )
}

export { NextBlock }
export type { NextBlockProps }
