'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useId, type FormEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

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
import { Label } from '@/components/ui/label'
import { SegmentedRadio } from '@/components/ui/segmented-radio'
import { toast } from '@/components/ui/toast'
import { usePreferences } from '@/features/preferences/preferences-store'
import { draftFromTask, draftToQuery } from '@/features/session/focus-draft'
import { TaskFormFields } from '@/features/tasks/task-form-fields'
import { taskFormSchema, toNewTask } from '@/features/tasks/task-form-schema'
import { NEW_TASK_VALUE, TaskSelector } from '@/features/tasks/task-selector'
import { createTask, useTasks } from '@/features/tasks/task-store'
import {
  DEFAULT_SESSION_LENGTH,
  SESSION_LENGTH_OPTIONS,
  toDraftMinutes,
  toSessionLength,
} from '@/features/session/session-form-schema'

/**
 * Session setup.
 *
 * Two questions, one sheet. The temptation in a "start a session" flow is to
 * make it a form; this is not a form, it is a choice between a short list of
 * things you already said you would do and a length of time. Everything the flow
 * does not need is deliberately absent — no project picker, no date, no "how
 * are you feeling today".
 *
 * Defaults do the work: the recommended task arrives selected and its own
 * estimate pre-filled, so the common path is one keypress.
 *
 * ## Two forms, not one
 *
 * The setup question (which task, how long) and the new-task question (title,
 * project, estimate, description) are validated by two separate schemas against
 * two separate `useForm` instances. Merging them would mean either a
 * discriminated union that React Hook Form's types cannot express cleanly, or a
 * flat schema that validates four irrelevant fields every time someone just
 * picks a task. Neither is worth it; the submit handler runs both, task first.
 */

const setupSchema = z.object({
  taskId: z.string().trim().min(1, 'Pick a task, or write a new one.'),
  length: z.enum(['25', '50', '90']),
})

type SetupValues = z.infer<typeof setupSchema>

type SessionSetupDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-selected task. `null` selects the first queued task. */
  initialTaskId: string | null
}

/** Drafts travel in the URL, so the room is server-rendered from them. */

function SessionSetupDialog({ open, onOpenChange, initialTaskId }: SessionSetupDialogProps) {
  const router = useRouter()
  const tasks = useTasks()
  const preferences = usePreferences()
  const defaultLength = preferences.defaultSessionMinutes
  const taskPickerErrorId = useId()

  const setupForm = useForm<SetupValues>({
    resolver: zodResolver(setupSchema),
    mode: 'onSubmit',
    defaultValues: { taskId: '', length: toSessionLength(undefined, defaultLength) },
  })

  const taskForm = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    mode: 'onSubmit',
    defaultValues: { title: '', description: '', estimatedMinutes: '', project: '' },
  })

  const {
    control,
    reset: resetSetup,
    setValue,
    getValues,
    trigger,
    formState: setupState,
  } = setupForm
  const { reset: resetTask, formState: taskState } = taskForm

  // `useWatch` rather than `watch()`: it is a subscription, so it re-renders on
  // change instead of being an unsafe function the compiler has to skip.
  const watched = useWatch({ control })
  const selectedId = watched.taskId ?? ''
  const length = watched.length ?? DEFAULT_SESSION_LENGTH
  const writingNew = selectedId === NEW_TASK_VALUE

  // The recommended task is whatever Home pointed at, falling back to the top of
  // the queue. Its own estimate becomes the pre-selected length, so the common
  // path is one keypress — and a task with no estimate falls back to the length
  // the person set as their default, not to a hard-coded one.
  const recommended = tasks.find((task) => task.id === initialTaskId) ?? tasks[0]

  // Opening the dialog always shows the recommended task, never whatever the last
  // session happened to use.
  useEffect(() => {
    if (!open) return

    resetSetup({
      taskId: recommended?.id ?? '',
      length: toSessionLength(recommended?.estimatedMinutes, defaultLength),
    })
    resetTask({ title: '', description: '', estimatedMinutes: '', project: '' })
  }, [open, recommended, defaultLength, resetSetup, resetTask])

  const selectTask = useCallback(
    (value: string) => {
      setValue('taskId', value, { shouldValidate: false })
      if (value === NEW_TASK_VALUE) return
      const task = tasks.find((candidate) => candidate.id === value)
      if (!task) return
      setValue('length', toSessionLength(task.estimatedMinutes, defaultLength), {
        shouldValidate: false,
      })
    },
    [setValue, tasks, defaultLength],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // Task fields first: if the user is writing a new task, that is the thing
    // they most need told about.
    if (writingNew && !(await taskForm.trigger())) return
    if (!(await trigger())) return

    const task =
      tasks.find((candidate) => candidate.id === getValues('taskId')) ??
      (writingNew ? createTask(toNewTask(taskForm.getValues())) : null)

    if (!task) return

    const draft = draftFromTask(task, toDraftMinutes(getValues('length')))

    onOpenChange(false)

    if (writingNew) {
      toast.success('Task added', {
        id: 'task-created',
        description: 'It is in your queue for next time.',
      })
    }

    router.push(`/focus${draftToQuery(draft)}`)
  }

  const setupErrors = setupState.errors
  const submitting = setupState.isSubmitting || taskState.isSubmitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Start a session</DialogTitle>
            <DialogDescription>
              One task, one block. Everything else can wait outside the room.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="gap-5 flex flex-col">
            {writingNew ? (
              <TaskFormFields register={taskForm.register} errors={taskState.errors} />
            ) : (
              <div className="gap-2 flex flex-col">
                <Label>Task</Label>
                <TaskSelector
                  tasks={tasks}
                  value={selectedId}
                  onValueChange={selectTask}
                  errorId={setupErrors.taskId ? taskPickerErrorId : undefined}
                />
                {setupErrors.taskId ? (
                  <p id={taskPickerErrorId} className="text-xs text-danger">
                    {setupErrors.taskId.message}
                  </p>
                ) : null}
              </div>
            )}

            <SegmentedRadio
              legend="Length"
              name="session-length"
              options={SESSION_LENGTH_OPTIONS}
              value={length}
              onValueChange={(value) => setValue('length', value, { shouldValidate: false })}
              hint={SESSION_LENGTH_OPTIONS.find((option) => option.value === length)?.hint}
            />
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {writingNew ? 'Add task and start' : 'Start session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { SessionSetupDialog }
export type { SessionSetupDialogProps }
