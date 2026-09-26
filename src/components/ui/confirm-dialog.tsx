'use client'

import type { ReactNode } from 'react'

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

/**
 * A yes/no dialog for the handful of actions that cannot be undone.
 *
 * Exists as a primitive rather than being built per call site because the
 * important parts are easy to get subtly wrong: the destructive button must not
 * be the one that receives focus on open (Radix focuses the first focusable by
 * default, so the cancel button is ordered first), and the dialog must not close
 * itself on a click that was not a decision — `onOpenChange` ignores every close
 * that is not an explicit confirm or cancel.
 *
 * Delete-task is the current caller. It is worth having as a component for the
 * next one.
 */

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  /** Extra emphasis on the confirm button. */
  destructive?: boolean
  /**
   * Blocks the confirm button. Used when the dialog itself asks for an explicit
   * acknowledgement — the "and my history goes too" checkbox on a data reset —
   * so the last step of an irreversible action is the slowest one.
   */
  confirmDisabled?: boolean
  /** Extra content between the description and the buttons. */
  children?: ReactNode
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = true,
  confirmDisabled = false,
  children,
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Only an explicit decision closes this dialog. Escape and a scrim click
        // are ignored, because dismissing a "delete this?" by clicking next to it
        // should not be possible to do by accident.
        if (next) onOpenChange(true)
      }}
    >
      <DialogContent className="max-w-[24rem]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {children === undefined ? null : <DialogBody>{children}</DialogBody>}

        <DialogFooter>
          {/* Cancel first, so it takes initial focus rather than the destructive
              action. */}
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'danger' : 'primary'}
            disabled={confirmDisabled}
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ConfirmDialog }
export type { ConfirmDialogProps }
