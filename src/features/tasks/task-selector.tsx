'use client'

import { Plus } from 'lucide-react'

import type { Task } from '@/types/session'
import { formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Task picker.
 *
 * Native radio inputs in a `radiogroup`, not a listbox. The set is short,
 * entirely visible, and keyboard behaviour (arrows, Home/End, type-ahead) is
 * already correct and accessible for free — a custom listbox would mean
 * reimplementing all of it badly.
 *
 * The inputs are visually hidden but not `display: none`, so they keep their
 * place in the tab order, and the label carries the focus ring through
 * `has-[:focus-visible]`.
 */

const NEW_TASK_VALUE = '__new__'

type TaskSelectorProps = {
  tasks: readonly Task[]
  value: string
  onValueChange: (value: string) => void
  /** Errors keyed by field name, so the "pick a task" message can attach. */
  errorId?: string | undefined
}

function TaskSelector({ tasks, value, onValueChange, errorId }: TaskSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Task"
      aria-describedby={errorId}
      className="max-h-60 overflow-y-auto rounded-md border border-line-control"
    >
      <ul className="divide-y divide-line">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            name="session-task"
            value={task.id}
            checked={value === task.id}
            onSelect={onValueChange}
            title={task.title}
            meta={taskMeta(task)}
          />
        ))}

        <TaskRow
          name="session-task"
          value={NEW_TASK_VALUE}
          checked={value === NEW_TASK_VALUE}
          onSelect={onValueChange}
          title="New task"
          meta="Write it now, focus on it in a second"
          icon={<Plus aria-hidden="true" className="size-4" />}
        />
      </ul>
    </div>
  )
}

function taskMeta(task: Task): string {
  const estimate =
    task.estimatedMinutes === null ? 'No estimate' : `${formatDuration(task.estimatedMinutes)}`
  return `${task.project} · ${estimate}`
}

type TaskRowProps = {
  name: string
  value: string
  checked: boolean
  onSelect: (value: string) => void
  title: string
  meta: string
  icon?: React.ReactNode
}

function TaskRow({ name, value, checked, onSelect, title, meta, icon }: TaskRowProps) {
  const id = `session-task-${value}`

  return (
    <li>
      <label
        htmlFor={id}
        className={cn(
          'gap-3 px-3.5 py-3 flex cursor-pointer items-center',
          'transition-colors duration-150 ease-standard',
          'hover:bg-ink/4',
          'has-[:focus-visible]:outline-focus has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2',
          checked && 'bg-accent-soft/60',
        )}
      >
        <input
          id={id}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onSelect(value)}
          className="sr-only"
        />

        <span
          aria-hidden="true"
          className={cn(
            'size-4 grid shrink-0 place-items-center rounded-full border transition-colors duration-150',
            checked ? 'border-accent' : 'border-line-control',
          )}
        >
          <span
            className={cn(
              'size-1.5 rounded-full bg-accent transition-transform duration-150 ease-standard',
              checked ? 'scale-100' : 'scale-0',
            )}
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="gap-2 flex items-center">
            {icon}
            <span className="font-medium truncate text-sm text-ink">{title}</span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-ink-muted">{meta}</span>
        </span>
      </label>
    </li>
  )
}

export { NEW_TASK_VALUE, TaskSelector }
export type { TaskSelectorProps }
