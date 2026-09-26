'use client'

import { RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

import { LogoMark } from '@/components/brand/logo-mark'
import { PageContainer, PageSection } from '@/components/motion/page-container'
import { Button, buttonVariants } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Surface } from '@/components/ui/surface'
import { cn } from '@/lib/utils'

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Route-level error boundary.
 *
 * Renders inside the shell, so navigation still works and the user is never
 * stranded. The digest is shown in development only — it is a build-time id,
 * useful locally and noise in production.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <PageContainer className="gap-10 flex flex-col">
      <PageSection>
        <Surface className="p-6 sm:p-8">
          <div className="gap-3 flex items-center">
            <LogoMark className="size-4" />
            <Eyebrow>Something went wrong</Eyebrow>
          </div>

          <h1 className="mt-5 font-medium tracking-tight sm:text-3xl text-2xl text-ink">
            This view failed to load.
          </h1>
          <p className="mt-2 max-w-reading text-sm text-ink-muted">
            The rest of Flowstate is still here. Try this view again, or head back to today.
          </p>

          {process.env.NODE_ENV === 'development' && error.digest ? (
            <p className="mt-4 font-mono text-xs text-ink-subtle">digest: {error.digest}</p>
          ) : null}

          <div className="mt-6 gap-2 flex flex-wrap items-center">
            <Button type="button" variant="primary" onClick={reset}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
            <Link
              href="/"
              className={cn(buttonVariants({ variant: 'ghost' }), 'gap-2 px-3.5 text-sm')}
            >
              Back to today
            </Link>
          </div>
        </Surface>
      </PageSection>
    </PageContainer>
  )
}
