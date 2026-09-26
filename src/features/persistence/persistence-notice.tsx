'use client'

import { TriangleAlert, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState, useSyncExternalStore } from 'react'

import { IconButton } from '@/components/ui/icon-button'
import { EASE_OUT } from '@/lib/motion'
import {
  describeIssue,
  getPersistenceIssue,
  getServerPersistenceIssue,
  onPersistenceIssue,
} from '@/lib/persistence'

/**
 * The storage-problem notice.
 *
 * ## Why this exists at all
 *
 * The alternative is a product that silently fails. Local storage can be full,
 * blocked by a private-mode policy, or holding a value this build cannot read —
 * and in every one of those cases the app still *works*, right up until a reload,
 * at which point the work is gone. A deep-work tool that quietly loses a day of
 * notes is worse than one that says so.
 *
 * ## Why a bar and not a toast
 *
 * Toasts disappear. This is the one message in the app a person must not be able
 * to miss and must be able to dismiss deliberately, so it sits above the content
 * until they close it. It is `role="status"` rather than `role="alert"`: nothing
 * is on fire, and interrupting a screen reader mid-sentence to say so would cost
 * more than it communicates.
 *
 * ## Why `useSyncExternalStore`
 *
 * The first store seeds during the first render, before any effect runs, so a
 * notice that only subscribed would arrive after the problem. Copying the backlog
 * into state at mount fixes the ordering but breaks hydration: the server has no
 * local storage and can never have an issue to report, so it would render nothing
 * while the browser rendered a warning bar, and React would rightly object.
 *
 * Reading the backlog as an external store with a `null` server snapshot resolves
 * both at once. The server renders "no problem" because that is genuinely what it
 * knows; the client picks up anything reported during seeding on the first render
 * after hydration. No effect, no state copy, no mismatch.
 */
function PersistenceNotice() {
  const issue = useSyncExternalStore(
    onPersistenceIssue,
    getPersistenceIssue,
    getServerPersistenceIssue,
  )
  const [dismissed, setDismissed] = useState<string | null>(null)
  const key = issue === null ? null : `${issue.kind}:${'key' in issue ? issue.key : 'app'}`

  // Dismissal is remembered by *which* issue was dismissed, not as a boolean.
  //
  // A boolean would hide a second, unrelated failure behind the first one's
  // dismissal: storage fills up, a value turns out to be unreadable, and the
  // person never learns. Keying the dismissal means the bar returns for any
  // problem they have not already acknowledged, and stays gone for the one they
  // have. It also needs no effect to reset — a vanished issue simply stops
  // rendering, and if the same problem recurs later the key still matches.
  if (issue === null || key === dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, transition: { duration: 0.15, ease: EASE_OUT } }}
        transition={{ duration: 0.24, ease: EASE_OUT }}
        role="status"
        className="inset-x-0 top-0 px-3 pt-3 md:px-6 md:pt-4 fixed z-50 flex justify-center"
      >
        <div className="max-w-xl gap-3 p-3.5 flex w-full items-start rounded-lg border border-warning/30 bg-warning-soft shadow-md">
          <TriangleAlert aria-hidden="true" className="size-4 mt-px shrink-0 text-warning" />
          <p className="min-w-0 leading-relaxed flex-1 text-xs text-ink">{describeIssue(issue)}</p>
          <IconButton
            label="Dismiss"
            variant="ghost"
            size="icon-sm"
            className="-mt-0.5 -mr-0.5 shrink-0"
            onClick={() => setDismissed(key)}
          >
            <X aria-hidden="true" />
          </IconButton>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export { PersistenceNotice }
