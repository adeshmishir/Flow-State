import { cn } from '@/lib/utils'

type SkeletonProps = React.ComponentPropsWithoutRef<'div'>

/**
 * Loading placeholder.
 *
 * A low-contrast pulse rather than a shimmer: motion in this product is
 * reserved for feedback, and a travelling highlight across every row is
 * exactly the kind of noise a focus tool should not have.
 */
function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('animate-pulse rounded-sm bg-ink/8', className)}
      {...props}
    />
  )
}

export { Skeleton }
export type { SkeletonProps }
