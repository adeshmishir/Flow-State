'use client'

import { useSyncExternalStore } from 'react'

/**
 * One shared clock for the whole application.
 *
 * The naive timer — `setRemaining(remaining - 1000)` — is wrong in three ways
 * at once: it drifts, it cannot survive a throttled background tab, and it
 * forces every consumer to re-render on every tick. So nothing in Flowstate
 * ever *stores* a countdown.
 *
 * Instead there is exactly one interval for the entire app, it publishes the
 * current wall-clock time, and every elapsed value is derived from timestamps.
 *
 * The interval is reference-counted: it starts with the first interested
 * subscriber and is torn down with the last, so an idle application holds no
 * timer at all. Subscribers can also be *gated* — a paused session has no use
 * for a clock, and saying so lets the interval shut down while the room is on
 * screen. A paused session is frozen in its own timestamps, not by the clock
 * stopping, so nothing is lost by letting it.
 */

/** 500ms: twice a second is smooth enough for a CSS-transitioned ring, and half
 *  the renders a 1s tick would need for the seconds readout. */
const TICK_INTERVAL_MS = 500

type Listener = () => void

/**
 * A subscriber that may only care some of the time — the dial only wants ticks
 * while running, for instance.
 */
type Subscriber = {
  listener: Listener
  /** Re-read on every tick. Returning false means "do not wake me". */
  isActive: () => boolean
}

const subscribers = new Set<Subscriber>()

/**
 * Cached timestamp. `useSyncExternalStore` requires a stable value between
 * notifications — returning a fresh `Date.now()` here would spin React. It stays
 * valid (merely stale) while the clock is stopped, which is what makes a gated
 * subscriber safe.
 */
let currentTime = Date.now()
let intervalId: number | null = null

/** Whether at least one subscriber currently wants to be woken. */
function hasInterest(): boolean {
  for (const subscriber of subscribers) {
    if (subscriber.isActive()) return true
  }
  return false
}

function notify() {
  currentTime = Date.now()
  for (const subscriber of subscribers) {
    if (subscriber.isActive()) subscriber.listener()
  }

  // The last interested subscriber can go quiet between ticks (a pause, a
  // completion). Nothing is left to drive an interval, so drop it.
  if (!hasInterest()) stopClock()
}

/**
 * Background tabs get their timers clamped, so a session that ran to zero while
 * hidden would not be noticed until the next lucky tick. Settle immediately on
 * the way back in instead.
 */
function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && hasInterest()) notify()
}

function ensureRunning() {
  if (intervalId !== null) return
  currentTime = Date.now()
  intervalId = window.setInterval(notify, TICK_INTERVAL_MS)
  document.addEventListener('visibilitychange', handleVisibilityChange)
}

/**
 * Wakes the clock and settles every interested subscriber immediately.
 *
 * Needed because a gated subscriber cannot wake the clock by itself: when a
 * paused session resumes, the only thing that has changed is the session, and
 * React will re-read a snapshot that the stopped clock has not refreshed. The
 * session engine calls this on every transition into `running`.
 */
export function startClock(): void {
  currentTime = Date.now()
  ensureRunning()
  for (const subscriber of subscribers) {
    if (subscriber.isActive()) subscriber.listener()
  }
}

/** Releases the interval. Pending subscribers stay registered; they re-arm. */
function stopClock() {
  if (intervalId !== null) {
    window.clearInterval(intervalId)
    intervalId = null
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange)
}

function subscribe(subscriber: Subscriber): () => void {
  subscribers.add(subscriber)
  if (subscriber.isActive()) ensureRunning()

  return () => {
    subscribers.delete(subscriber)
    if (subscribers.size === 0) stopClock()
  }
}

function getSnapshot(): number {
  return currentTime
}

/**
 * Subscribe a component to the shared clock.
 *
 * `serverFallback` is what the server renders and what the first client render
 * must agree with. Pass the value that is correct *at zero* elapsed time (a full
 * plan, for instance) so hydration is exact for a session that is just starting;
 * the store corrects it on the first tick after mount.
 *
 * `isActive` is optional. Pass it to let a component drop out of the tick while
 * it has nothing to animate, which is what shuts the interval down for a paused
 * or completed session.
 */
export function useNowTick(serverFallback: number, isActive?: () => boolean): number {
  return useSyncExternalStore(
    (listener) => subscribe({ listener, isActive: isActive ?? always }),
    getSnapshot,
    () => serverFallback,
  )
}

/** Non-React subscription, for logic that only needs to *react* to the clock. */
export function subscribeToClock(listener: Listener, isActive?: () => boolean): () => void {
  return subscribe({ listener, isActive: isActive ?? always })
}

function always() {
  return true
}
