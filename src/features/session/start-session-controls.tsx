'use client'

import { Pencil, Play } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Tooltip } from '@/components/ui/tooltip'
import { NewSessionDialog } from '@/features/session/new-session-dialog'
import type { QueuedTask } from '@/types/session'

type StartSessionControlsProps = {
  task: QueuedTask
}

/**
 * The only interactive island on the Home page.
 *
 * Kept deliberately small: the task card around it is static server-rendered
 * HTML, and only these controls plus the dialog ship to the client.
 */
function StartSessionControls({ task }: StartSessionControlsProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="primary"
        size="lg"
        className="sm:flex-none flex-1"
        onClick={() => setOpen(true)}
      >
        <Play aria-hidden="true" />
        Start a session
      </Button>

      <Tooltip label="Change the task">
        <IconButton
          label="Change the task"
          variant="outline"
          size="icon-lg"
          onClick={() => setOpen(true)}
        >
          <Pencil aria-hidden="true" />
        </IconButton>
      </Tooltip>

      <NewSessionDialog task={task} open={open} onOpenChange={setOpen} />
    </>
  )
}

export { StartSessionControls }
export type { StartSessionControlsProps }
