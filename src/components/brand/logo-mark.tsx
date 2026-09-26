import { cn } from '@/lib/utils'

type LogoMarkProps = {
  className?: string
  /** Render the reticle in the accent colour instead of current text colour. */
  accent?: boolean
}

/**
 * The Flowstate mark: a focus reticle. Four corners, no fill — the frame is
 * the product. Drawn with a 1.75 stroke on a 24 grid so it stays crisp at
 * 16px in the browser tab and at 24px in the sidebar.
 *
 * No interactivity, so this stays a Server Component and can be dropped into
 * server-rendered surfaces (metadata icons, empty states) for free.
 */
function LogoMark({ className, accent = true }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn('size-5 shrink-0', className)}
    >
      <path
        d="M2.5 8.5V6.5a4 4 0 0 1 4-4h2M15.5 2.5h2a4 4 0 0 1 4 4v2M21.5 15.5v2a4 4 0 0 1-4 4h-2M8.5 21.5h-2a4 4 0 0 1-4-4v-2"
        stroke={accent ? 'var(--accent)' : 'currentColor'}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export { LogoMark }
export type { LogoMarkProps }
