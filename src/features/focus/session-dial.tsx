'use client'

import { useCallback, useId } from 'react'

import { formatDuration, formatStopwatch, formatStopwatchSpoken } from '@/lib/format'
import { useNowTick } from '@/lib/ticker'
import { cn } from '@/lib/utils'
import { focusedMs, remainingMs, sessionProgress } from '@/features/focus/session-store'
import type { ActiveSession, SessionStatus } from '@/types/session'

/**
 * The session instrument.
 *
 * A ring rather than a bar, because a bar makes a 50-minute session look like a
 * download and this is not one. The ring reads as a dial: it has a face, a
 * scale, and a needle you can glance at from across a desk — which is the only
 * thing a person mid-thought actually needs from this screen.
 *
 * ## Why this is its own component
 *
 * This is the only part of the room that changes every 500ms. Isolating it here
 * means the task title, the controls, the notes, the shortcuts and the app shell
 * all sit outside its render path — pausing, the notes panel and the
 * confirmation dialog never pay for the clock, and the clock never pays for
 * them.
 *
 * The arc is animated with a plain CSS transition on `stroke-dashoffset` rather
 * than a re-render per frame: React updates the value twice a second, the
 * compositor interpolates between them.
 */

const TICK_COUNT = 12
const VIEWBOX = 100
const CENTER = VIEWBOX / 2
const RADIUS = 45
const STROKE = 2.6

/** Radii for the twelve minute marks that sit just outside the ring. */
const TICK_INNER = 49.4
const TICK_OUTER = 52.2

function tickMark(index: number): { x1: number; y1: number; x2: number; y2: number } {
  const angle = (index * 360) / TICK_COUNT
  const radians = (angle * Math.PI) / 180
  const sin = Math.sin(radians)
  const cos = Math.cos(radians)

  return {
    x1: CENTER + TICK_INNER * sin,
    y1: CENTER - TICK_INNER * cos,
    x2: CENTER + TICK_OUTER * sin,
    y2: CENTER - TICK_OUTER * cos,
  }
}

const TICKS = Array.from({ length: TICK_COUNT }, (_, index) => tickMark(index))

const statusMeta: Record<
  SessionStatus,
  { label: string; arc: string; tick: string; tickStroke: string; ring: string }
> = {
  running: {
    label: 'Running',
    arc: 'stroke-accent',
    tick: 'bg-accent',
    tickStroke: 'stroke-accent',
    ring: 'stroke-line',
  },
  paused: {
    // Muted rather than coloured: a paused session should read as *held*, and
    // dropping the accent says that before the word does.
    label: 'Paused',
    arc: 'stroke-ink-subtle',
    tick: 'bg-ink-subtle',
    tickStroke: 'stroke-ink-subtle',
    ring: 'stroke-line',
  },
  completed: {
    label: 'Complete',
    arc: 'stroke-success',
    tick: 'bg-success',
    tickStroke: 'stroke-success',
    ring: 'stroke-line',
  },
}

type SessionDialProps = {
  session: ActiveSession
  className?: string
}

function SessionDial({ session, className }: SessionDialProps) {
  const isRunning = session.status === 'running'

  // Gated on running: a paused or completed session reads from its own frozen
  // timestamps, so it has no use for a clock, and saying so lets the shared
  // interval shut down entirely while the room is idle.
  const isActive = useCallback(() => isRunning, [isRunning])

  // A session that has just started is at its full plan on the server, so that
  // is the correct hydration value; the ticker corrects it on the first tick.
  const now = useNowTick(session.plannedMs, isActive)

  const progress = sessionProgress(session, now)
  const remaining = remainingMs(session, now)
  const elapsed = focusedMs(session, now)

  const meta = statusMeta[session.status]
  const spokenId = useId()
  const litTicks = Math.min(TICK_COUNT - 1, Math.floor(progress * TICK_COUNT))

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        role="timer"
        aria-label="Time remaining in this session"
        aria-describedby={spokenId}
        className="sm:w-[min(20rem,60vw)] relative grid aspect-square w-[min(17.5rem,66vw)] place-items-center"
      >
        <svg
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          aria-hidden="true"
          className="inset-0 absolute size-full overflow-visible"
        >
          {/* Minute scale. Lit marks show how far through the plan you are. */}
          {TICKS.map((tick, index) => (
            <line
              key={index}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              strokeWidth={0.8}
              strokeLinecap="round"
              className={cn(
                'transition-[stroke] duration-500 ease-linear motion-reduce:transition-none',
                index <= litTicks ? meta.tickStroke : 'stroke-line-strong/45',
              )}
            />
          ))}

          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className={cn('transition-[stroke] duration-500', meta.ring)}
          />

          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - progress}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
            className={cn(
              'transition-[stroke-dashoffset,stroke] duration-500 ease-linear motion-reduce:transition-none',
              meta.arc,
            )}
          />
        </svg>

        <div className="relative flex flex-col items-center">
          <span
            aria-hidden="true"
            className="font-medium tnum font-mono text-[clamp(3.1rem,17vw,4.75rem)] leading-none tracking-[-0.03em] text-ink tabular-nums"
          >
            {formatStopwatch(remaining)}
          </span>
        </div>
      </div>

      <p id={spokenId} className="sr-only">
        {formatStopwatchSpoken(remaining)} remaining of {formatDuration(session.plannedMs / 60_000)}
        .
      </p>

      <p className="mt-5 gap-x-2.5 gap-y-1 flex flex-wrap items-center justify-center text-xs text-ink-muted">
        <span className="gap-1.5 inline-flex items-center">
          <span
            aria-hidden="true"
            className={cn(
              'size-1.5 rounded-full transition-colors duration-500 motion-reduce:transition-none',
              meta.tick,
              isRunning && 'focus-breath',
            )}
          />
          {meta.label}
        </span>
        <span aria-hidden="true" className="h-3 w-px bg-line" />
        <span className="tnum">
          {formatStopwatch(elapsed)} of {formatStopwatch(session.plannedMs)}
        </span>
      </p>
    </div>
  )
}

export { SessionDial }
export type { SessionDialProps }
