'use client'

/**
 * A very small external-store primitive.
 *
 * Stage 2 has exactly two pieces of client state — the task queue and the live
 * session — and neither of them belongs in a context provider: both are read by
 * components that sit in different parts of the tree (the app shell needs to
 * know whether the focus room is open; the setup dialog needs the task list),
 * and a provider would re-render every consumer whenever either changed.
 *
 * `useSyncExternalStore` is the better fit. A module-level store can hand out
 * the *same* snapshot to every subscriber, tear down completely when the last
 * one leaves, and keep ticking state out of React entirely.
 */

type Listener = () => void

export interface ExternalStore<T> {
  getState: () => T
  /** Replace state with the result of `next`. No-ops when the value is identical. */
  setState: (next: T | ((previous: T) => T)) => void
  subscribe: (listener: Listener) => () => void
}

export function createExternalStore<T>(initialState: T): ExternalStore<T> {
  let state = initialState
  const listeners = new Set<Listener>()

  const notify = () => {
    for (const listener of listeners) listener()
  }

  return {
    getState: () => state,

    setState: (next) => {
      const value = typeof next === 'function' ? (next as (previous: T) => T)(state) : next
      if (Object.is(value, state)) return
      state = value
      notify()
    },

    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

/**
 * `localStorage` access, wrapped.
 *
 * Storage can be disabled, full, or throw in private-mode Safari. Every call
 * site treats a miss or a throw as "no stored value yet" rather than treating it
 * as an error, because a focus tool that refuses to start because a browser
 * setting is off would be worse than one that quietly forgets.
 */
export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeLocal(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* state simply will not survive a reload */
  }
}

export function removeLocal(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* nothing to do */
  }
}
