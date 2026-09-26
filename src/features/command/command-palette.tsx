'use client'

import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { useMemo, useState, type ReactNode } from 'react'

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Kbd } from '@/components/ui/kbd'
import { focusHrefForTask } from '@/features/session/focus-draft'
import { useSessionLog } from '@/features/focus/session-store'
import { isSearchable, rankByText, searchAll } from '@/features/search/matcher'
import { useTasks } from '@/features/tasks/task-store'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { formatDuration, formatRelativeDay } from '@/lib/format'
import type { Task } from '@/types/session'

/**
 * The command palette.
 *
 * ## Why it is a real dialog, not a dropdown
 *
 * It renders inside the app's Radix `Dialog`, which brings focus trapping,
 * Escape, `aria-modal` and scroll locking. A palette that lets focus wander into
 * the page behind it is not a palette, it is a text field with suggestions.
 *
 * ## Why `cmdk`
 *
 * It implements the combobox pattern properly — `aria-activedescendant` pointing
 * at the highlighted option, arrows and Home/End moving it, Enter running it —
 * in about 4kB. The alternative was reimplementing a combobox, which is a week of
 * work and a permanent accessibility liability.
 *
 * `shouldFilter={false}` is intentional. The shared matcher ranks results, and
 * letting cmdk filter them again on top would discard the ranking — so the
 * filtering is done here, once, by the same code History uses. The navigation
 * actions go through that matcher too: a palette whose own destinations cannot
 * be typed is a menu with a search box bolted on.
 *
 * ## Ordering while searching
 *
 * Records first, actions last. Someone typing "ingest" wants the task called
 * *Ingest migration guide*, not a generic "Open the task queue" above it — but
 * someone typing "hist" matches no record at all, and still gets "Open history".
 * Specific things win; navigation is the fallback, not the headline.
 *
 * ## Why search lives here
 *
 * This is the only surface that can reach a task and a session at once. Both
 * results are navigable: a task starts a session, a session jumps to its history
 * filtered to that title.
 */

const SEARCH_DEBOUNCE_MS = 120

type PaletteItem = {
  id: string
  label: string
  hint: string
  icon: ReactNode
  /**
   * What the query is matched against.
   *
   * Keywords a person would actually type, not just the visible label: "hist"
   * has to reach history, and "theme" has to reach settings.
   */
  search: string
  onSelect: () => void
}

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  // The store's own snapshot, so an edit made elsewhere re-ranks an open palette.
  const allTasks = useTasks()
  const log = useSessionLog()

  const [query, setQuery] = useState('')
  // The input updates immediately; the results follow. The gap is imperceptible
  // and it keeps a fast typist from re-ranking on every character.
  const debounced = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)

  // Start from the action list on every open, rather than re-showing the last
  // search someone ran an hour ago.
  //
  // The reset happens during render rather than in an effect watching `open`. An
  // effect would run *after* the palette painted, so the previous search would be
  // on screen for a frame; worse, it is the "cascading render" pattern the React
  // docs warn about. Remounting on open would be simpler still, but the dialog is
  // always mounted — only its contents are conditional — so the correction below
  // is the equivalent, without restructuring the shell.
  const [queryWhenClosed, setQueryWhenClosed] = useState(open)
  if (open === queryWhenClosed) {
    if (!open && query !== '') setQuery('')
  } else {
    setQueryWhenClosed(open)
    if (open) setQuery('')
  }

  // `allTasks` is the store's own snapshot, so it is a real dependency: renaming a
  // task from the queue updates an already-open palette's results rather than waiting
  // for the next keystroke to resurface the change.
  const results = useMemo(
    () => (isSearchable(debounced) ? searchAll(allTasks, log, debounced) : []),
    [debounced, allTasks, log],
  )

  const go = (path: string) => {
    onOpenChange(false)
    router.push(path)
  }

  const startTask = (task: Task) => {
    onOpenChange(false)
    router.push(focusHrefForTask(task))
  }

  const actions: PaletteItem[] = [
    {
      id: 'action-focus',
      label: 'Start a focus session',
      hint: 'Pick a task and a length',
      search: 'start focus session begin timer run',
      icon: <Glyph d="M5 3.5v9l7.5-4.5z" />,
      onSelect: () => go('/focus'),
    },
    {
      id: 'action-tasks',
      label: 'Open the task queue',
      hint: 'Reorder, edit, archive',
      search: 'tasks task queue list todo inbox reorder',
      icon: (
        <Glyph d="M5 3h9v1.6H5zm0 4.2h9v1.6H5zM5 11.4h9V13H5zM2 3h1.6v1.6H2zm0 4.2h1.6v1.6H2zM2 11.4h1.6V13H2z" />
      ),
      onSelect: () => go('/tasks'),
    },
    {
      id: 'action-history',
      label: 'Open history',
      hint: 'Search and filter past sessions',
      search: 'history past sessions log archive',
      icon: (
        <Glyph d="M8 1.6A6.4 6.4 0 1 0 8 14.4 6.4 6.4 0 0 0 8 1.6m.7 3v3.7l2.6 1.5-.7 1.1L7.3 9V4.6z" />
      ),
      onSelect: () => go('/history'),
    },
    {
      id: 'action-settings',
      label: 'Open settings',
      hint: 'Daily goal, default length, appearance',
      search: 'settings preferences theme appearance dark light goal export data',
      icon: (
        <Glyph d="M8 5.4A2.6 2.6 0 1 0 8 10.6 2.6 2.6 0 0 0 8 5.4m0 1.4a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4M6.9.9l-.3 1.5-.9.4-1.3-.8-1.3 1.3.8 1.3-.4.9L1.9 5.8v1.8l1.6.3.4.9-.8 1.3 1.3 1.3 1.3-.8.9.4.3 1.6h1.8l.3-1.6.9-.4 1.3.8 1.3-1.3-.8-1.3.4-.9 1.6-.3V5.8l-1.6-.3-.4-.9.8-1.3L9.7 2l-1.3.8-.9-.4L8.7.9z" />
      ),
      onSelect: () => go('/settings'),
    },
  ]

  const tasks: PaletteItem[] = results.flatMap((result) => {
    if (result.kind !== 'task') return []

    const task = result.task
    return [
      {
        id: `task-${task.id}`,
        label: task.title,
        hint: [
          task.project || 'Inbox',
          task.estimatedMinutes === null ? null : formatDuration(task.estimatedMinutes),
          task.archivedAt !== null ? 'archived' : null,
        ]
          .filter(Boolean)
          .join(' · '),
        search: [task.title, task.project ?? '', task.description ?? ''].join(' '),
        icon: <Glyph d="M6.2 11.6 2.6 8l1.1-1.1 2.5 2.5 6.1-6.1L13.4 4.4z" />,
        onSelect: () => startTask(task),
      },
    ]
  })

  const sessions = results.flatMap((result) => {
    if (result.kind !== 'session') return []

    const entry = result.entry
    return [
      {
        id: `session-${entry.id}`,
        label: entry.taskTitle,
        hint: `${formatDuration(entry.focusedMinutes)} · ${formatRelativeDay(
          new Date(entry.startedAt),
        )}`,
        search: [entry.taskTitle, entry.project, entry.notes].join(' '),
        icon: (
          <Glyph d="M8 1.6A6.4 6.4 0 1 0 8 14.4 6.4 6.4 0 0 0 8 1.6m.7 3v3.7l2.6 1.5-.7 1.1L7.3 9V4.6z" />
        ),
        // History has no per-session route yet, so the title is the honest
        // target: a search that will definitely show that session.
        onSelect: () => go(`/history?q=${encodeURIComponent(entry.taskTitle)}`),
      },
    ]
  })

  const searching = isSearchable(query)
  const pending = query !== debounced

  // The destinations are searchable too, ranked by the same ladder as records.
  const visibleActions = searching
    ? rankByText(actions, debounced, (action) => action.search)
    : actions

  const nothingFound =
    searching &&
    !pending &&
    tasks.length === 0 &&
    sessions.length === 0 &&
    visibleActions.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-[34rem]">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search your tasks and sessions, or jump to a page.
        </DialogDescription>

        <DialogBody className="p-0">
          <Command shouldFilter={false} loop>
            <div className="border-b border-line">
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search tasks and sessions, or jump to…"
                className="px-5 py-4 w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
              />
            </div>

            <Command.List className="p-2 max-h-[min(22rem,55dvh)] overflow-y-auto overscroll-contain">
              {nothingFound ? (
                <p className="px-3 py-8 text-center text-sm text-ink-muted">
                  Nothing matches “{query.trim()}”.
                </p>
              ) : null}

              {/* While searching, records lead and navigation follows them. */}
              {searching ? (
                <>
                  <PaletteGroup heading="Tasks" items={tasks} />
                  <PaletteGroup heading="Sessions" items={sessions} />
                  <PaletteGroup heading="Go to" items={visibleActions} />
                </>
              ) : (
                <PaletteGroup heading="Actions" items={visibleActions} />
              )}
            </Command.List>

            <div className="px-5 py-2.5 border-t border-line">
              <p className="gap-x-4 gap-y-1 flex flex-wrap items-center text-2xs text-ink-muted">
                <span className="gap-1 flex items-center">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  navigate
                </span>
                <span className="gap-1 flex items-center">
                  <Kbd>↵</Kbd>
                  open
                </span>
                <span className="gap-1 flex items-center">
                  <Kbd>esc</Kbd>
                  close
                </span>
              </p>
            </div>
          </Command>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

const groupHeadingClasses = [
  '[&_[cmdk-group-heading]]:px-3',
  '[&_[cmdk-group-heading]]:pt-3',
  '[&_[cmdk-group-heading]]:pb-1.5',
  '[&_[cmdk-group-heading]]:text-2xs',
  '[&_[cmdk-group-heading]]:tracking-[0.09em]',
  '[&_[cmdk-group-heading]]:text-ink-muted',
  '[&_[cmdk-group-heading]]:uppercase',
].join(' ')

function PaletteGroup({ heading, items }: { heading: string; items: PaletteItem[] }) {
  if (items.length === 0) return null

  return (
    <Command.Group heading={heading} className={groupHeadingClasses}>
      {items.map((item) => (
        <Command.Item
          key={item.id}
          value={item.id}
          onSelect={item.onSelect}
          className="gap-3 px-3 py-2.5 flex cursor-pointer items-center rounded-md text-sm data-[selected=true]:bg-accent-soft data-[selected=true]:text-accent-soft-ink"
        >
          <span className="size-6 grid shrink-0 place-items-center text-ink-subtle">
            {item.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-ink">{item.label}</span>
            <span className="block truncate text-xs text-ink-muted">{item.hint}</span>
          </span>
        </Command.Item>
      ))}
    </Command.Group>
  )
}

/**
 * Inline glyphs rather than `lucide-react`.
 *
 * The palette is mounted at the app root and its items are the only place these
 * four shapes appear, so importing the icon set for them would add weight to
 * every route for no benefit.
 */
function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

export { CommandPalette }
export type { CommandPaletteProps }
