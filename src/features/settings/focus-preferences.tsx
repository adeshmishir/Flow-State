'use client'

import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { SegmentedRadio, type SegmentedOption } from '@/components/ui/segmented-radio'
import { setPreferences, usePreferences } from '@/features/preferences/preferences-store'
import { SESSION_LENGTH_OPTIONS, toSessionLength } from '@/features/session/session-form-schema'
import { formatDuration } from '@/lib/format'
import type { Preferences } from '@/types/session'

/* The two narrowings below exist because a radio group hands back strings, and
   because the rendered label should be the same one the dialog uses. Routing both
   through the session form's helper means Settings can never offer a default the
   session dialog is unable to show. */
function toSessionDuration(value: string): Preferences['defaultSessionMinutes'] {
  const minutes = Number(value)
  return Number(toSessionLength(minutes, 50)) as Preferences['defaultSessionMinutes']
}

function toWeekStart(value: string): Preferences['weekStartsOn'] {
  const parsed = Number(value)
  return parsed === 0 || parsed === 6 ? parsed : 1
}

/**
 * Focus preferences.
 *
 * Three settings, each of which removes a question the app would otherwise have
 * to ask on every session:
 *
 *   • **Daily goal** — the denominator of the only progress bar in the product.
 *     Set it to something you have actually hit before, or the bar becomes a way
 *     to feel bad about a Tuesday.
 *   • **Default length** — which segment the session dialog opens on. The three
 *     options are the lengths the product already offers; there is no free-text
 *     field, because someone who wants 37 minutes picks it in the dialog and this
 *     is only the guess.
 *   • **Week starts on** — the only thing that changes where "this week" begins.
 *
 * ## Writes are immediate
 *
 * There is no Save button. A preference that is already visible on another screen
 * should change the moment it is changed, and a Save button on a form whose
 * entire contents are three values is a form pretending to need a transaction.
 * The goal field is the exception: it commits on blur, because a number mid-edit
 * is a number being typed, not a number chosen.
 *
 * ## Confirmations are for screen readers
 *
 * Every control writes through to storage and back to every screen that reads it,
 * so a change here is visible on Home immediately. The `aria-live` region exists
 * because otherwise there is no confirmation at all for anyone who cannot see the
 * bar move on another route.
 */

const GOAL_BOUNDS = { min: 15, max: 960 } as const

const GOAL_PRESETS: readonly SegmentedOption<string>[] = [
  { value: '60', label: '1h' },
  { value: '180', label: '3h' },
  { value: '360', label: '6h' },
  { value: '480', label: '8h' },
]

const WEEK_OPTIONS: readonly SegmentedOption<string>[] = [
  { value: '1', label: 'Monday' },
  { value: '0', label: 'Sunday' },
  { value: '6', label: 'Saturday' },
]

const LENGTH_OPTIONS: readonly SegmentedOption<string>[] = SESSION_LENGTH_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}))

function FocusPreferences() {
  const preferences = usePreferences()
  const [announcement, setAnnouncement] = useState('')

  const announce = (message: string) => {
    setAnnouncement(message)
  }

  return (
    <div className="gap-8 flex flex-col">
      <fieldset>
        <legend className="text-2xs tracking-[0.09em] text-ink-muted uppercase">
          Daily focus goal
        </legend>

        <p className="mt-2 max-w-reading text-xs text-ink-muted">
          The target behind today’s progress bar. Flowstate will not chase it — there are no streaks
          to defend and no notifications for missing it.
        </p>

        <div className="mt-4 gap-3 flex flex-wrap items-center">
          <div className="w-28 relative">
            <Input
              type="number"
              inputMode="numeric"
              min={GOAL_BOUNDS.min}
              max={GOAL_BOUNDS.max}
              step={15}
              // Uncontrolled on purpose: the value is only committed on blur, and
              // a controlled field would reformat `2` to `0` the instant it was
              // typed.
              defaultValue={preferences.dailyGoalMinutes}
              key={preferences.dailyGoalMinutes}
              aria-label="Daily focus goal in minutes"
              className="no-spinner pr-10"
              onBlur={(event) => {
                const parsed = Number(event.target.value)
                const clamped = Math.min(
                  GOAL_BOUNDS.max,
                  Math.max(GOAL_BOUNDS.min, Number.isFinite(parsed) ? Math.round(parsed) : 0),
                )
                event.target.value = String(clamped)

                if (clamped !== preferences.dailyGoalMinutes) {
                  setPreferences({ dailyGoalMinutes: clamped })
                  announce(`Daily goal set to ${formatDuration(clamped)}`)
                }
              }}
            />
            <span
              aria-hidden="true"
              className="inset-y-0 right-3 pointer-events-none absolute flex items-center text-2xs text-ink-subtle"
            >
              min
            </span>
          </div>

          <div className="gap-2 flex flex-wrap">
            {GOAL_PRESETS.map((preset) => {
              const minutes = Number(preset.value)
              const active = preferences.dailyGoalMinutes === minutes

              return (
                <button
                  key={preset.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setPreferences({ dailyGoalMinutes: minutes })
                    announce(`Daily goal set to ${formatDuration(minutes)}`)
                  }}
                  className={
                    active
                      ? 'h-9 px-3 font-medium rounded-md border border-accent bg-accent-soft text-sm text-accent-soft-ink transition-colors duration-150 ease-standard'
                      : 'h-9 px-3 rounded-md border border-line bg-surface text-sm text-ink-secondary transition-colors duration-150 ease-standard hover:border-line-strong hover:text-ink'
                  }
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>

        <p className="mt-2 text-2xs text-ink-subtle">
          Between {GOAL_BOUNDS.min} and {GOAL_BOUNDS.max} minutes.
        </p>
      </fieldset>

      <SegmentedRadio
        legend="Default session length"
        name="default-session-length"
        value={String(preferences.defaultSessionMinutes)}
        onValueChange={(value) => {
          setPreferences({ defaultSessionMinutes: toSessionDuration(value) })
          announce(`Default session set to ${formatDuration(Number(value))}`)
        }}
        options={LENGTH_OPTIONS}
        hint="Which length the session dialog opens on. You can still pick another each time."
      />

      <SegmentedRadio
        legend="Week starts on"
        name="week-starts-on"
        value={String(preferences.weekStartsOn)}
        onValueChange={(value) => {
          setPreferences({ weekStartsOn: toWeekStart(value) })
          const label = WEEK_OPTIONS.find((option) => option.value === value)?.label ?? 'Monday'
          announce(`Weeks now start on ${label}`)
        }}
        options={WEEK_OPTIONS}
        hint="Where “this week” begins in history and insights."
      />

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}

export { FocusPreferences }
