'use client'

import { useSyncExternalStore } from 'react'

import { VERSIONS, preferencesSchema } from '@/features/persistence/persisted-schemas'
import { createExternalStore } from '@/lib/local-store'
import { STORAGE_KEYS, readPersisted, writePersisted } from '@/lib/persistence'
import type { Preferences, SessionDuration } from '@/types/session'

/**
 * User preferences.
 *
 * Three fields, each read in at least two places, each answering a question the
 * alternative of asking again would be worse. That is the whole bar for a
 * preference existing: it has to remove a prompt, not decorate a screen.
 *
 *   dailyGoalMinutes      the only progress bar in the product
 *   defaultSessionMinutes what the setup dialog offers first
 *   weekStartsOn          where "this week" begins in history and insights
 *
 * Server snapshot is the default object, which is also the fallback — so the
 * server and the first client render always agree, and a user who has never
 * opened Settings sees exactly the defaults.
 */

const DEFAULTS: Preferences = {
  dailyGoalMinutes: 180,
  defaultSessionMinutes: 50,
  weekStartsOn: 1,
}

function load(): Preferences {
  return readPersisted({
    key: STORAGE_KEYS.preferences,
    version: VERSIONS.preferences,
    schema: preferencesSchema,
    fallback: () => DEFAULTS,
  })
}

const store = createExternalStore<Preferences>(DEFAULTS)

let seeded = false

function ensureSeeded(): void {
  if (seeded) return
  seeded = true
  const stored = load()
  // Only replace when different, so a default-only user causes no notification.
  if (stored !== DEFAULTS) store.setState(stored)
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(
    (listener) => {
      ensureSeeded()
      return store.subscribe(listener)
    },
    () => {
      ensureSeeded()
      return store.getState()
    },
    () => DEFAULTS,
  )
}

export function getPreferences(): Preferences {
  ensureSeeded()
  return store.getState()
}

export function setPreferences(patch: Partial<Preferences>): void {
  ensureSeeded()
  const next = { ...store.getState(), ...patch }
  store.setState(next)
  writePersisted(STORAGE_KEYS.preferences, VERSIONS.preferences, next)
}

/** The length a new session should offer first. */
export function defaultSessionMinutes(): SessionDuration {
  return getPreferences().defaultSessionMinutes
}

export function dailyGoalMinutes(): number {
  return getPreferences().dailyGoalMinutes
}

export const DEFAULT_PREFERENCES = DEFAULTS
