'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

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
import { toast } from '@/components/ui/toast'
import { TaskFormFields } from '@/features/tasks/task-form-fields'
import { taskFormSchema, toNewTask, type TaskFormValues } from '@/features/tasks/task-form-schema'
import { getTask, updateTask } from '@/features/tasks/task-store'
import type { Task } from '@/types/session'

/**
 * Edit a task.
 *
 * The same fields, the same validation and the same store as "add a task" — this
 * dialog exists to route a `Task` into that form and back out again, not to
 * define a second way to edit a task.
 *
 * It re-initialises on every open rather than on every change of `task`. That
 * distinction matters: remounting on each keystroke would wipe the field being
 * typed into, while remounting on open is exactly when the previous edit should
 * be discarded.
 *
 * `toNewTask` is reused for the conversion even though this is an update, because
 * it is the one place that turns trimmed form strings into a task's nullable
 * fields. Two implementations of that conversion is how a task ends up with
 * `description: ""` after an edit that only touched the title.
 *
 * The "that task no longer exists" case is reported through React Hook Form's own
 * `setError` rather than a second piece of component state, so it renders in the
 * field's error slot with the field's `aria-describedby` and needs no separate
 * `role="alert"`.
 */

type TaskEditDialogProps = {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function TaskEditDialog({ task, open, onOpenChange }: TaskEditDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: { title: '', description: '', estimatedMinutes: '', project: '' },
  })

  useEffect(() => {
    if (!open || task === null) return
    reset({
      title: task.title,
      description: task.description ?? '',
      estimatedMinutes: task.estimatedMinutes === null ? '' : String(task.estimatedMinutes),
      project: task.project,
    })
    clearErrors()
  }, [open, task, reset, clearErrors])

  const onSubmit = handleSubmit((values) => {
    // Read through the store rather than trusting the prop: the task may have been
    // deleted from another surface (the palette, another tab) since this opened.
    const current = getTask(task?.id ?? null)
    if (current === null) {
      setError('title', { message: 'That task no longer exists.' })
      return
    }

    const next = toNewTask(values)
    updateTask(current.id, {
      title: next.title,
      description: next.description,
      estimatedMinutes: next.estimatedMinutes,
      project: next.project,
    })

    toast.success('Task updated', { description: next.title })
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>
            Changes apply to the queue. Sessions already logged against this task keep their
            history.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <DialogBody>
            <TaskFormFields register={register} errors={errors} idPrefix="edit-task" />
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { TaskEditDialog }
export type { TaskEditDialogProps }
