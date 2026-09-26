'use client'

import { Check, Clock3, Play, RotateCcw, Trash2 } from 'lucide-react'
import Link from 'next/link'

import { IconButton } from '@/components/ui/icon-button'
import { Tooltip } from '@/components/ui/tooltip'
import { TaskMenu } from '@/features/tasks/task-menu'
import { formatDuration, formatRelativeDay } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/session'

/**
 * One task in the queue.
 *
 * ## Why buttons and not a checkbox
 *
 * A checkbox implies the work is finished and disappears from view. A task that
 * is done is still a task: it still has history, and it usually comes back
 * within the week. So completion moves the row to a *done* section rather than
 * removing it, and the checkbox is a button that can be undone.
 *
 * ## Why no drag handle
 *
 * Reordering is offered as Move up / Move down inside the overflow menu. A drag
 * handle is faster for a mouse and completely unavailable to a keyboard, to a
 * screen reader, and to anyone with a motor impairment — it would make the one
 * ordering action in the product inaccessible in order to save two clicks. The
 * buttons are also honest about what they do: the order is a real position in a
 * list, not a gesture.
 *
 * Secondary actions live in a menu rather than on the row, because four icon
 * buttons plus a title is a wall of targets on a 360px screen and the title is
 * the only thing that should be obvious.
 *
 * The root is a `div`, not an `li`: the queue animates each row, and an animated
 * wrapper is what needs to be the list item. Putting the `li` here would force a
 * `div` between the `ul` and its children, which is invalid and which screen
 * readers do not forgive.
 */

type TaskRowProps = {
  task: Task
  /** Position within the visible list, for the move actions. */
  index: number
  total: number
  focusMinutes: number
  now: number
  onEdit: (task: Task) => void
  onToggleDone: (task: Task) => void
  onArchive: (task: Task) => void
  onRestore: (task: Task) => void
  onDelete: (task: Task) => void
  onMove: (task: Task, offset: number) => void
}

function TaskRow({
  task,
  index,
  total,
  focusMinutes,
  now,
  onEdit,
  onToggleDone,
  onArchive,
  onRestore,
  onDelete,
  onMove,
}: TaskRowProps) {
  const done = task.status === 'done'
  const archived = task.archivedAt !== null

  return (
    <div className={cn('gap-3 py-3.5 sm:gap-4 flex items-center', archived && 'bg-sunken/60')}>
      <Tooltip label={done ? 'Reopen task' : 'Mark as done'}>
        <button
          type="button"
          onClick={() => onToggleDone(task)}
          aria-pressed={done}
          className={cn(
            'focus-visible:outline-focus size-5 grid shrink-0 place-items-center rounded-full border transition-colors duration-150 ease-standard',
            'focus-visible:outline-2 focus-visible:outline-offset-2',
            done
              ? 'text-white border-success bg-success'
              : 'border-line-strong hover:border-accent hover:bg-accent-soft',
          )}
        >
          {done ? <Check aria-hidden="true" className="size-3" strokeWidth={3} /> : null}
          <span className="sr-only">
            {done ? `Reopen ${task.title}` : `Mark ${task.title} as done`}
          </span>
        </button>
      </Tooltip>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm',
            done ? 'text-ink-muted line-through decoration-line-strong' : 'text-ink',
          )}
        >
          {task.title}
        </p>

        <p className="mt-0.5 gap-x-2 flex flex-wrap items-center text-xs text-ink-subtle">
          <span className="truncate">{task.project || 'Inbox'}</span>
          {task.estimatedMinutes !== null ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="tnum gap-1 flex items-center">
                <Clock3 aria-hidden="true" className="size-3" />
                {formatDuration(task.estimatedMinutes)}
              </span>
            </>
          ) : null}
          {focusMinutes > 0 ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="tnum">{formatDuration(focusMinutes)} focused</span>
            </>
          ) : null}
          {done && task.completedAt !== null ? (
            <>
              <span aria-hidden="true">·</span>
              <span>done {formatRelativeDay(new Date(task.completedAt), new Date(now))}</span>
            </>
          ) : null}
          {archived ? (
            <>
              <span aria-hidden="true">·</span>
              <span>archived</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="gap-1 flex shrink-0 items-center">
        {archived ? (
          <Tooltip label="Restore task">
            <IconButton
              label={`Restore ${task.title}`}
              variant="ghost"
              size="icon-sm"
              onClick={() => onRestore(task)}
            >
              <RotateCcw aria-hidden="true" />
            </IconButton>
          </Tooltip>
        ) : (
          <>
            <Tooltip label={done ? 'Done — reopen to start' : 'Start a session'}>
              {/* A link, not a button: starting is navigation, so it should
                  support open-in-new-tab and middle-click like every other
                  destination in the app. A done task gets a muted, non-interactive
                  placeholder rather than a link, so the column keeps its width. */}
              {done ? (
                <span
                  aria-hidden="true"
                  className="size-8 grid place-items-center rounded-md text-ink-subtle opacity-40"
                >
                  <Play className="size-4" />
                </span>
              ) : (
                <Link
                  href={`/focus?task=${encodeURIComponent(task.id)}&length=${
                    task.estimatedMinutes ?? 50
                  }`}
                  aria-label={`Start a session on ${task.title}`}
                  className="focus-visible:outline-focus size-8 grid place-items-center rounded-md border border-line text-ink-muted transition-colors duration-150 ease-standard hover:border-accent hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <Play aria-hidden="true" className="size-4" fill="currentColor" />
                </Link>
              )}
            </Tooltip>

            <TaskMenu
              task={task}
              index={index}
              total={total}
              onEdit={onEdit}
              onArchive={onArchive}
              onDelete={onDelete}
              onMove={onMove}
            />
          </>
        )}

        {archived ? (
          <Tooltip label="Delete permanently">
            <IconButton
              label={`Delete ${task.title} permanently`}
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(task)}
            >
              <Trash2 aria-hidden="true" />
            </IconButton>
          </Tooltip>
        ) : null}
      </div>
    </div>
  )
}

export { TaskRow }
export type { TaskRowProps }
