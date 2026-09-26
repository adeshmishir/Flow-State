'use client'

import { Archive, ArrowDown, ArrowUp, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { IconButton } from '@/components/ui/icon-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Task } from '@/types/session'

/**
 * The per-task menu.
 *
 * Radix rather than a hand-rolled popover: focus trapping, escape handling,
 * `aria-expanded` wiring and restoring focus to the trigger on close are all
 * things that are easy to get subtly wrong and impossible to notice until
 * someone using a keyboard reports being trapped in a menu.
 *
 * The move items are disabled at the ends of the list rather than hidden, so the
 * menu's contents do not change shape depending on which row opened it.
 */

type TaskMenuProps = {
  task: Task
  index: number
  total: number
  onEdit: (task: Task) => void
  onArchive: (task: Task) => void
  onDelete: (task: Task) => void
  onMove: (task: Task, offset: number) => void
}

function TaskMenu({ task, index, total, onEdit, onArchive, onDelete, onMove }: TaskMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton label={`More actions for ${task.title}`} variant="ghost" size="icon-sm">
          <MoreHorizontal aria-hidden="true" />
        </IconButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuLabel>Task</DropdownMenuLabel>

        <DropdownMenuItem onSelect={() => onEdit(task)}>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={() => onArchive(task)}>
          <Archive aria-hidden="true" />
          Archive
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => onMove(task, -1)} disabled={index === 0}>
          <ArrowUp aria-hidden="true" />
          Move up
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={() => onMove(task, 1)} disabled={index === total - 1}>
          <ArrowDown aria-hidden="true" />
          Move down
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="danger" onSelect={() => onDelete(task)}>
          <Trash2 aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { TaskMenu }
export type { TaskMenuProps }
