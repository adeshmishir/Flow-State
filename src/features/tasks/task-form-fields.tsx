'use client'

import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ESTIMATE_BOUNDS, type TaskFormValues } from '@/features/tasks/task-form-schema'
import { cn } from '@/lib/utils'

/**
 * Task fields.
 *
 * Deliberately rows rather than a form: the description is genuinely optional
 * and gets the least space, while the estimate sits next to the project because
 * those two are read together.
 *
 * Shared verbatim by "add a task" and "edit a task" — the validation rules for a
 * task should not be able to drift apart between the two screens, and the only
 * difference between them is the surrounding dialog.
 *
 * `idPrefix` exists because these ids are global to the document. Two mounted
 * forms with the same ids would give the labels the wrong target and would make
 * `aria-describedby` ambiguous, so the editing dialog passes its own prefix.
 *
 * Accessibility notes that are easy to skip and very hard to notice later:
 * `aria-invalid` and `aria-describedby` point at the same ids the error
 * messages use, so a screen reader hears the problem *with* the field rather
 * than somewhere else on the page; and the estimate's `sr-only` hint carries
 * the bounds that the visible placeholder cannot.
 */

type TaskFormFieldsProps = {
  register: UseFormRegister<TaskFormValues>
  errors: FieldErrors<TaskFormValues>
  idPrefix?: string
}

function TaskFormFields({ register, errors, idPrefix = 'new-task' }: TaskFormFieldsProps) {
  const id = (field: string) => `${idPrefix}-${field}`

  return (
    <div className="gap-4 flex flex-col">
      <Field label="Task" htmlFor={id('title')} error={errors.title?.message}>
        <Input
          id={id('title')}
          autoComplete="off"
          placeholder="Write the ingest migration guide"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? `${id('title')}-error` : undefined}
          {...register('title')}
        />
      </Field>

      <div className="gap-3 grid grid-cols-[1fr_7rem]">
        <Field
          label="Project"
          htmlFor={id('project')}
          error={errors.project?.message}
          hint="Optional"
        >
          <Input
            id={id('project')}
            autoComplete="off"
            placeholder="Inbox"
            aria-invalid={errors.project ? true : undefined}
            aria-describedby={errors.project ? `${id('project')}-error` : undefined}
            {...register('project')}
          />
        </Field>

        <Field
          label="Estimate"
          htmlFor={id('estimate')}
          error={errors.estimatedMinutes?.message}
          hint="Optional"
        >
          <div className="relative">
            <Input
              id={id('estimate')}
              type="number"
              inputMode="numeric"
              min={ESTIMATE_BOUNDS.min}
              max={ESTIMATE_BOUNDS.max}
              step={5}
              placeholder="50"
              className="no-spinner pr-10"
              aria-invalid={errors.estimatedMinutes ? true : undefined}
              aria-describedby={
                errors.estimatedMinutes ? `${id('estimate')}-error` : `${id('estimate')}-hint`
              }
              {...register('estimatedMinutes')}
            />
            <span
              aria-hidden="true"
              className="inset-y-0 right-3 pointer-events-none absolute flex items-center text-2xs text-ink-subtle"
            >
              min
            </span>
          </div>
          <p id={`${id('estimate')}-hint`} className="sr-only">
            Optional. A whole number of minutes between {ESTIMATE_BOUNDS.min} and{' '}
            {ESTIMATE_BOUNDS.max}.
          </p>
        </Field>
      </div>

      <Field
        label="Description"
        htmlFor={id('description')}
        error={errors.description?.message}
        hint="Optional. Shown only if you open notes later."
      >
        <textarea
          id={id('description')}
          rows={2}
          maxLength={280}
          placeholder="Backfill order, dual-write window, rollback path."
          className={cn(
            'p-3 w-full resize-y rounded-md border border-line bg-surface',
            'text-sm text-ink placeholder:text-ink-subtle',
            'transition-[border-color,box-shadow] duration-150 ease-standard',
            'focus-visible:shadow-focus focus-visible:border-accent focus-visible:outline-none',
            'aria-invalid:border-danger',
          )}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? `${id('description')}-error` : undefined}
          {...register('description')}
        />
      </Field>
    </div>
  )
}

type FieldProps = {
  label: string
  htmlFor: string
  error: string | undefined
  hint?: string | undefined
  children: React.ReactNode
}

function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="min-w-0 gap-2 flex flex-col">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-2xs text-ink-subtle">{hint}</p>
      ) : null}
    </div>
  )
}

export { TaskFormFields }
export type { TaskFormFieldsProps }
