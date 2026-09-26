'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'flowstate.theme'
const CHANGE_EVENT = 'flowstate:theme-change'

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(CHANGE_EVENT, onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(CHANGE_EVENT, onStoreChange)
  }
}

function getSnapshot(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    /* storage unavailable */
  }
  return 'system'
}

/**
 * The inline bootstrap in `app/layout.tsx` reads the same key before first
 * paint, so starting from `system` on the server never causes a mismatch.
 */
function getServerSnapshot(): ThemePreference {
  return 'system'
}

/**
 * Shell-level appearance preference.
 *
 * Reading the preference goes through `useSyncExternalStore`; applying it is a
 * genuine side effect on the document, which is what the effect below is for.
 * The `system` case follows the OS, so a laptop that flips to light at noon
 * takes Flowstate with it.
 */
export function useTheme(): {
  preference: ThemePreference
  setPreference: (next: ThemePreference) => void
} {
  const preference = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)')

    const apply = () => {
      const dark = preference === 'dark' || (preference === 'system' && !media.matches)
      document.documentElement.classList.toggle('dark', dark)
    }

    apply()

    if (preference !== 'system') return undefined
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [preference])

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
      window.dispatchEvent(new Event(CHANGE_EVENT))
    } catch {
      /* preference simply will not persist */
    }
  }, [])

  return { preference, setPreference }
}
