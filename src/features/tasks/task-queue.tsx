'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SegmentedRadio } from '@/components/ui/segmented-radio'
import { toast } from '@/components/ui/toast'
import { useSessionLog } from '@/features/focus/session-store'
import { focusByTask, todayStats } from '@/features/insights/derive'
import { TaskComposer } from '@/features/tasks/task-composer'
import { TaskEditDialog } from '@/features/tasks/task-edit-dialog'
import { TaskRow } from '@/features/tasks/task-row'
import {
  archiveTask,
  deleteTaskPermanently,
  moveTaskBefore,
  restoreTask,
  restoreTaskSnapshot,
  setTaskStatus,
  useTasks,
} from '@/features/tasks/task-store'
import { listItemVariants } from '@/lib/motion'
import { pluralize } from '@/lib/format'
import type { Task } from '@/types/session'

/**
 * The task queue.
 *
 * Three lists, in the order they are read: open, done, archived. That order *is*
 * the prioritisation — the top of the open list is what Home recommends, and
 * reordering moves a task up through it.
 *
 * ## Why focused time sits next to a task
 *
 * It is derived from the session log rather than stored on the task, so it cannot
 * disagree with History and it survives archiving or reopening without a repair
 * step. One pass over the log feeds every row instead of a per-row sum.
 *
 * ## Why delete is confirmed and archive is not
 *
 * Deleting a task permanently is the only action in the product that cannot be
 * undone, so it asks first. Completing and archiving are both reversible, so
 * they act immediately and offer Undo in a toast instead of a dialog — a
 * confirmation step on a reversible action is just friction.
 */

type QueueFilter = 'active' | 'done' | 'archived'

const FILTERS: readonly { value: QueueFilter; label: string }[] = [
  { value: 'active', label: 'Queue' },
  { value: 'done', label: 'Done' },
  { value: 'archived', label: 'Archived' },
] as const

/** Position of a task in the list currently on screen, or -1 if it is gone. */
function taskIndex(tasks: readonly Task[], id: string): number {
  return tasks.findIndex((task) => task.id === id)
}

type TaskQueueProps = {
  now: number
}

function TaskQueue({ now }: TaskQueueProps) {
  // One subscription, and the snapshot it hands back is the one everything
  // below is derived from.
  //
  // This used to call `useTasks()` for the re-render and then read `getTasks()`
  // during render, on the reasoning that the getter's fresh array "cannot be a
  // useMemo dependency". That reasoning was backwards: `useTasks` returns the
  // store's own array, whose identity only changes when the store commits, so it
  // is exactly the dependency a memo wants. Reading past it also broke SSR — the
  // browser answered with `localStorage` while the server had rendered the
  // fixture seed, so a reload with a different queue threw a hydration mismatch
  // and React threw the whole list away and rebuilt it.
  const tasks = useTasks()
  const log = useSessionLog()

  const [filter, setFilter] = useState<QueueFilter>('active')
  const [editing, setEditing] = useState<Task | null>(null)
  const [confirming, setConfirming] = useState<Task | null>(null)

  const focus = useMemo(() => focusByTask(log), [log])
  const stats = useMemo(() => todayStats(log, now), [log, now])

  const lists = useMemo(() => {
    const open: Task[] = []
    const done: Task[] = []
    const archived: Task[] = []

    for (const task of tasks) {
      if (task.archivedAt !== null) archived.push(task)
      else if (task.status === 'done') done.push(task)
      else open.push(task)
    }

    return { open, done, archived }
  }, [tasks])

  const shown = filter === 'active' ? lists.open : filter === 'done' ? lists.done : lists.archived

  /**
   * Reorder by *neighbour in the list the person is looking at*.
   *
   * `moveTask(id, ±1)` would offset by one position in the *whole* task list, so
   * moving the third done task up would swap it with a hidden open task and the
   * row would appear not to move at all. Naming the neighbour instead keeps the
   * store's operation and the on-screen list in agreement on every filter.
   *
   * The two directions need different targets, which is the whole subtlety.
   * `moveTaskBefore` means what it says — land immediately *before* a given task
   * — so for a move down the neighbour is the wrong thing to aim at: the row is
   * already immediately before it, and the store helpfully put it straight back
   * where it started. Every "Move down" was a no-op. Moving down therefore aims
   * at the item *after* the neighbour, which is the same statement written from
   * the other side. Moving up already aimed at the neighbour and worked.
   */
  const move = (task: Task, offset: number) => {
    const index = taskIndex(shown, task.id)
    const neighbour = shown[index + offset]
    if (neighbour === undefined) return

    const over = offset < 0 ? neighbour : shown[index + offset + 1]
    if (over === undefined) return

    moveTaskBefore(task.id, over.id)
  }

  const toggleDone = (task: Task) => {
    const done = task.status !== 'done'
    setTaskStatus(task.id, done ? 'done' : 'open')
    if (done) toast.success('Task done', { description: task.title })
  }

  const archive = (task: Task) => {
    archiveTask(task.id)
    toast('Task archived', {
      description: task.title,
      action: { label: 'Undo', onClick: () => restoreTask(task.id) },
    })
  }

  const remove = (task: Task) => {
    const removed = deleteTaskPermanently(task.id)
    if (removed === null) return

    toast('Task deleted', {
      description: task.title,
      action: {
        label: 'Undo',
        // The row is gone, so Undo has to carry the task *and its position* with
        // it. This is the one place a removed task is held in memory, and it is
        // released as soon as the toast is dismissed.
        onClick: () => restoreTaskSnapshot(removed),
      },
    })
  }

  return (
    <div className="gap-7 flex flex-col">
      <div className="gap-4 flex flex-wrap items-end justify-between">
        <SegmentedRadio
          legend="Show"
          name="queue-filter"
          value={filter}
          onValueChange={(value) => setFilter(value as QueueFilter)}
          options={FILTERS}
          className="min-w-0"
        />

        {filter === 'active' ? <TaskComposer /> : null}
      </div>

      {shown.length === 0 ? (
        <EmptyQueue filter={filter} />
      ) : (
        <ul className="divide-y divide-line-subtle border-y border-line-subtle">
          <AnimatePresence initial={false} mode="popLayout">
            {shown.map((task: Task, index: number) => (
              <motion.li
                key={task.id}
                layout="position"
                variants={listItemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <TaskRow
                  task={task}
                  index={index}
                  total={shown.length}
                  focusMinutes={focus.get(task.id)?.focusedMinutes ?? 0}
                  now={now}
                  onEdit={setEditing}
                  onToggleDone={toggleDone}
                  onArchive={archive}
                  onRestore={(t) => restoreTask(t.id)}
                  onDelete={setConfirming}
                  onMove={move}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {filter === 'active' ? (
        <p className="text-xs text-ink-muted">
          {lists.open.length > 0
            ? `${pluralize(lists.open.length, 'task')} open. The top of the list is what Home recommends.`
            : 'Nothing open.'}{' '}
          {stats.focusedMinutes > 0
            ? `${stats.focusedMinutes} min focused today across ${pluralize(
                stats.sessionsCompleted,
                'session',
              )}.`
            : 'No focus logged today yet.'}
        </p>
      ) : null}

      <TaskEditDialog
        task={editing}
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      />

      <ConfirmDialog
        open={confirming !== null}
        title="Delete this task?"
        description={`“${confirming?.title ?? ''}” will be removed from your queue. Sessions you already logged against it stay in your history.`}
        confirmLabel="Delete task"
        onConfirm={() => {
          if (confirming !== null) remove(confirming)
        }}
        onOpenChange={(open) => {
          if (!open) setConfirming(null)
        }}
      />
    </div>
  )
}

type EmptyQueueProps = {
  filter: QueueFilter
}

/**
 * Empty states that say what to do next.
 *
 * Each one is specific to the list it appears in — a generic "no tasks" would be
 * the same words whether you finished everything or archived a year of work, and
 * those are not the same situation.
 */
function EmptyQueue({ filter }: EmptyQueueProps) {
  if (filter === 'done') {
    return (
      <div className="pt-6 border-t border-line-subtle">
        <p className="text-sm text-ink-muted">Nothing finished yet.</p>
        <p className="mt-1.5 text-xs text-ink-muted">
          Completed tasks collect here, with the time you spent on them.
        </p>
      </div>
    )
  }

  if (filter === 'archived') {
    return (
      <div className="pt-6 border-t border-line-subtle">
        <p className="text-sm text-ink-muted">No archived tasks.</p>
        <p className="mt-1.5 text-xs text-ink-muted">
          Archiving takes something out of the queue without deleting its history.
        </p>
      </div>
    )
  }

  return (
    <div className="pt-6 border-t border-line-subtle">
      <p className="text-sm text-ink-muted">Your queue is empty.</p>
      <p className="mt-1.5 max-w-reading text-xs text-ink-muted">
        Add the one thing you want to finish next. A queue of one is a plan; a queue of nine is a
        wish list.
      </p>
    </div>
  )
}

export { TaskQueue }
export type { QueueFilter, TaskQueueProps }
