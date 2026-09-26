'use client'

import { AnimatePresence, motion } from 'motion/react'
import { NotebookPen, Pause, Play, LogOut, Check } from 'lucide-react'

import { Kbd } from '@/components/ui/kbd'
import { focusControlsVariants, stateSwapVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { SessionStatus } from '@/types/session'

/**
 * Session controls.
 *
 * One primary action that changes meaning with the state, and a quiet row of
 * three. Every one of them carries a text label even on a phone: "Finish" and
 * "Exit" are two words apart in meaning and one pixel apart in position, which
 * is exactly the kind of pair that should never be icons.
 *
 * Nothing here re-renders on a clock tick — the dial above owns that.
 */

type SessionControlsProps = {
  status: SessionStatus
  notesOpen: boolean
  onToggleRunState: () => void
  onToggleNotes: () => void
  onFinish: () => void
  onExit: () => void
  className?: string
}

function SessionControls({
  status,
  notesOpen,
  onToggleRunState,
  onToggleNotes,
  onFinish,
  onExit,
  className,
}: SessionControlsProps) {
  const running = status === 'running'

  return (
    <motion.div
      variants={focusControlsVariants}
      className={cn('gap-4 flex w-full flex-col items-center', className)}
    >
      <div className="gap-2.5 flex w-full flex-col items-center">
        <button
          type="button"
          onClick={onToggleRunState}
          className={cn(
            'h-12 max-w-64 gap-2.5 relative flex w-full items-center justify-center overflow-hidden rounded-md',
            'font-medium tracking-tight text-sm',
            'transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-standard',
            'focus-visible:outline-focus focus-visible:outline-2 focus-visible:outline-offset-2',
            'active:scale-[0.985] motion-reduce:active:scale-100',
            running
              ? 'border border-line-control bg-surface text-ink hover:border-line-control-hover hover:bg-raised'
              : 'bg-accent text-accent-ink shadow-xs hover:bg-accent-hover active:bg-accent-active',
          )}
        >
          {/*
            The label swaps rather than the icon alone, and is announced through
            the button's own accessible name. `aria-live` is deliberately not used
            here: the status change is already announced once, by the room.
          */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={running ? 'pause' : 'resume'}
              variants={stateSwapVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="gap-2.5 inline-flex items-center"
            >
              {running ? (
                <Pause className="size-4" fill="currentColor" aria-hidden="true" />
              ) : (
                <Play className="size-4" fill="currentColor" aria-hidden="true" />
              )}
              {running ? 'Pause' : 'Resume'}
            </motion.span>
          </AnimatePresence>
        </button>

        <p className="text-2xs text-ink-muted">
          <Kbd>Space</Kbd>
          <span className="sm:ml-1.5">{running ? 'to pause' : 'to resume'}</span>
        </p>
      </div>

      <div className="max-w-md gap-2 grid w-full grid-cols-3">
        <SecondaryControl
          active={notesOpen}
          onClick={onToggleNotes}
          icon={<NotebookPen aria-hidden="true" />}
          label="Notes"
          shortcut="N"
        />
        <SecondaryControl
          onClick={onFinish}
          icon={<Check aria-hidden="true" />}
          label="Finish"
          shortcut="F"
        />
        <SecondaryControl
          onClick={onExit}
          icon={<LogOut aria-hidden="true" />}
          label="Exit"
          shortcut="Esc"
        />
      </div>
    </motion.div>
  )
}

type SecondaryControlProps = {
  onClick: () => void
  icon: React.ReactNode
  label: string
  shortcut: string
  active?: boolean
}

function SecondaryControl({
  onClick,
  icon,
  label,
  shortcut,
  active = false,
}: SecondaryControlProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active || undefined}
      className={cn(
        'min-h-11 gap-1.5 px-2 flex items-center justify-center rounded-md border',
        'font-medium text-xs whitespace-nowrap',
        'transition-[background-color,border-color,color] duration-150 ease-standard',
        'focus-visible:outline-focus focus-visible:outline-2 focus-visible:outline-offset-2',
        active
          ? 'border-accent/40 bg-accent-soft text-accent-soft-ink'
          : 'border-line-control bg-surface text-ink-secondary hover:border-line-control-hover hover:bg-raised hover:text-ink',
      )}
    >
      {icon}
      {label}
      <Kbd>{shortcut}</Kbd>
    </button>
  )
}

export { SessionControls }
export type { SessionControlsProps }
