'use client'

import { useSyncExternalStore } from 'react'

import { getSession, subscribeToSession } from '@/features/focus/session-store'

/**
 * Whether the app chrome should get out of the way.
 *
 * The room asks the shell to recede — top bar and tab bar slide out, the
 * desktop rail narrows to its icon form — by flipping one attribute on the shell
 * root. The transition is CSS, not Motion, so it is interruptible, costs nothing
 * per frame, and is disabled outright under reduced motion.
 *
 * Read as a boolean subscription rather than context: the shell needs a single
 * fact, and a provider would re-render the whole frame on every status change.
 *
 * A finished session is not a focus room. Once the clock is done the user is
 * reading a summary and deciding what is next, and the navigation that offers
 * "next" should be back.
 */
export function useIsFocusRoom(): boolean {
  return useSyncExternalStore(
    subscribeToSession,
    () => {
      const session = getSession()
      return session !== null && session.status !== 'completed'
    },
    () => false,
  )
}
