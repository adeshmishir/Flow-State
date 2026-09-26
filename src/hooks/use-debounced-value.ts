'use client'

import { useEffect, useState } from 'react'

/**
 * A value that catches up `delay` milliseconds after it stops changing.
 *
 * Used for search inputs, and nowhere else. Two reasons it is a hook and not a
 * `setTimeout` in each component:
 *
 *   • the timer is cleaned up on unmount, so a search does not set state on a
 *     component that has gone away;
 *   • the pending value is dropped when the input is cleared, so results do not
 *     flash back to a stale list for one frame.
 *
 * The delay is short on purpose. A local store with a few hundred records is
 * filtered in well under a millisecond, so this is here to batch keystrokes, not
 * to protect the CPU — a 300ms debounce on search feels like a lag, and lag is
 * worse than the work it avoids.
 */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return settled
}

export { useDebouncedValue }
