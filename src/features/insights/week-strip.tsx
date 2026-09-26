'use client'

import { useId } from 'react'

import { dailySeries } from '@/features/insights/derive'
import { formatDuration, formatRelativeDay } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { SessionLogEntry } from '@/types/session'

/**
 * A week of focus, as seven bars.
 *
 * ## Why hand-drawn SVG
 *
 * A charting library is 40–150kB, brings its own colour system that would have to
 * be overridden to match this one, and offers nothing here that seven `<div>`s
 * do not. This is a fixed shape with no zoom, no tooltip library and no axes to
 * configure, so the honest implementation is the small one.
 *
 * ## Why it is not interactive
 *
 * Hover states on a bar invite a click. A click that does nothing is worse than
 * no affordance, and building a real tooltip plus a drill-down is a feature for
 * a stage that has more than a week of data to drill into. The numbers are on the
 * label and in the accessible description, so nothing is hidden behind the
 * absence of a tooltip.
 *
 * ## Bars, not a line
 *
 * Focus is a quantity accumulated per day, not a continuous measurement. A line
 * implies a value between two days that never existed, and it would draw a
 * diagonal across weekends.
 */

const DAYS = 7

type WeekStripProps = {
  log: readonly SessionLogEntry[]
  now: number
  className?: string
}

function WeekStrip({ log, now, className }: WeekStripProps) {
  const series = dailySeries(log, now, DAYS)
  const titleId = useId()

  const peak = Math.max(1, ...series.map((point) => point.focusedMinutes))
  const total = series.reduce((sum, point) => sum + point.focusedMinutes, 0)
  const activeDays = series.filter((point) => point.focusedMinutes > 0).length

  const summary =
    total === 0
      ? 'No focus logged in the last seven days.'
      : `${formatDuration(total)} across ${activeDays} ${activeDays === 1 ? 'day' : 'days'} in the last seven days.`

  return (
    <figure aria-labelledby={titleId} className={cn('m-0', className)}>
      <figcaption id={titleId} className="sr-only">
        {summary}
      </figcaption>

      <div className="gap-1.5 sm:gap-2 flex items-end" aria-hidden="true">
        {series.map((point) => {
          const height =
            point.focusedMinutes === 0 ? 0 : Math.max(6, (point.focusedMinutes / peak) * 100)
          const isToday = point.dayStart === series[series.length - 1]?.dayStart

          return (
            <div key={point.dayStart} className="min-w-0 gap-2 flex flex-1 flex-col items-center">
              {/* A fixed-height track so a zero day keeps its place in the row
                  instead of collapsing the chart's rhythm. */}
              <div className="h-24 flex w-full items-end">
                <div
                  className={cn(
                    'w-full rounded-sm transition-[height] duration-300 ease-standard',
                    point.focusedMinutes === 0
                      ? 'bg-line-subtle'
                      : isToday
                        ? 'bg-accent'
                        : 'bg-accent/45',
                  )}
                  style={{ height: `${height}%` }}
                />
              </div>

              <span
                className={cn(
                  'tnum truncate text-2xs',
                  isToday ? 'font-medium text-ink' : 'text-ink-subtle',
                )}
              >
                {formatRelativeDay(new Date(point.dayStart), new Date(now)) === 'Today'
                  ? 'Now'
                  : new Intl.DateTimeFormat('en-US', { weekday: 'narrow' }).format(
                      new Date(point.dayStart),
                    )}
              </span>
            </div>
          )
        })}
      </div>
    </figure>
  )
}

export { WeekStrip }
export type { WeekStripProps }
