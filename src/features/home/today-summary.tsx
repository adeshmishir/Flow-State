import { Eyebrow } from '@/components/ui/eyebrow'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { formatDuration, pluralize } from '@/lib/format'
import type { TodayProgress } from '@/types/session'

type TodaySummaryProps = {
  progress: TodayProgress
  longestBlockMinutes: number
}

/**
 * Today's position, stated in type and one rule rather than a wall of stat
 * cards. Rendered on the server — `Progress` is a static Radix element with no
 * behaviour, so it needs no client JavaScript.
 */
function TodaySummary({ progress, longestBlockMinutes }: TodaySummaryProps) {
  const percent = Math.min(100, Math.round((progress.focusedMinutes / progress.goalMinutes) * 100))

  const rows: readonly { label: string; value: string }[] = [
    { label: 'Sessions', value: String(progress.sessionsCompleted) },
    { label: 'Longest block', value: formatDuration(longestBlockMinutes) },
    { label: 'Streak', value: pluralize(progress.streakDays, 'day') },
  ]

  return (
    <div>
      <Eyebrow>Today</Eyebrow>

      <p className="tnum mt-3 font-medium tracking-tight text-3xl text-ink">
        {formatDuration(progress.focusedMinutes)}
      </p>
      <p className="mt-1 text-xs text-ink-muted">in deep work</p>

      <Progress
        value={percent}
        thickness="sm"
        className="mt-4"
        aria-label={`${percent}% of today's focus goal`}
      />
      <p className="mt-2 text-xs text-ink-subtle">
        {formatDuration(progress.focusedMinutes)} of {formatDuration(progress.goalMinutes)} daily
        goal
      </p>

      <Separator className="my-5" />

      <dl className="space-y-2.5 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="gap-4 flex items-baseline justify-between">
            <dt className="text-ink-muted">{row.label}</dt>
            <dd className="tnum font-medium text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export { TodaySummary }
export type { TodaySummaryProps }
