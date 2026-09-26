'use client'

import { ValueSwap } from '@/components/motion/value-swap'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { formatDuration, pluralize } from '@/lib/format'

type TodaySummaryProps = {
  focusedMinutes: number
  sessionsCompleted: number
  longestBlockMinutes: number
  averageBlockMinutes: number
  streakDays: number
  goalMinutes: number
}

/**
 * Today's position, stated in type and one rule rather than a wall of stat
 * cards.
 *
 * Props are flat numbers rather than an object of stats because the parent
 * already computed them through the shared derivation layer — this component
 * formats, it does not decide. That split is what keeps "today" consistent
 * between this card and History, which asks the same question.
 *
 * The goal is capped at 100% rather than allowed to overflow: past the goal the
 * bar is finished, and a bar at 180% implies the goal moved.
 */
function TodaySummary({
  focusedMinutes,
  sessionsCompleted,
  longestBlockMinutes,
  averageBlockMinutes,
  streakDays,
  goalMinutes,
}: TodaySummaryProps) {
  const goal = goalMinutes > 0 ? goalMinutes : 1
  const percent = Math.min(100, Math.round((focusedMinutes / goal) * 100))
  const met = focusedMinutes >= goal

  const rows: readonly { label: string; value: string }[] = [
    { label: 'Sessions', value: String(sessionsCompleted) },
    { label: 'Longest block', value: formatDuration(longestBlockMinutes) },
    { label: 'Average block', value: formatDuration(averageBlockMinutes) },
    { label: 'Streak', value: pluralize(streakDays, 'day') },
  ]

  return (
    <div>
      <Eyebrow>Today</Eyebrow>

      <p className="tnum mt-3 font-medium tracking-tight text-3xl text-ink">
        <ValueSwap value={formatDuration(focusedMinutes)} />
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        {sessionsCompleted === 0 ? 'no blocks yet' : 'in deep work'}
      </p>

      <Progress
        value={percent}
        tone={met ? 'success' : 'accent'}
        thickness="sm"
        className="mt-4"
        aria-label={`${percent}% of today's focus goal`}
      />
      <p className="mt-2 text-xs text-ink-muted">
        {met ? (
          <>
            Goal met — {formatDuration(focusedMinutes - goalMinutes)} past {formatDuration(goal)}
          </>
        ) : (
          <>
            {formatDuration(focusedMinutes)} of {formatDuration(goal)} daily goal
          </>
        )}
      </p>

      <Separator className="my-5" />

      <dl className="space-y-2.5 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="gap-4 flex items-baseline justify-between">
            <dt className="text-ink-muted">{row.label}</dt>
            <dd className="tnum font-medium text-ink">
              <ValueSwap value={row.value} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export { TodaySummary }
export type { TodaySummaryProps }
