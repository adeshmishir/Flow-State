'use client'

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'flowstate.sidebar.collapsed'
const CHANGE_EVENT = 'flowstate:sidebar-change'

/**
 * `localStorage` is an external store, so it is read through
 * `useSyncExternalStore` rather than an effect. That gives correct SSR (the
 * server snapshot is always the expanded default) without the setState-in-
 * effect cascade, and it keeps the rail in sync across tabs for free.
 */
function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(CHANGE_EVENT, onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(CHANGE_EVENT, onStoreChange)
  }
}

function getSnapshot(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/** Server render and the first client render always agree on `false`. */
function getServerSnapshot(): boolean {
  return false
}

/**
 * Collapsed state for the desktop rail.
 *
 * A tiny local hook rather than a store — it is a view preference, not
 * product state.
 */
export function useSidebarCollapsed(): [boolean, () => void] {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(!getSnapshot()))
      window.dispatchEvent(new Event(CHANGE_EVENT))
    } catch {
      /* preference simply will not persist */
    }
  }, [])

  return [collapsed, toggle]
}
