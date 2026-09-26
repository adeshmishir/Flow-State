/**
 * Local-calendar helpers.
 *
 * "Today" has to mean the user's day, not UTC's, and it has to keep meaning it
 * across a daylight-saving change. The only reliable way to do both is to work in
 * local `Date` parts rather than in milliseconds — 23 hours is not always a day,
 * and `now - 86_400_000` quietly gets that wrong twice a year.
 *
 * Every function here is pure, synchronous and server-safe, so the same code
 * computes "today" for a server-rendered page and for a client component.
 */

/** Local midnight at the start of the day containing `ms`. */
export function startOfDay(ms: number): number {
  const date = new Date(ms)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/** `startOfDay` shifted by whole days, using the calendar rather than 24h. */
export function addDays(ms: number, days: number): number {
  const date = new Date(startOfDay(ms))
  date.setDate(date.getDate() + days)
  return date.getTime()
}

export function isSameDay(a: number, b: number): boolean {
  return startOfDay(a) === startOfDay(b)
}

/** Whole days between two instants, by calendar day rather than by duration. */
export function daysBetween(from: number, to: number): number {
  return Math.round((startOfDay(to) - startOfDay(from)) / 86_400_000)
}

/** Local midnight on the most recent Monday, or Sunday when `weekStartsOn` is 0. */
export function startOfWeek(ms: number, weekStartsOn: 0 | 1 | 6 = 1): number {
  const date = new Date(startOfDay(ms))
  const shift = (date.getDay() - weekStartsOn + 7) % 7
  date.setDate(date.getDate() - shift)
  return date.getTime()
}

/** Inclusive list of local midnights, oldest first. */
export function dayRange(endMs: number, days: number): number[] {
  const last = startOfDay(endMs)
  return Array.from({ length: days }, (_, index) => addDays(last, index - days + 1))
}

/** `"2026-09-27"` in local time — a stable key for grouping by day. */
export function dayKey(ms: number): string {
  const date = new Date(ms)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
