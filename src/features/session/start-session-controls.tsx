'use client'

import { Pencil, Play } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Tooltip } from '@/components/ui/tooltip'
import { SessionSetupDialog } from '@/features/session/session-setup-dialog'

type StartSessionControlsProps = {
  /** The task the card is describing, so the dialog opens on it. */
  taskId: string
}

/**
 * The only interactive island on the Home page.
 *
 * Kept deliberately small: the task card around it is static server-rendered
 * HTML, and only these controls plus the dialog ship to the client.
 */
function StartSessionControls({ taskId }: StartSessionControlsProps) {
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
        <Play aria-hidden="true" fill="currentColor" />
        Start a session
      </Button>

      <Tooltip label="Change the task or length">
        <IconButton
          label="Change the task or length"
          variant="outline"
          size="icon-lg"
          onClick={() => setOpen(true)}
        >
          <Pencil aria-hidden="true" />
        </IconButton>
      </Tooltip>

      {/*
        The recommended task comes from the server-rendered card, so the dialog
        opens on exactly the task the page is describing.
      */}
      <SessionSetupDialog open={open} onOpenChange={setOpen} initialTaskId={taskId} />
    </>
  )
}

export { StartSessionControls }
export type { StartSessionControlsProps }
