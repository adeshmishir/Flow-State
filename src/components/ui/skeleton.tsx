import { cn } from '@/lib/utils'

type SkeletonProps = React.ComponentPropsWithoutRef<'div'>

/**
 * Loading placeholder.
 *
 * A low-contrast pulse rather than a shimmer: motion in this product is
 * reserved for feedback, and a travelling highlight across every row is
 * exactly the kind of noise a focus tool should not have.
 *
 * The pulse stops entirely under `prefers-reduced-motion`. A static block still
 * reads as "not loaded yet" because it is a different shape from the content
 * that replaces it, so nothing is lost by dropping the movement.
 */
function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('animate-pulse rounded-sm bg-ink/8 motion-reduce:animate-none', className)}
      {...props}
    />
  )
}

export { Skeleton }
export type { SkeletonProps }
