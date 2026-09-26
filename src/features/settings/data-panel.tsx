'use client'

import { Download, HardDrive, Trash2 } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Separator } from '@/components/ui/separator'
import { useSessionLog } from '@/features/focus/session-store'
import { useTasks } from '@/features/tasks/task-store'
import { usePreferences } from '@/features/preferences/preferences-store'
import { toast } from '@/components/ui/toast'
import { pluralize } from '@/lib/format'
import {
  STORAGE_KEYS,
  getPersistenceIssue,
  getServerPersistenceIssue,
  onPersistenceIssue,
} from '@/lib/persistence'

/**
 * Your data.
 *
 * ## Why a local-only product owes this screen
 *
 * There is no account and no server, which means there is also no "download my
 * data" button that somebody else's backend provides for free. Everything
 * Flowstate knows lives in five `localStorage` keys, and a person who wants to
 * keep it — or who wants it gone — needs a way to do both that does not involve
 * opening devtools.
 *
 * The export is a single JSON file, deliberately not a spreadsheet: it is the
 * same shape the app reads, so it can be moved back in, and a task queue with
 * notes in it is not a thing a CSV represents well.
 *
 * ## Why reset is behind a typed confirmation
 *
 * `ConfirmDialog` already blocks the accidental click. This adds the one thing it
 * cannot: it is only enabled once the person has acknowledged that the sessions
 * are going too. Deleting forty hours of focus history to tidy up a task list is
 * the worst outcome this screen can produce, so the last step is deliberately the
 * slowest.
 */

type DataPanelProps = {
  /** Seeding after a reset needs a reload, because stores hold module state. */
  onResetComplete?: () => void
}

function DataPanel({ onResetComplete }: DataPanelProps) {
  const log = useSessionLog()
  const preferences = usePreferences()

  const [confirming, setConfirming] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)

  // Through the hook, not `getTasks()`.
  //
  // The store publishes a server snapshot of the fixture seed precisely so the
  // server-rendered HTML and the first client render agree. Reading the module
  // directly skips that: the browser answers with whatever is in `localStorage`,
  // so a person with an extra task got a hydration mismatch on this panel — the
  // server said "4 tasks" and the client insisted on "5" — and React threw the
  // subtree away and rebuilt it. The count is on screen three times here, so the
  // mismatch was also the most visible one on the page.
  const tasks = useTasks()

  // Availability is read from the persistence issue store rather than by calling
  // `isStorageAvailable()` during render.
  //
  // The probe has no answer to give on the server — there is no `localStorage`
  // there — so a direct call returns `false` in the server-rendered HTML and `true`
  // in the browser. The export button would ship disabled and the "cannot store
  // anything" warning would appear and then vanish, which is both a hydration
  // mismatch and a lie in whichever direction it went wrong. The store's server
  // snapshot is `null`, meaning "no problem reported", which is exactly true.
  const issue = useSyncExternalStore(
    onPersistenceIssue,
    getPersistenceIssue,
    getServerPersistenceIssue,
  )
  const available = issue === null || issue.kind !== 'unavailable'

  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'flowstate',
      schemaVersion: 1,
      tasks,
      sessions: log,
      preferences,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `flowstate-${new Date().toISOString().slice(0, 10)}.json`
    link.click()

    // The object URL is a live handle on the blob; releasing it is the only way it
    // gets collected, and a long-lived page can accumulate these.
    URL.revokeObjectURL(url)

    toast.success('Exported', {
      description: `${pluralize(tasks.length, 'task')} and ${pluralize(log.length, 'session')}`,
    })
  }

  const resetEverything = () => {
    if (!acknowledged) return

    for (const key of Object.values(STORAGE_KEYS)) {
      try {
        window.localStorage.removeItem(key)
      } catch {
        /* reported elsewhere by the persistence notice */
      }
    }
    // Any value this build set aside for recovery goes with it, or a "reset"
    // that leaves the old data sitting in a quarantine key is not a reset.
    try {
      for (const key of Object.keys(window.localStorage)) {
        if (key.includes('.unreadable')) window.localStorage.removeItem(key)
      }
    } catch {
      /* nothing more to do */
    }

    onResetComplete?.()
    window.location.reload()
  }

  return (
    <div>
      <Eyebrow>Your data</Eyebrow>

      <p className="mt-2 max-w-reading text-sm text-ink-muted">
        {pluralize(tasks.length, 'task')} and {pluralize(log.length, 'session')} are stored in this
        browser, on this device. Nothing is uploaded.
      </p>

      {!available ? (
        <p className="mt-3 p-3 max-w-reading rounded-md border border-warning/30 bg-warning-soft text-xs text-ink">
          This browser is not letting Flowstate store anything, so there is nothing here to export.
          A banner at the top of the app has more detail.
        </p>
      ) : null}

      <Separator className="my-6" />

      <div className="gap-3 flex flex-wrap items-center">
        <Button type="button" variant="outline" onClick={exportData} disabled={!available}>
          <Download aria-hidden="true" />
          Export as JSON
        </Button>

        <Button type="button" variant="ghost" onClick={() => setConfirming(true)}>
          <Trash2 aria-hidden="true" />
          Delete everything
        </Button>
      </div>

      <p className="mt-3 max-w-reading text-2xs text-ink-muted">
        <HardDrive aria-hidden="true" className="mr-1 size-3 inline -translate-y-px" />
        Flowstate has no account and no server. Exporting is the only backup there is, and clearing
        your browser data deletes everything without asking.
      </p>

      <ConfirmDialog
        open={confirming}
        title="Delete everything?"
        description={`${pluralize(tasks.length, 'task')} and ${pluralize(log.length, 'session')} will be removed from this browser. There is no copy anywhere else.`}
        confirmLabel="Delete everything"
        confirmDisabled={!acknowledged}
        onConfirm={resetEverything}
        onOpenChange={(open) => {
          setConfirming(open)
          if (!open) setAcknowledged(false)
        }}
      >
        <label className="gap-2.5 flex cursor-pointer items-start text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            className="mt-0.5 size-3.5 accent-[var(--color-accent)]"
          />
          I understand my session history goes too.
        </label>
      </ConfirmDialog>
    </div>
  )
}

export { DataPanel }
export type { DataPanelProps }
