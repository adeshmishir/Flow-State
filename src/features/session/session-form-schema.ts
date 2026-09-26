import { z } from 'zod'

/**
 * Shape of the "start a session" form.
 *
 * The schema is the single source of truth: the input constraints, the
 * validation messages and the inferred TypeScript type all come from it, so a
 * change here cannot drift from the form.
 */
export const sessionFormSchema = z.object({
  task: z
    .string()
    .trim()
    .min(3, 'Name the task in a few words.')
    .max(120, 'Keep it under 120 characters.'),
  length: z.enum(['25', '50', '90']),
})

export type SessionFormValues = z.infer<typeof sessionFormSchema>

export const SESSION_LENGTH_OPTIONS: readonly {
  value: SessionFormValues['length']
  label: string
  hint: string
}[] = [
  { value: '25', label: '25 min', hint: 'A short sprint, good for one narrow thing.' },
  { value: '50', label: '50 min', hint: 'One full block — the default shape of a session.' },
  { value: '90', label: '90 min', hint: 'A long haul. Only when the task is genuinely deep.' },
]

export const DEFAULT_SESSION_LENGTH: SessionFormValues['length'] = '50'

/** Maps a planned duration in minutes onto the closest offered option. */
export function toSessionLength(minutes: number): SessionFormValues['length'] {
  const match = SESSION_LENGTH_OPTIONS.find((option) => Number(option.value) === minutes)
  return match?.value ?? DEFAULT_SESSION_LENGTH
}
