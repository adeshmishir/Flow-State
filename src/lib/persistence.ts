'use client'

import type { z } from 'zod'

/**
 * Flowstate — persistence
 * ---------------------------------------------------------------------------
 * One door to `localStorage`, and the only file in the app that touches it.
 *
 * The rules this file exists to enforce:
 *
 *   1. **Nothing here can throw at a caller.** A focus tool that refuses to open
 *      because a browser setting is off, or because a stored value is
 *      corrupt, is worse than one that quietly forgets. Every read has a
 *      fallback; every write has a catch.
 *   2. **Stored data is untrusted input.** It was written by an older version of
 *      this app, or by hand in devtools, or by a browser extension. It is
 *      validated against a schema on the way in, and anything that fails
 *      validation is moved aside rather than deleted, so a user who cares about
 *      their data can still get it back.
 *   3. **Every key has a version and a migration path.** Enveloping the payload
 *      means an old value is recognisable as old, which is what makes upgrading
 *      a migration instead of a guess.
 *
 * ## Why an envelope
 *
 * ```json
 * { "v": 2, "d": [ ... ] }
 * ```
 *
 * A bare array cannot say what it is. An envelope can, so a value written by a
 * future version is detected and stepped over instead of being parsed as
 * something it is not.
 *
 * ## Why no context provider
 *
 * Reads happen on demand inside the stores that own the data, never during
 * render, and each store caches its own snapshot. Nothing here holds React
 * state, so adding keys costs nothing for components that never read them.
 */

/** Every key the app persists, in one place so migrations stay discoverable. */
export const STORAGE_KEYS = {
  tasks: 'flowstate.tasks.v1',
  session: 'flowstate.session.v1',
  sessionLog: 'flowstate.session-log.v1',
  preferences: 'flowstate.preferences.v1',
  /** Read by the inline theme bootstrap in `app/layout.tsx`, which cannot import. */
  theme: 'flowstate.theme',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

/** Where an unusable value is moved, so it is recoverable but not in the way. */
function quarantineKey(key: string): string {
  return `${key}.unreadable`
}

/** The version assumed for a payload written before the envelope existed. */
const LEGACY_VERSION = 1

type Envelope = { v: number; d: unknown }

/**
 * What went wrong, so the UI can say something useful instead of silently
 * starting from scratch.
 */
export type PersistenceIssue =
  | { kind: 'unavailable'; detail: string }
  | { kind: 'unreadable'; key: string }
  | { kind: 'future-version'; key: string; found: number }
  | { kind: 'write-failed'; key: string }

const issueListeners = new Set<() => void>()

/**
 * Everything reported so far this session, and the one issue worth showing.
 *
 * A listener alone is not enough. The first store seeds inside the first render
 * — `useSyncExternalStore` calls `getSnapshot` before it ever calls `subscribe` —
 * so a notice that only listened would mount after the interesting problem had
 * already happened and would sit there saying nothing while a person's work is
 * failing to save.
 *
 * This is an external store, so the shell reads it with `useSyncExternalStore`
 * rather than copying it into component state. That is not ceremony: the server
 * has no local storage and so can never have an issue to report, which means its
 * snapshot is always "no problem". A component that read the backlog directly
 * would render *nothing* on the server and then a warning bar in the browser, and
 * React would correctly complain about the two disagreeing. `useSyncExternalStore`
 * is the mechanism built for exactly that disagreement.
 */
const reportedIssues: PersistenceIssue[] = []
let worstIssue: PersistenceIssue | null = null

/**
 * Subscribes to persistence problems.
 *
 * One listener is enough in practice — the shell shows a single, quiet notice
 * when storage is unavailable, and never re-asks for the same key twice per
 * session, so a corrupt value cannot turn into a toast storm.
 */
export function onPersistenceIssue(listener: () => void): () => void {
  issueListeners.add(listener)
  return () => {
    issueListeners.delete(listener)
  }
}

/** The current issue, or `null`. The client snapshot. */
export function getPersistenceIssue(): PersistenceIssue | null {
  return worstIssue
}

/**
 * The server snapshot: no storage means no storage problems.
 *
 * Returning a constant rather than `getPersistenceIssue` is the point. On the
 * server `report` can be reached through a store's initial read, and if that
 * leaked into the rendered HTML the first paint would claim a person's work is
 * unsaveable when the truth is that nothing has been read yet.
 */
export function getServerPersistenceIssue(): PersistenceIssue | null {
  return null
}

const alreadyReported = new Set<string>()

function keyLabel(issue: PersistenceIssue): string {
  return 'key' in issue ? issue.key : 'app'
}

function report(issue: PersistenceIssue): void {
  const fingerprint = `${issue.kind}:${'key' in issue ? keyLabel(issue) : 'app'}`
  if (alreadyReported.has(fingerprint)) return
  alreadyReported.add(fingerprint)

  reportedIssues.push(issue)
  worstIssue = worstOf(reportedIssues)
  for (const listener of issueListeners) listener()
}

/**
 * One issue is one bar. If several keys failed, the most consequential wins:
 * storage being unavailable makes everything else a detail, and an unreadable
 * value is worse news than a value from a newer build, which is merely ignored.
 */
function worstOf(issues: readonly PersistenceIssue[]): PersistenceIssue | null {
  if (issues.length === 0) return null

  const rank: Record<PersistenceIssue['kind'], number> = {
    unavailable: 0,
    'write-failed': 1,
    unreadable: 2,
    'future-version': 3,
  }

  return issues.reduce((worstSoFar, candidate) =>
    rank[candidate.kind] < rank[worstSoFar.kind] ? candidate : worstSoFar,
  )
}

function notifyStorageUnavailable(detail: string): void {
  report({ kind: 'unavailable', detail })
}

/** `false` during server rendering, where there is no `window` to probe. */
function inBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Whether `localStorage` can actually be used.
 *
 * Probed once per page load rather than assumed: Safari in private mode exposes
 * the API and throws on write, and a sandboxed iframe can throw on read. The
 * answer is cached because the failure mode we care about does not change
 * mid-session, and a `try`/`catch` around every read forever is noise.
 *
 * Outside a browser this reports `true` and caches it. That is not a lie and not
 * an optimisation: the server has not been *denied* storage, it simply has no
 * storage yet, and reporting `unavailable` there would raise a storage warning
 * for a condition nobody can act on. It would also poison the server's issue
 * backlog, so the first client render could inherit a failure that never happened.
 */
let availability: boolean | null = null

export function isStorageAvailable(): boolean {
  if (availability !== null) return availability
  if (!inBrowser()) return true

  try {
    const probe = '__flowstate_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    availability = true
  } catch (error) {
    availability = false
    notifyStorageUnavailable(error instanceof Error ? error.message : 'unknown')
  }
  return availability
}

/** Raw read. Returns `null` for "nothing stored" and for "could not read". */
function readRaw(key: string): string | null {
  if (!inBrowser() || !isStorageAvailable()) return null
  try {
    return window.localStorage.getItem(key)
  } catch (error) {
    notifyStorageUnavailable(error instanceof Error ? error.message : 'unknown')
    return null
  }
}

/**
 * Moves a value we cannot use out of the way, then removes it.
 *
 * Removing without keeping would be the wrong call: a schema that is too strict
 * for one record would silently delete a user's whole history. Quarantining
 * costs one extra key and makes the failure recoverable.
 */
function quarantine(key: string, raw: string): void {
  try {
    window.localStorage.setItem(quarantineKey(key), raw)
    window.localStorage.removeItem(key)
  } catch {
    /* Nothing more can be done, and that is acceptable. */
  }
  report({ kind: 'unreadable', key })
}

export type ReadOptions<T> = {
  key: string
  /** Bump when the shape of `T` changes. */
  version: number
  schema: z.ZodType<T>
  /**
   * Upgrades a payload written under an older version. Receives the raw parsed
   * JSON — unvalidated and untrusted — and returns the next shape to validate.
   * Chain one function per version rather than writing a switch that grows.
   */
  migrate?: (data: unknown, fromVersion: number) => unknown
  /** Used when nothing is stored, and when what is stored cannot be trusted. */
  fallback: () => T
}

/**
 * Reads and validates one key.
 *
 * Synchronous by design. `localStorage` is synchronous, every consumer of this
 * already lives in an external store that seeds lazily outside render, and an
 * async read would mean every screen has a loading state for data that is
 * already sitting on the disk.
 */
export function readPersisted<T>({ key, version, schema, migrate, fallback }: ReadOptions<T>): T {
  const raw = readRaw(key)
  if (raw === null) return fallback()

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    quarantine(key, raw)
    return fallback()
  }

  // A bare payload predates the envelope. Recognise it by shape and treat it as
  // the oldest possible version rather than as garbage.
  const isEnvelope =
    typeof parsed === 'object' &&
    parsed !== null &&
    'v' in parsed &&
    'd' in parsed &&
    typeof (parsed as Envelope).v === 'number'

  let payload: unknown
  let storedVersion: number

  if (isEnvelope) {
    const envelope = parsed as Envelope
    storedVersion = envelope.v
    payload = envelope.d
  } else {
    storedVersion = LEGACY_VERSION
    payload = parsed
  }

  // Written by a newer build. We cannot know what it means, and overwriting it
  // would destroy data we do not understand — so it is preserved and ignored.
  if (storedVersion > version) {
    report({ kind: 'future-version', key, found: storedVersion })
    return fallback()
  }

  if (migrate && storedVersion < version) {
    try {
      payload = migrate(payload, storedVersion)
    } catch {
      quarantine(key, raw)
      return fallback()
    }
  }

  const result = schema.safeParse(payload)
  if (!result.success) {
    quarantine(key, raw)
    return fallback()
  }

  return result.data
}

export function writePersisted(key: string, version: number, data: unknown): void {
  if (!inBrowser() || !isStorageAvailable()) return

  const envelope: Envelope = { v: version, d: data }

  try {
    window.localStorage.setItem(key, JSON.stringify(envelope))
  } catch {
    // Almost always quota. The in-memory session continues to work, so this is
    // a warning rather than an error — reported once per key to stay quiet.
    report({ kind: 'write-failed', key })
  }
}

export function removePersisted(key: string): void {
  if (!inBrowser() || !isStorageAvailable()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* nothing to do */
  }
}

/**
 * A one-time, human-readable recovery notice.
 *
 * Returns `null` when nothing went wrong, so the shell can render it directly.
 */
export function describeIssue(issue: PersistenceIssue): string {
  switch (issue.kind) {
    case 'unavailable':
      return 'This browser is not letting Flowstate store anything, so work will not survive a reload.'
    case 'unreadable':
      return 'Some saved data could not be read and was set aside. Flowstate started fresh.'
    case 'future-version':
      return 'Saved data came from a newer version of Flowstate and was left untouched.'
    case 'write-failed':
      return 'Flowstate could not save. Your browser storage may be full.'
  }
}
