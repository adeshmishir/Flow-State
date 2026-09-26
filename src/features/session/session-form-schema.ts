import { z } from 'zod'

import { SESSION_DURATIONS, type SessionDraft } from '@/types/session'

/**
 * Shape of the session setup form.
 *
 * Deliberately two fields: *which task* and *how long*. Everything else about a
 * session is either already known (the project, from the task) or does not
 * change what happens next. A setup step that asks more than this starts to
 * feel like paperwork, which is the opposite of the point.
 */
export const sessionSetupSchema = z.object({
  taskId: z.string().trim().min(1, 'Pick a task, or write a new one.'),
  length: z.enum(['25', '50', '90']),
})

export type SessionSetupValues = z.infer<typeof sessionSetupSchema>

export const SESSION_LENGTH_OPTIONS: readonly {
  value: SessionSetupValues['length']
  label: string
  hint: string
}[] = [
  { value: '25', label: '25 min', hint: 'A short sprint — good for one narrow thing.' },
  { value: '50', label: '50 min', hint: 'One full block. The default shape of a session.' },
  { value: '90', label: '90 min', hint: 'A long haul. Only when the task is genuinely deep.' },
]

/** The length offered when nothing else says otherwise. Overridable in Settings. */
export const DEFAULT_SESSION_LENGTH: SessionSetupValues['length'] = '50'

/**
 * Snaps an estimate in minutes onto the closest offered length.
 *
 * A task estimated at 40 minutes should open the dialog on 50, not silently on
 * the 25 — the estimate is a hint, and the nearest option is the honest reading
 * of it.
 *
 * `fallback` is the caller's configured default rather than the constant, because
 * a person who set their default to 25 minutes should not be shown 50 when they
 * pick a task with no estimate. The parameter is a plain number so this module
 * stays pure and does not have to read the preferences store.
 */
export function toSessionLength(
  minutes: number | null | undefined,
  fallback: number = Number(DEFAULT_SESSION_LENGTH),
): SessionSetupValues['length'] {
  const defaultLength = toOfferedLength(fallback)

  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    return defaultLength
  }

  let nearest: SessionSetupValues['length'] = defaultLength
  let smallestGap = Number.POSITIVE_INFINITY

  for (const option of SESSION_LENGTH_OPTIONS) {
    const gap = Math.abs(Number(option.value) - minutes)
    if (gap < smallestGap) {
      nearest = option.value
      smallestGap = gap
    }
  }

  return nearest
}

/** A configured default that is not one of the offered lengths still snaps to one. */
function toOfferedLength(minutes: number): SessionSetupValues['length'] {
  const values = SESSION_LENGTH_OPTIONS.map((option) => option.value)
  return values.includes(String(minutes) as SessionSetupValues['length'])
    ? (String(minutes) as SessionSetupValues['length'])
    : DEFAULT_SESSION_LENGTH
}

export function toDraftMinutes(length: SessionSetupValues['length']): number {
  const parsed = Number(length)
  return SESSION_DURATIONS.includes(parsed as (typeof SESSION_DURATIONS)[number])
    ? parsed
    : Number(DEFAULT_SESSION_LENGTH)
}

/** Narrows an unvalidated minutes value from the URL back to a real duration. */
export function sanitizeDraftMinutes(value: number): number | null {
  return SESSION_DURATIONS.includes(value as (typeof SESSION_DURATIONS)[number]) ? value : null
}

export function toDraft(
  values: SessionSetupValues,
  task: {
    title: string
    project: string
    description: string | null
    id: string
  },
): SessionDraft {
  return {
    taskId: task.id,
    taskTitle: task.title,
    project: task.project,
    description: task.description ?? '',
    minutes: toDraftMinutes(values.length),
  }
}
