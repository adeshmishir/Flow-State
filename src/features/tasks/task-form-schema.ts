import { z } from 'zod'

import type { NewTask } from '@/features/tasks/task-store'

/** The estimate bounds, shared by the input and its validation message. */
export const ESTIMATE_BOUNDS = { min: 5, max: 240 } as const

/**
 * Where a task lands when the project is left blank.
 *
 * The prompt is a title, maybe a description, maybe an estimate — so project is
 * optional on the form. It is not optional on the model, because everything
 * downstream (grouping in the queue, the header in the room) reads a real string.
 * Rather than sprinkling `?? ''` around those call sites, the one place a task
 * is created decides the default.
 */
export const DEFAULT_PROJECT = 'Inbox'

/**
 * Shape of the "add a task" form.
 *
 * Zod is used here because this form has genuine constraints — a title long
 * enough to recognise, an estimate inside a believable range — and the schema is
 * the single source of truth for the constraints, the messages and the inferred
 * type.
 *
 * Every field stays a *string* in the validated shape, including the estimate.
 * Coercing inside the schema would make the resolver's input and output types
 * differ, which React Hook Form has to be told about explicitly; parsing once on
 * submit is simpler to read and easier to change.
 */
export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Name the task in a few words.')
    .max(120, 'Keep it under 120 characters.'),
  description: z.string().trim().max(280, 'Keep it under 280 characters.'),
  estimatedMinutes: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d{1,3}$/.test(value), 'Use a whole number of minutes.')
    .refine(
      (value) =>
        value === '' ||
        (Number(value) >= ESTIMATE_BOUNDS.min && Number(value) <= ESTIMATE_BOUNDS.max),
      `Pick something between ${ESTIMATE_BOUNDS.min} and ${ESTIMATE_BOUNDS.max} minutes.`,
    ),
  project: z.string().trim().max(40, 'Keep it under 40 characters.'),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>

/** Parsed form values → the shape the task store creates from. */
export function toNewTask(values: TaskFormValues): NewTask {
  const estimate = values.estimatedMinutes.trim()
  const description = values.description.trim()
  const project = values.project.trim()

  return {
    title: values.title.trim(),
    description: description === '' ? null : description,
    estimatedMinutes: estimate === '' ? null : Number(estimate),
    project: project === '' ? DEFAULT_PROJECT : project,
  }
}
