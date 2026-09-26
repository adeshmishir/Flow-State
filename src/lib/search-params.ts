/**
 * Read a single value out of a Next.js `searchParams` entry.
 * Repeated and array params collapse to their first value; anything else is
 * treated as absent.
 */
export function firstStringParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    const [first] = value
    return typeof first === 'string' ? first : null
  }
  return null
}

/** The shared App Router `searchParams` shape. */
export type SearchParams = Record<string, string | string[] | undefined>
