import { Skeleton } from '@/components/ui/skeleton'

const listRows = [0, 1, 2, 3] as const
const summaryRows = [0, 1, 2] as const

/**
 * Loading state for the Home route.
 *
 * Mirrors the real layout so the page does not jump when it arrives, and uses
 * the same Skeleton primitive the rest of the product will share. Announced as
 * a busy region rather than as a visible "Loading…" label, which would compete
 * with the content it is standing in for.
 */
export default function HomeLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="gap-10 lg:gap-12 flex flex-col">
      <span className="sr-only">Loading today…</span>

      <div className="space-y-3.5">
        <Skeleton className="h-2.5 w-32" />
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="h-4 w-[26rem] max-w-full" />
      </div>

      <Skeleton className="h-64 sm:h-56 w-full rounded-lg" />

      <div className="gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-x-14 xl:gap-x-20 grid">
        <div className="space-y-3">
          {listRows.map((row) => (
            <Skeleton key={row} className="h-10 w-full" />
          ))}
        </div>
        <div className="space-y-3 lg:order-last order-first">
          <Skeleton className="h-28 w-full" />
          {summaryRows.map((row) => (
            <Skeleton key={row} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
