'use client'

import { ArrowDownWideNarrow, Check, ListFilter, Search } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { SegmentedRadio } from '@/components/ui/segmented-radio'
import {
  HISTORY_PERIODS,
  HISTORY_SORTS,
  type HistoryFilter,
  type HistoryPeriod,
  type HistorySort,
} from '@/features/insights/derive'
import { pluralize } from '@/lib/format'

/**
 * History filters.
 *
 * ## State lives in the URL
 *
 * A filter is a view of data someone may want to link to, come back to, or share
 * — and a filter that resets on refresh cannot be bookmarked. The parent keeps
 * the filter in the query string; this component only renders controls and
 * reports changes upward.
 *
 * ## Why the search box reports every keystroke
 *
 * The input is not debounced; the *list* is. Debouncing the input would make
 * typing feel laggy, and filtering a few hundred records costs nothing — the
 * debounce exists so a fast typist does not re-render the list on every
 * character, not to protect the CPU.
 *
 * ## Segmented for the closed sets, a menu for the open one
 *
 * Period and sort have three options each, so they get real radio semantics and
 * stay visible. The task filter is an open-ended list, which a segmented control
 * cannot represent.
 */

type TaskOption = { id: string; title: string }

type HistoryControlsProps = {
  filter: HistoryFilter
  onFilterChange: (patch: Partial<HistoryFilter>) => void
  taskOptions: readonly TaskOption[]
  resultCount: number
}

function HistoryControls({
  filter,
  onFilterChange,
  taskOptions,
  resultCount,
}: HistoryControlsProps) {
  const [query, setQuery] = useState(filter.query)
  // The URL is the source of truth: a jump from the palette to `/history?q=ingest`
  // arrives with a query nobody typed into this box.
  //
  // The correction happens during render rather than in an effect, which is React's
  // documented pattern for "adjusting state when a prop changes" — an effect here
  // would render the stale text for one frame and then re-render again.
  const [syncedQuery, setSyncedQuery] = useState(filter.query)
  if (filter.query !== syncedQuery) {
    setSyncedQuery(filter.query)
    setQuery(filter.query)
  }

  const selectedTask = taskOptions.find((task) => task.id === filter.taskId)

  return (
    <div className="gap-5 flex flex-col">
      <div className="gap-3 sm:flex-row sm:items-center flex flex-col">
        <div className="sm:max-w-xs sm:flex-1 relative">
          <Search
            aria-hidden="true"
            className="left-3 size-4 pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-subtle"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              onFilterChange({ query: event.target.value })
            }}
            placeholder="Search titles, projects, notes"
            aria-label="Search your history"
            className="pl-9"
          />
        </div>

        <div className="gap-2 sm:ml-auto flex items-center">
          <TaskFilterMenu
            selectedId={filter.taskId}
            selectedTitle={selectedTask?.title ?? null}
            options={taskOptions}
            onSelect={(taskId) => onFilterChange({ taskId })}
          />
          <SortMenu value={filter.sort} onSelect={(sort) => onFilterChange({ sort })} />
        </div>
      </div>

      <div className="gap-4 flex flex-wrap items-end justify-between">
        <SegmentedRadio
          legend="Period"
          name="history-period"
          value={filter.period}
          onValueChange={(value) => onFilterChange({ period: value as HistoryPeriod })}
          options={HISTORY_PERIODS}
        />

        <p aria-live="polite" className="text-xs text-ink-muted">
          {resultCount === 0 ? 'No matching sessions' : pluralize(resultCount, 'session')}
        </p>
      </div>
    </div>
  )
}

type TaskFilterMenuProps = {
  selectedId: string | null
  selectedTitle: string | null
  options: readonly TaskOption[]
  onSelect: (taskId: string | null) => void
}

function TaskFilterMenu({ selectedId, selectedTitle, options, onSelect }: TaskFilterMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <ListFilter aria-hidden="true" />
          <span className="max-w-32 truncate">{selectedTitle ?? 'All tasks'}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Filter by task</DropdownMenuLabel>

        <DropdownMenuItem onSelect={() => onSelect(null)}>
          {selectedId === null ? <Check aria-hidden="true" /> : <span className="size-4" />}
          All tasks
        </DropdownMenuItem>

        {options.length === 0 ? (
          <p className="px-3 py-2 text-xs text-ink-muted">No tasks in your history yet.</p>
        ) : null}

        {options.map((task) => (
          <DropdownMenuItem key={task.id} onSelect={() => onSelect(task.id)}>
            {task.id === selectedId ? <Check aria-hidden="true" /> : <span className="size-4" />}
            <span className="truncate">{task.title}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type SortMenuProps = {
  value: HistorySort
  onSelect: (sort: HistorySort) => void
}

function SortMenu({ value, onSelect }: SortMenuProps) {
  return (
    <DropdownMenu>
      {/* No Tooltip wrapper here.
          `DropdownMenuTrigger asChild` hands its ref to the element directly
          below it, and `Tooltip` is a function component that forwards nothing —
          so the trigger had no node to anchor to and the menu never opened on
          click. The button is also icon-only and already carries
          `aria-label="Sort sessions"`, which is the name a tooltip would have
          repeated anyway. `Tooltip` now forwards its ref, so the wrapper is
          safe if it is ever wanted back. */}
      <DropdownMenuTrigger asChild>
        <IconButton label="Sort sessions" variant="outline" size="icon-md">
          <ArrowDownWideNarrow aria-hidden="true" />
        </IconButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        {HISTORY_SORTS.map((option) => (
          <DropdownMenuItem key={option.value} onSelect={() => onSelect(option.value)}>
            {option.value === value ? <Check aria-hidden="true" /> : <span className="size-4" />}
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { HistoryControls }
export type { HistoryControlsProps, TaskOption }
