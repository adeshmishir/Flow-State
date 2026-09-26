import type { ReactNode } from 'react'

import { PageHeader } from '@/components/layout/page-header'
import { PageContainer, PageSection } from '@/components/motion/page-container'
import { Badge } from '@/components/ui/badge'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Separator } from '@/components/ui/separator'
import { Surface } from '@/components/ui/surface'

type RoutePlaceholderProps = {
  eyebrow: string
  title: string
  description: string
  /** What this route will contain once it is built. */
  planned: readonly string[]
  /** Which stage delivers it. */
  stage: string
  /** Optional route-specific content rendered above the roadmap. */
  children?: ReactNode
}

/**
 * The shared shape of every route that is designed but not yet built.
 *
 * It uses the same header, surfaces and type scale as the real pages, so
 * routing around the product already feels finished — and so later stages only
 * have to replace the body, never re-derive the layout.
 */
function RoutePlaceholder({
  eyebrow,
  title,
  description,
  planned,
  stage,
  children,
}: RoutePlaceholderProps) {
  return (
    <PageContainer className="gap-10 lg:gap-12 flex flex-col">
      <PageSection>
        <PageHeader eyebrow={eyebrow} title={title} description={description} />
      </PageSection>

      {children ? <PageSection>{children}</PageSection> : null}

      <PageSection>
        <Surface tone="sunken" className="p-6 sm:p-8">
          <div className="gap-3 flex flex-wrap items-center">
            <Eyebrow>On the roadmap</Eyebrow>
            <Badge tone="accent" size="md">
              {stage}
            </Badge>
          </div>

          <ul className="mt-5 gap-x-8 gap-y-3 sm:grid-cols-2 grid">
            {planned.map((item) => (
              <li key={item} className="gap-3 flex text-sm text-ink-secondary">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1 shrink-0 rounded-full bg-line-strong"
                />
                {item}
              </li>
            ))}
          </ul>

          <Separator className="my-6" />

          <p className="text-xs text-ink-subtle">
            This route is designed, routed and themed. Its behaviour arrives in a later stage.
          </p>
        </Surface>
      </PageSection>
    </PageContainer>
  )
}

export { RoutePlaceholder }
export type { RoutePlaceholderProps }
