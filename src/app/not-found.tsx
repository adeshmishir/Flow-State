import { ArrowLeft, Compass } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { PageContainer, PageSection } from '@/components/motion/page-container'
import { Eyebrow } from '@/components/ui/eyebrow'
import { buttonVariants } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Not found',
  description: 'That page does not exist in Flowstate.',
}

export default function NotFound() {
  return (
    <PageContainer className="gap-10 flex flex-col">
      <PageSection>
        <Surface className="p-6 sm:p-8">
          <div className="gap-3 flex items-center">
            <Compass className="size-4 text-ink-subtle" aria-hidden="true" />
            <Eyebrow>404</Eyebrow>
          </div>

          <h1 className="mt-5 font-medium tracking-tight sm:text-3xl text-2xl text-ink">
            Nothing here.
          </h1>
          <p className="mt-2 max-w-reading text-sm text-ink-muted">
            That address is not part of Flowstate. It may have moved, or never existed.
          </p>

          <Link href="/" className={cn(buttonVariants({ variant: 'primary' }), 'mt-6 gap-2 px-5')}>
            <ArrowLeft aria-hidden="true" />
            Back to today
          </Link>
        </Surface>
      </PageSection>
    </PageContainer>
  )
}
