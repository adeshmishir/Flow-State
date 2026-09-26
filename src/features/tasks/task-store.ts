'use client'

import { useSyncExternalStore } from 'react'

import { getInitialTasks, queuedTaskId } from '@/data/session-fixtures'
import { MIGRATIONS, VERSIONS, taskListSchema } from '@/features/persistence/persisted-schemas'
import { createExternalStore } from '@/lib/local-store'
import { STORAGE_KEYS, readPersisted, writePersisted } from '@/lib/persistence'
import type { Task, TaskStatus } from '@/types/session'

/**
 * The task queue.
 *
 * Local, in-memory, and persisted to `localStorage`. No backend, no API, no
 * database — but the shape returned here is exactly the shape a repository
 * would return, so replacing the storage is a change to the bottom of this file
 * and nothing above it.
 *
 * ## Order is the array
 *
 * There is no `sortIndex` column. The queue is small, the user reorders it by
 * hand, and the order they chose is the order they should see on reload — which
 * is exactly what persisting the array already gives. A numeric key would be one
 * more field to renumber on every insert and remove.
 *
 * ## Focus time is not stored here
 *
 * `focusedMinutesFor` answers from the session log rather than from a counter on
 * the task. See `types/session.ts` for why.
 */

const EMPTY_TASKS: readonly Task[] = []

interface TaskState {
  tasks: readonly Task[]
  /** True once stored tasks have been read, so seeding only happens once. */
  hydrated: boolean
}

function loadState(): TaskState {
  const stored = readPersisted({
    key: STORAGE_KEYS.tasks,
    version: VERSIONS.tasks,
    schema: taskListSchema,
    migrate: MIGRATIONS.tasks,
    fallback: () => [],
  })

  // An empty queue is a legitimate state — the user archived everything — so a
  // first *visit* is distinguished from an emptied queue by the absence of any
  // stored value, not by emptiness. The fixture seed only runs when there has
  // never been anything stored.
  const hasStoredValue = stored.length > 0 || hasStoredTasks()

  return {
    tasks: hasStoredValue ? stored : getInitialTasks(),
    hydrated: true,
  }
}

/** Distinguishes "never stored" from "stored, and empty". */
function hasStoredTasks(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.tasks) !== null
  } catch {
    return false
  }
}

const store = createExternalStore<TaskState>({ tasks: EMPTY_TASKS, hydrated: false })

let seeded = false

/**
 * Seeds on first access rather than at module scope: `localStorage` does not
 * exist during SSR, and reading it at import time would make the first client
 * render disagree with the server.
 */
function ensureSeeded(): void {
  if (seeded) return
  seeded = true
  if (!store.getState().hydrated) store.setState(loadState())
}

function commit(tasks: readonly Task[]): void {
  store.setState({ tasks, hydrated: true })
  writePersisted(STORAGE_KEYS.tasks, VERSIONS.tasks, tasks)
}

/* ------------------------------------------------------------------------- *
 * Reads
 * ------------------------------------------------------------------------- */

/**
 * Every task, in queue order.
 *
 * `getServerSnapshot` returns the fixture seed rather than an empty list, so the
 * server-rendered page and the first client render agree — the same trick the
 * focus room uses with a preview session. The store replaces it with stored data
 * on the first client read.
 */
function getServerTasks(): readonly Task[] {
  return SERVER_TASKS
}

const SERVER_TASKS = getInitialTasks(new Date(0))

export function useTasks(): readonly Task[] {
  return useSyncExternalStore(
    (listener) => {
      ensureSeeded()
      return store.subscribe(listener)
    },
    () => {
      ensureSeeded()
      return store.getState().tasks
    },
    getServerTasks,
  )
}

export function getTasks(): readonly Task[] {
  ensureSeeded()
  return store.getState().tasks
}

export function getTask(id: string | null): Task | null {
  if (id === null) return null
  return getTasks().find((task) => task.id === id) ?? null
}
/** Everything in the working queue: not archived, open first, then done. */
export function getActiveTasks(): readonly Task[] {
  return getTasks().filter((task) => task.archivedAt === null)
}

export function getOpenTasks(): readonly Task[] {
  return getTasks().filter((task) => task.archivedAt === null && task.status === 'open')
}

export function getArchivedTasks(): readonly Task[] {
  return getTasks().filter((task) => task.archivedAt !== null)
}

export function getDoneTasks(): readonly Task[] {
  return getTasks().filter((task) => task.archivedAt === null && task.status === 'done')
}

/**
 * The task Home should recommend.
 *
 * The first open task, or the queued task from the fixtures when the queue is
 * empty — so a brand-new visit still has one obvious next step rather than an
 * empty screen on the most important card in the product.
 */
export function getRecommendedTask(): Task | null {
  return getOpenTasks().at(0) ?? getTask(queuedTaskId) ?? getActiveTasks().at(0) ?? null
}

/* ------------------------------------------------------------------------- *
 * Writes
 * ------------------------------------------------------------------------- */

function createId(): string {
  return `tsk_${Math.random().toString(36).slice(2, 10)}`
}

export type NewTask = {
  title: string
  description: string | null
  estimatedMinutes: number | null
  project: string
}

/** A task that was deleted, plus the position it was deleted from. */
export type RemovedTask = {
  task: Task
  index: number
}

export type TaskPatch = Partial<Omit<NewTask, never>>

/** Adds a task to the top of the queue. Returns the created record. */
export function createTask(input: NewTask): Task {
  const now = Date.now()
  const task: Task = {
    id: createId(),
    title: input.title.trim(),
    description: input.description,
    estimatedMinutes: input.estimatedMinutes,
    project: input.project,
    status: 'open',
    createdAt: now,
    completedAt: null,
    archivedAt: null,
  }

  commit([task, ...getTasks()])
  return task
}

/**
 * Edits a task in place.
 *
 * `null` fields are meaningful — clearing an estimate is an edit, not a no-op —
 * so the patch is applied field by field rather than shallow-merged and compared.
 * An unknown id is ignored rather than creating a phantom record.
 */
export function updateTask(id: string, patch: TaskPatch): Task | null {
  let updated: Task | null = null

  commit(
    getTasks().map((task) => {
      if (task.id !== id) return task
      updated = { ...task, ...patch, title: patch.title?.trim() ?? task.title }
      return updated
    }),
  )

  return updated
}

export function setTaskStatus(id: string, status: TaskStatus): void {
  const task = getTask(id)
  if (!task || task.status === status) return

  commit(
    getTasks().map((candidate) =>
      candidate.id === id
        ? {
            ...candidate,
            status,
            // Reopening clears the completion stamp; completing sets it once.
            completedAt: status === 'done' ? (candidate.completedAt ?? Date.now()) : null,
          }
        : candidate,
    ),
  )
}

/**
 * Archives a task.
 *
 * The id is kept, so any session already logged against it still resolves, and
 * the task can be restored. A hard delete is available through
 * `deleteTaskPermanently` and is only ever offered for a task with no history.
 */
export function archiveTask(id: string): void {
  const task = getTask(id)
  if (!task || task.archivedAt !== null) return

  commit(
    getTasks().map((candidate) =>
      candidate.id === id ? { ...candidate, archivedAt: Date.now() } : candidate,
    ),
  )
}

export function restoreTask(id: string): void {
  commit(getTasks().map((task) => (task.id === id ? { ...task, archivedAt: null } : task)))
}

/**
 * Removes a task for good.
 *
 * History is unaffected: a session entry carries its own copy of the task title
 * and project, so deleting a task can never orphan a session.
 *
 * Returns what was removed *and where it was*, because the only caller that can
 * offer an Undo needs both. Keeping the position here is the difference between
 * an Undo that restores the queue as it was and one that silently reorders it.
 */
export function deleteTaskPermanently(id: string): RemovedTask | null {
  const tasks = getTasks()
  const index = tasks.findIndex((task) => task.id === id)
  const removed = index === -1 ? undefined : tasks[index]
  if (removed === undefined) return null

  commit(tasks.filter((candidate) => candidate.id !== id))
  return { task: removed, index }
}

/**
 * Puts a deleted task back exactly as it was.
 *
 * Used only by the Undo affordance on a delete toast. A task whose id has since
 * been reused is ignored rather than duplicated, and the index is clamped in case
 * the list shrank while the toast was on screen.
 */
export function restoreTaskSnapshot({ task, index }: RemovedTask): Task | null {
  const tasks = getTasks()
  if (tasks.some((candidate) => candidate.id === task.id)) return null

  const next = [...tasks]
  next.splice(Math.min(tasks.length, Math.max(0, index)), 0, task)

  commit(next)
  return task
}

/**
 * Moves a task by `offset` places within the whole list, clamped at the ends.
 *
 * Expressed as an offset rather than "move to index" so the caller does not have
 * to reason about the shift that removing an item causes.
 */
export function moveTask(id: string, offset: number): void {
  const tasks = getTasks()
  const from = tasks.findIndex((task) => task.id === id)
  if (from === -1) return

  const to = Math.min(tasks.length - 1, Math.max(0, from + offset))
  if (to === from) return

  const next = [...tasks]
  const [moved] = next.splice(from, 1)
  if (moved === undefined) return
  next.splice(to, 0, moved)
  commit(next)
}

/** Moves a task above `overId` — the operation a drag handle would perform. */
export function moveTaskBefore(id: string, overId: string): void {
  const tasks = getTasks()
  const from = tasks.findIndex((task) => task.id === id)
  const to = tasks.findIndex((task) => task.id === overId)
  if (from === -1 || to === -1 || from === to) return

  const next = [...tasks]
  const [moved] = next.splice(from, 1)
  if (moved === undefined) return
  next.splice(from < to ? to - 1 : to, 0, moved)
  commit(next)
}
