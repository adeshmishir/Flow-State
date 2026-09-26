'use client'

import { useRouter } from 'next/navigation'

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
import { endAndClear } from '@/features/focus/session-store'
import { formatFocused } from '@/lib/format'
import type { ActiveSession, SessionEndReason } from '@/types/session'

/**
 * The one place a session can be lost, so the one place that asks.
 *
 * Two questions were deliberately *not* asked before the clock started — the
 * setup dialog already covered them, and a confirmation between "start" and
 * "work" is friction dressed up as caution. Ending is different: this is the
 * irreversible direction, and on a phone the Exit button is exactly where a
 * thumb lands by accident. So both the shortcut and the button land here.
 *
 * The dialog is honest about the trade rather than picking for the user:
 * a session can be written to history as-is, or dropped.
 */

type EndSessionDialogProps = {
  open: boolean
  mode: 'finish' | 'exit'
  session: ActiveSession
  focusedMs: number
  onOpenChange: (open: boolean) => void
}

function EndSessionDialog({ open, mode, session, focusedMs, onOpenChange }: EndSessionDialogProps) {
  const router = useRouter()
  const focused = formatFocused(focusedMs)
  const finishing = mode === 'finish'

  const leaveWith = (reason: SessionEndReason) => {
    endAndClear(reason)
    onOpenChange(false)

    if (reason === 'discarded') {
      toast('Session discarded', {
        id: 'session-dropped',
        description: `${session.taskTitle} was not written to your history.`,
      })
    } else {
      toast('Session saved', {
        id: 'session-saved',
        description: `${focused} on ${session.taskTitle}.`,
      })
    }

    router.push('/')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{finishing ? 'Finish this session?' : 'Leave this session?'}</DialogTitle>
          <DialogDescription>
            {finishing
              ? 'The clock stops here. Whatever you have done so far gets written to your history.'
              : 'You are partway through. Flowstate can keep what you have done so far, or throw this session away.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <dl className="px-4 py-3 rounded-md border border-line bg-sunken text-xs">
            <div className="gap-4 flex items-baseline justify-between">
              <dt className="text-ink-muted">Task</dt>
              <dd className="font-medium truncate text-right text-ink">{session.taskTitle}</dd>
            </div>
            <div className="mt-2 gap-4 flex items-baseline justify-between">
              <dt className="text-ink-muted">Focused so far</dt>
              <dd className="font-medium tnum text-ink tabular-nums">{focused}</dd>
            </div>
          </dl>
        </DialogBody>

        <DialogFooter className="gap-2 sm:flex-row sm:justify-end flex-col-reverse">
          <Button
            type="button"
            variant="ghost"
            className="sm:w-auto w-full"
            onClick={() => onOpenChange(false)}
          >
            Keep working
          </Button>
          <Button
            type="button"
            variant="danger"
            className="sm:w-auto w-full"
            onClick={() => leaveWith('discarded')}
          >
            Discard
          </Button>
          <Button
            type="button"
            variant="primary"
            className="sm:w-auto w-full"
            onClick={() => leaveWith('finished-early')}
          >
            {finishing ? 'Finish and save' : 'Save and leave'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { EndSessionDialog }
export type { EndSessionDialogProps }
