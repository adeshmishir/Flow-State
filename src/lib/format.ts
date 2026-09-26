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

/** First name, so the greeting stays short. */
export function firstNameOf(fullName: string): string {
  const [first = fullName] = fullName.trim().split(/\s+/)
  return first
}

/** `1` → `"1 session"`, `4` → `"4 sessions"`. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}
