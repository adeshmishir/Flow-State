'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { TaskFormFields } from '@/features/tasks/task-form-fields'
import { taskFormSchema, toNewTask, type TaskFormValues } from '@/features/tasks/task-form-schema'
import { createTask } from '@/features/tasks/task-store'
import { listTransition } from '@/lib/motion'

/**
 * Add a task.
 *
 * Inline rather than in a dialog, on purpose. This is the most frequent action in
 * the product after starting a session, and a queue you have to open a modal to
 * add to is a queue people stop maintaining. Three optional fields collapse to one
 * when it is closed, so the list still reads as a list.
 *
 * The same fields and the same schema as "edit a task" and "new task" in the
 * session dialog, for the reason that a task's constraints should not depend on
 * which screen created it.
 */

type TaskComposerProps = {
  /** Open on load — used when arriving with nothing to do. */
  autoOpen?: boolean
  onDone?: () => void
}

function TaskComposer({ autoOpen = false, onDone }: TaskComposerProps) {
  const [open, setOpen] = useState(autoOpen)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: { title: '', description: '', estimatedMinutes: '', project: '' },
  })

  const close = () => {
    reset()
    setOpen(false)
    onDone?.()
  }

  const onSubmit = handleSubmit((values) => {
    const task = createTask(toNewTask(values))
    toast.success('Task added', { description: task.title })
    close()
  })

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        Add a task
      </Button>
    )
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={listTransition}
      onSubmit={onSubmit}
      noValidate
      className="p-5 rounded-lg border border-line bg-surface"
    >
      <Label htmlFor="queue-task-title">New task</Label>

      <div className="mt-2.5">
        <TaskFormFields register={register} errors={errors} idPrefix="queue-task" />
      </div>

      <div className="mt-5 gap-2 flex items-center justify-end">
        <Button type="button" variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          Add task
        </Button>
      </div>
    </motion.form>
  )
}

export { TaskComposer }
export type { TaskComposerProps }
