'use client'

import { motion } from 'motion/react'
import { ArrowRight, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eyebrow } from '@/components/ui/eyebrow'
import { formatDurationLong, formatFocused } from '@/lib/format'
import { focusCompleteVariants } from '@/lib/motion'
import { clearSession, extendSession } from '@/features/focus/session-store'
import type { ActiveSession } from '@/types/session'

/**
 * The end of a session.
 *
 * Sits under the dial rather than replacing it. The ring is already at full and
 * the room is still the same room — swapping the whole screen for a summary
 * card would throw away the sense of place that the session just built. What
 * changes is that the question in the room is no longer "how long left?" but
 * "what now?", and the answers to that are the only two things on screen.
 *
 * `finishedMs` is frozen at completion, so every number here is stable and this
 * component never subscribes to the clock.
 */

/** Minutes added by "Keep going" — a short extension, not a new session. */
const EXTEND_MINUTES = 10

type SessionCompleteProps = {
  session: ActiveSession
}

function SessionComplete({ session }: SessionCompleteProps) {
  const router = useRouter()
  const focusedMs = session.finishedMs ?? session.bankedMs
  const focused = formatFocused(focusedMs)
  const ranToZero = focusedMs >= session.plannedMs

  return (
    <motion.div
      variants={focusCompleteVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <div className="p-5 sm:p-6 rounded-lg border border-line bg-surface">
        <div className="gap-x-3 gap-y-2 flex flex-wrap items-center">
          <Eyebrow className="text-ink-muted">Session complete</Eyebrow>
          {ranToZero ? (
            <Badge tone="success" size="md">
              Full block
            </Badge>
          ) : (
            <Badge tone="outline" size="md">
              {formatDurationLong(focusedMs / 60_000)} of{' '}
              {formatDurationLong(session.plannedMs / 60_000)}
            </Badge>
          )}
        </div>

        <p className="mt-4 font-medium tracking-tight sm:text-3xl text-2xl text-ink">{focused}</p>

        <p className="mt-1.5 text-sm text-ink-secondary">{session.taskTitle}</p>

        <p className="mt-4 max-w-reading text-sm text-ink-muted">
          {ranToZero
            ? 'You stayed with it for the whole block. That is the part that compounds.'
            : 'You stopped before the clock did. Banked work is still work.'}
        </p>

        <dl className="mt-5 gap-x-4 gap-y-3 pt-4 sm:gap-x-8 grid grid-cols-2 border-t border-line text-xs">
          <Stat term="Focused" value={focused} />
          <Stat term="Planned" value={formatDurationLong(session.plannedMs / 60_000)} />
          <Stat term="Pauses" value={String(session.interruptions)} />
          <Stat term="Notes" value={session.notes.trim() === '' ? 'None' : 'Kept'} />
        </dl>

        <div className="mt-5 gap-2 pt-5 sm:flex-row flex flex-col border-t border-line">
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={() => extendSession(EXTEND_MINUTES)}
          >
            <Plus aria-hidden="true" />
            {`Keep going · ${EXTEND_MINUTES}m`}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => {
              clearSession()
              router.push('/')
            }}
          >
            Back to today
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

type StatProps = {
  term: string
  value: string
}

function Stat({ term, value }: StatProps) {
  return (
    <div>
      <dt className="text-2xs tracking-[0.09em] text-ink-subtle uppercase">{term}</dt>
      <dd className="mt-1 font-medium tnum text-ink-secondary tabular-nums">{value}</dd>
    </div>
  )
}

export { SessionComplete }
export type { SessionCompleteProps }
