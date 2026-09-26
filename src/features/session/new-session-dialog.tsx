'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SegmentedRadio } from '@/components/ui/segmented-radio'
import {
  SESSION_LENGTH_OPTIONS,
  type SessionFormValues,
  sessionFormSchema,
  toSessionLength,
} from '@/features/session/session-form-schema'
import type { QueuedTask } from '@/types/session'

type NewSessionDialogProps = {
  task: QueuedTask
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Collects the one decision a session needs: which task, and for how long.
 *
 * Validation lives in `sessionFormSchema`; React Hook Form handles submission
 * state and focus-on-error. Navigating to `/focus` hands the draft over to
 * the next stage — nothing here starts a timer.
 */
function NewSessionDialog({ task, open, onOpenChange }: NewSessionDialogProps) {
  const router = useRouter()
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: { task: task.title, length: toSessionLength(task.plannedMinutes) },
  })

  const { register, handleSubmit, reset, formState } = form
  const { errors, isSubmitting } = formState

  // Refill from the queued task each time the dialog is opened, so it always
  // opens on the current plan rather than the last thing typed.
  useEffect(() => {
    if (!open) return
    reset({ task: task.title, length: toSessionLength(task.plannedMinutes) })
  }, [open, reset, task.plannedMinutes, task.title])

  const onSubmit = handleSubmit((values) => {
    onOpenChange(false)
    const query = new URLSearchParams({ task: values.task, minutes: values.length })
    router.push(`/focus?${query.toString()}`)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Start a session</DialogTitle>
            <DialogDescription>
              One task, one block. Everything else can wait outside the room.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="session-task">Task</Label>
              <Input
                id="session-task"
                autoComplete="off"
                placeholder="What will you work on?"
                aria-invalid={errors.task ? true : undefined}
                aria-describedby={errors.task ? 'session-task-error' : undefined}
                {...register('task')}
              />
              {errors.task ? (
                <p id="session-task-error" className="text-xs text-danger">
                  {errors.task.message}
                </p>
              ) : null}
            </div>

            <Controller
              control={form.control}
              name="length"
              render={({ field }) => (
                <SegmentedRadio
                  legend="Length"
                  name="length"
                  options={SESSION_LENGTH_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
                  hint={SESSION_LENGTH_OPTIONS.find((option) => option.value === field.value)?.hint}
                />
              )}
            />
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              Start session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { NewSessionDialog }
export type { NewSessionDialogProps }
