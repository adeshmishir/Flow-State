import type { ReactNode } from 'react'

import { Eyebrow } from '@/components/ui/eyebrow'
import { cn } from '@/lib/utils'

type PageHeaderProps = {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** Right-aligned on `sm` and up, stacked below the title on phones. */
  actions?: ReactNode
  className?: string
}

/**
 * The header every route opens with. Centralising it is what keeps the h1
 * position, measure and rhythm identical from Home to Settings.
 */
function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-10 flex flex-col',
        className,
      )}
    >
      <div className="max-w-reading">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className={cn('mt-2.5 font-medium text-ink', 'sm:text-4xl text-3xl')}>{title}</h1>
        {description ? (
          <p className="mt-3 sm:text-lg text-base text-ink-secondary">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="gap-2 flex shrink-0 items-center">{actions}</div> : null}
    </header>
  )
}

export { PageHeader }
export type { PageHeaderProps }
