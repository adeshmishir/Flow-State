/**
 * Presentation-only formatting helpers.
 *
 * Stage 1 ships no real session data — these exist so the Home page and the
 * later stages format durations, clocks and dates identically in one place.
 */

const MINUTES_PER_HOUR = 60

/** `95` → `"1h 35m"`, `45` → `"45m"`, `120` → `"2h"`. */
export function formatDuration(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '0m'

  const rounded = Math.round(totalMinutes)
  const hours = Math.floor(rounded / MINUTES_PER_HOUR)
  const minutes = rounded % MINUTES_PER_HOUR

  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

/** Long form, for prose: `95` → `"1 hr 35 min"`. */
export function formatDurationLong(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '0 min'

  const rounded = Math.round(totalMinutes)
  const hours = Math.floor(rounded / MINUTES_PER_HOUR)
  const minutes = rounded % MINUTES_PER_HOUR
  const parts: string[] = []

  if (hours > 0) parts.push(`${hours} hr`)
  if (minutes > 0) parts.push(`${minutes} min`)
  return parts.join(' ')
}

/** `95` → `"1:35"`, `45` → `"0:45"`. For clock readouts. */
export function formatClock(totalMinutes: number): string {
  const safe = Number.isFinite(totalMinutes) && totalMinutes > 0 ? Math.round(totalMinutes) : 0
  const hours = Math.floor(safe / MINUTES_PER_HOUR)
  const minutes = safe % MINUTES_PER_HOUR
  return `${hours}:${String(minutes).padStart(2, '0')}`
}

/** Time-of-day label, e.g. `"14:10"` → `"2:10 PM"`. */
export function formatTimeOfDay(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

/** `"Today"`, `"Yesterday"`, or `"Tue 23 Sep"`. */
export function formatRelativeDay(date: Date, now: Date = new Date()): string {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const dayDiff = Math.round((startOf(now) - startOf(date)) / 86_400_000)

  if (dayDiff === 0) return 'Today'
  if (dayDiff === 1) return 'Yesterday'
  if (dayDiff > 1 && dayDiff < 7) {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date)
  }
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' }).format(date)
}

/** `"Monday, 27 September"`. Used for the page eyebrow. */
export function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

/** Time-aware greeting. Small human touch, no cleverness. */
export function greetingFor(date: Date = new Date()): string {
  const hour = date.getHours()
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 22) return 'Good evening'
  return 'Good night'
}

const SECONDS_PER_MINUTE = 60

/**
 * Stopwatch readout for the focus room: `1_507_000` → `"25:07"`, and past an
 * hour `"1:05:07"`.
 *
 * Deliberately not derived from a stored counter — callers pass elapsed
 * milliseconds, which the timer computes from timestamps, so this stays a pure
 * function of truth rather than a running tally.
 */
export function formatStopwatch(elapsedMs: number): string {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return '0:00'

  const totalSeconds = Math.floor(elapsedMs / 1000)
  const seconds = totalSeconds % SECONDS_PER_MINUTE
  const totalMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE)
  const minutes = totalMinutes % SECONDS_PER_MINUTE
  const hours = Math.floor(totalMinutes / SECONDS_PER_MINUTE)

  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${minutes}:${ss}`
}

/** Screen-reader friendly duration: `1_507_000` → `"25 minutes 7 seconds"`. */
export function formatStopwatchSpoken(elapsedMs: number): string {
  const safe = Number.isFinite(elapsedMs) && elapsedMs > 0 ? Math.floor(elapsedMs / 1000) : 0
  const minutes = Math.floor(safe / SECONDS_PER_MINUTE)
  const seconds = safe % SECONDS_PER_MINUTE

  const minutePart = minutes > 0 ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}` : ''
  const secondPart =
    seconds > 0 || minutes === 0 ? `${seconds} ${seconds === 1 ? 'second' : 'seconds'}` : ''

  return [minutePart, secondPart].filter(Boolean).join(' ')
}

/** First name, so the greeting stays short. */
export function firstNameOf(fullName: string): string {
  const [first = fullName] = fullName.trim().split(/\s+/)
  return first
}
/** `1` → `"1 session"`, `4` → `"4 sessions"`. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

/**
 * Time actually focused, in the words a person would use.
 *
 * `45_000` → `"under a minute"`, `1_500_000` → `"25 min"`.
 *
 * The "under a minute" branch exists because rounding a ninety-second session to
 * "2 min" — or a twenty-second one to "1 min" — is a small lie told in the two
 * places a user is most likely to believe it: the confirmation that saves a
 * session, and the summary a screen reader announces on completion.
 */
export function formatFocused(elapsedMs: number): string {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return 'no focus'
  if (elapsedMs < 60_000) return 'under a minute'
  return formatDuration(elapsedMs / 60_000)
}
