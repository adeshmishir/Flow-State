import { toDraftMinutes, toSessionLength } from '@/features/session/session-form-schema'
import type { SessionDraft, Task } from '@/types/session'

/**
 * The one path from a task to a focus-room URL.
 *
 * ## Why this module exists
 *
 * The focus room is server-rendered from the draft in the URL, so the draft has
 * to survive the trip: title, id, project and length all travel as query
 * parameters, and `app/focus/page.tsx` is the only thing that reads them.
 *
 * That contract is invisible, and it had already drifted. The setup dialog
 * wrote `task=<title>&minutes=<n>&id=<id>`, while a task row and the command
 * palette each wrote `task=<id>&length=<n>` — two names for the same idea. The
 * page read the first shape, so those two links arrived with the *task ID where
 * the title belonged*: the room's heading read `tsk_ingest_guide`, the project
 * and estimate were dropped, and the session was logged with `taskId: null` and
 * that ID as its title, which is why History could not find it by name.
 *
 * Nothing in the type system connects a producer to that reader, so the fix is
 * not a corrected string — it is removing the opportunity to write a second one.
 * Build a draft, put it in the URL, and there is nothing left to get wrong.
 */

/**
 * The draft for starting a session on a task.
 *
 * `minutes` overrides the task's own estimate, for a caller that already knows
 * a length. The estimate is snapped to an offered duration rather than trusted
 * literally, for the same reason the setup dialog snaps it: 45 is a hint, and
 * 50 is the honest reading of it.
 */
export function draftFromTask(task: Task, minutes?: number): SessionDraft {
  const requested = minutes ?? task.estimatedMinutes
  return {
    taskId: task.id,
    taskTitle: task.title,
    project: task.project,
    description: task.description ?? '',
    minutes: toDraftMinutes(toSessionLength(requested)),
  }
}

/** Drafts travel in the URL, so the room is server-rendered from them. */
export function draftToQuery(draft: SessionDraft): string {
  const query = new URLSearchParams({ task: draft.taskTitle, minutes: String(draft.minutes) })
  if (draft.taskId) query.set('id', draft.taskId)
  if (draft.project) query.set('project', draft.project)
  return `?${query.toString()}`
}

/** The href for "start a session on this task". */
export function focusHrefForTask(task: Task, minutes?: number): string {
  return `/focus${draftToQuery(draftFromTask(task, minutes))}`
}
