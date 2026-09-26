'use client'

import { Clock3, Radio } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Surface } from '@/components/ui/surface'
import { StartSessionControls } from '@/features/session/start-session-controls'
import { formatDuration, formatStopwatch } from '@/lib/format'
import type { Task } from '@/types/session'

type NextBlockProps = {
  task: Task | null
  live: boolean
  liveFocusMs: number
}

/**
 * The one thing that matters on this screen: what happens next, and the single
 * action that starts it.
 *
 * Two states, and the order they are checked in is the whole design:
 *
 *   • **A session is live.** Showing "start a session" next to a running timer
 *     would be a lie about what the app is doing, so the card becomes a way back
 *     into the room.
 *   • **There is a task.** The first open task, with its estimate.
 *   • **The queue is empty.** A create affordance, not an apology. Empty is a
 *     normal state for a task list, and a first-run user who deletes the fixtures
 *     has not done anything wrong.
 */
function NextBlock({ task, live, liveFocusMs }: NextBlockProps) {
  if (live) return <LiveBlock liveFocusMs={liveFocusMs} />

  if (task === null) {
    return (
      <Surface className="p-6 sm:p-8">
        <span className="gap-2.5 flex items-center">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-accent shadow-[0_0_0_3px_var(--accent-soft)]"
          />
          <Eyebrow className="text-ink-muted">Next block</Eyebrow>
        </span>

        <h2 className="mt-5 font-medium tracking-tight sm:text-3xl max-w-reading text-2xl text-ink">
          Nothing queued.
        </h2>
        <p className="mt-2 max-w-reading text-sm text-ink-muted">
          Add one thing you want to finish. A queue of one is a plan; a queue of nine is a wish
          list.
        </p>

        <div className="mt-5">
          <Link
            href="/tasks"
            className="focus-visible:outline-focus font-medium rounded-sm text-sm text-ink underline decoration-line-strong underline-offset-4 transition-colors duration-150 ease-standard hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Add a task
          </Link>
        </div>
      </Surface>
    )
  }

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
            {task.project || 'Inbox'}
          </Badge>
        </div>

        <h2 className="mt-5 font-medium tracking-tight sm:text-3xl max-w-reading text-2xl text-ink">
          {task.title}
        </h2>
        {task.description ? (
          <p className="mt-2 max-w-reading text-sm text-ink-muted">{task.description}</p>
        ) : null}

        <p className="mt-5 gap-x-4 gap-y-1 flex flex-wrap items-center text-xs text-ink-secondary">
          <span className="gap-1.5 flex items-center">
            <Clock3 aria-hidden="true" className="size-3.5 shrink-0 text-ink-subtle" />
            {task.estimatedMinutes === null
              ? 'No estimate yet'
              : `${formatDuration(task.estimatedMinutes)} planned`}
          </span>
          <span aria-hidden="true" className="h-3 w-px bg-line" />
          <span>Deep work</span>
        </p>
      </div>

      <div className="px-6 py-4 sm:px-8 gap-2 flex items-center border-t border-line">
        <StartSessionControls taskId={task.id} />
      </div>
    </Surface>
  )
}

/**
 * A running session, seen from outside the room.
 *
 * The elapsed time is computed from the same timestamps as the dial rather than
 * from a stored counter, so this number cannot drift from the one in the room.
 * It is passed in already computed because the parent owns the single `now`.
 */
function LiveBlock({ liveFocusMs }: { liveFocusMs: number }) {
  return (
    <Surface tone="raised" className="overflow-hidden">
      <div className="p-6 sm:p-8">
        <span className="gap-2.5 flex items-center">
          <Radio aria-hidden="true" className="size-3.5 text-accent" />
          <Eyebrow className="text-ink-muted">In progress</Eyebrow>
        </span>

        <p className="tnum mt-5 font-medium tracking-tight sm:text-4xl text-3xl text-ink">
          {formatStopwatch(liveFocusMs)}
        </p>
        <p className="mt-1 text-xs text-ink-muted">focused in this block</p>
      </div>

      <div className="px-6 py-4 sm:px-8 flex items-center border-t border-line">
        <Link
          href="/focus"
          className="focus-visible:outline-focus font-medium rounded-sm text-sm text-ink underline decoration-line-strong underline-offset-4 transition-colors duration-150 ease-standard hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Return to the room
        </Link>
      </div>
    </Surface>
  )
}

export { NextBlock }
export type { NextBlockProps }
