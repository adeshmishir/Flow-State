'use client'

import { useSyncExternalStore } from 'react'

import { getInitialTasks } from '@/data/session-fixtures'
import { createExternalStore, readLocal, writeLocal } from '@/lib/local-store'
import type { Task, TaskStatus } from '@/types/session'

/**
 * The task queue.
 *
 * Local and in-memory for this stage — no backend, no API, no database — but
 * persisted to `localStorage` so a created task survives a reload, and shaped
 * exactly like the domain type a real repository would return.
 */

const STORAGE_KEY = 'flowstate.tasks.v1'

interface TaskState {
  tasks: readonly Task[]
  /** True once stored tasks have been read, so seeding only happens once. */
  hydrated: boolean
}

function loadState(): TaskState {
  const stored = readLocal<readonly Task[] | null>(STORAGE_KEY, null)
  return {
    tasks: stored && stored.length > 0 ? stored : getInitialTasks(),
    hydrated: true,
  }
}

const store = createExternalStore<TaskState>({
  tasks: [],
  hydrated: false,
})

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
  writeLocal(STORAGE_KEY, tasks)
}

/** Every task, newest first. */
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
    () => EMPTY_TASKS,
  )
}

const EMPTY_TASKS: readonly Task[] = []

export function getTasks(): readonly Task[] {
  ensureSeeded()
  return store.getState().tasks
}

export function getTask(id: string): Task | null {
  return getTasks().find((task) => task.id === id) ?? null
}

function createId(): string {
  return `tsk_${Math.random().toString(36).slice(2, 10)}`
}

export type NewTask = {
  title: string
  description: string | null
  estimatedMinutes: number | null
  project: string
}

/** Adds a task to the front of the queue. Returns the created record. */
export function createTask(input: NewTask): Task {
  const task: Task = {
    id: createId(),
    title: input.title,
    description: input.description,
    estimatedMinutes: input.estimatedMinutes,
    project: input.project,
    status: 'queued',
    createdAt: Date.now(),
  }

  commit([task, ...getTasks()])
  return task
}

export function setTaskStatus(id: string, status: TaskStatus): void {
  commit(getTasks().map((task) => (task.id === id ? { ...task, status } : task)))
}
