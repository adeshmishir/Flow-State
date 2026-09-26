'use client'

import { z } from 'zod'

/**
 * Flowstate — persisted shapes
 * ---------------------------------------------------------------------------
 * Zod schemas for everything that reaches `localStorage`, and the migration that
 * carries Stage 2 data forward.
 *
 * These are deliberately *not* the same schemas as the forms. A form is entered
 * by a person and should be forgiving about the shapes it accepts; a stored
 * value is read by code and must be exactly what the code assumes, because
 * there is no user present to correct it. Strictness lives here, leniency lives
 * in `task-form-schema.ts`.
 */

const finiteMs = z.number().finite()
const nonEmptyString = z.string().trim().min(1)
const optionalText = z.string().nullable()

export const taskSchema = z.object({
  id: nonEmptyString,
  title: nonEmptyString,
  description: optionalText,
  estimatedMinutes: z.number().int().min(1).max(600).nullable(),
  project: z.string(),
  status: z.enum(['open', 'done']),
  createdAt: finiteMs,
  completedAt: finiteMs.nullable(),
  archivedAt: finiteMs.nullable(),
})

export const taskListSchema = z.array(taskSchema)

export const activeSessionSchema = z.object({
  id: nonEmptyString,
  taskId: optionalText,
  taskTitle: z.string(),
  project: z.string(),
  description: z.string(),
  plannedMs: z.number().positive(),
  status: z.enum(['running', 'paused', 'completed']),
  startedAt: finiteMs,
  bankedMs: z.number().min(0),
  runStartedAt: finiteMs.nullable(),
  pausedAt: finiteMs.nullable(),
  finishedMs: z.number().min(0).nullable(),
  finishedAt: finiteMs.nullable(),
  interruptions: z.number().int().min(0),
  notes: z.string(),
})

export const sessionLogEntrySchema = z.object({
  id: nonEmptyString,
  taskId: optionalText,
  taskTitle: z.string(),
  project: z.string(),
  plannedMinutes: z.number().min(0),
  focusedMinutes: z.number().min(0),
  interruptions: z.number().int().min(0),
  startedAt: finiteMs,
  endedAt: finiteMs,
  reason: z.enum(['completed', 'finished-early', 'discarded']),
  notes: z.string(),
})

export const sessionLogSchema = z.array(sessionLogEntrySchema)

export const preferencesSchema = z.object({
  dailyGoalMinutes: z.number().int().min(15).max(720),
  defaultSessionMinutes: z.union([z.literal(25), z.literal(50), z.literal(90)]),
  weekStartsOn: z.union([z.literal(0), z.literal(1), z.literal(6)]).catch(1),
})

/* ------------------------------------------------------------------------- *
 * Migration
 * ------------------------------------------------------------------------- */

/** Current persisted version for each key. Bump alongside a migration. */
export const VERSIONS = {
  tasks: 2,
  session: 2,
  sessionLog: 2,
  preferences: 1,
} as const

/**
 * Stage 2 → Stage 3, tasks.
 *
 * Two real changes: the status vocabulary drops `active` (it is now derived
 * from the live session, and persisting it allowed the two to disagree), and
 * archiving needed somewhere to put its timestamp.
 *
 * Written as a tolerant reader rather than a strict one — a `v1` value is by
 * definition the output of an older, less careful build, so every field is
 * treated as optional and defaulted. Anything still missing is caught by
 * `taskListSchema` immediately afterwards, which quarantines the value rather
 * than letting a half-record reach the UI.
 */
function migrateTasks(data: unknown): unknown {
  if (!Array.isArray(data)) return data

  return data.map((entry) => {
    const task = entry as Record<string, unknown>
    const isDone = task.status === 'done' || task.status === 'completed'
    const createdAt = typeof task.createdAt === 'number' ? task.createdAt : 0

    return {
      id: task.id,
      title: task.title,
      description: task.description ?? null,
      estimatedMinutes: task.estimatedMinutes ?? null,
      project: task.project ?? '',
      status: isDone ? 'done' : 'open',
      createdAt,
      completedAt: isDone ? (task.completedAt ?? createdAt) : null,
      archivedAt: task.archivedAt ?? null,
    }
  })
}

/**
 * Stage 2 → Stage 3, live session.
 *
 * Only one field was added across the two stages (`description` on the session
 * itself, previously only on the task), and it is filled from the empty string
 * so an interrupted session resumes with an empty context block rather than an
 * `undefined` reaching a component that expects a string.
 */
function migrateActiveSession(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) return data
  const session = data as Record<string, unknown>
  return { ...session, description: session.description ?? '' }
}

/**
 * Stage 2 → Stage 3, session log.
 *
 * `discarded` sessions were never written, so the Stage 2 `reason` union already
 * matches. The only work is filling `notes`, which Stage 2 wrote but Stage 1's
 * fixtures did not.
 */
function migrateSessionLog(data: unknown): unknown {
  if (!Array.isArray(data)) return data

  return data.map((entry) => {
    const session = entry as Record<string, unknown>
    return { ...session, notes: session.notes ?? '' }
  })
}

export const MIGRATIONS = {
  tasks: migrateTasks,
  session: migrateActiveSession,
  sessionLog: migrateSessionLog,
} as const
