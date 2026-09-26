'use client'

import { Toaster as SonnerToaster, toast } from 'sonner'

import { cn } from '@/lib/utils'

/**
 * Toast host.
 *
 * Mounted once at the app root. Sonner is styled entirely through our own
 * surface tokens (see `[data-sonner-toaster]` in `globals.css`) so toasts read
 * as part of the product rather than a bolted-on notification system.
 */
function AppToaster() {
  return (
    <SonnerToaster
      className={cn('max-sm:inset-x-3 max-sm:bottom-[calc(4.5rem+env(safe-area-inset-bottom))]')}
      position="bottom-right"
      offset="1.5rem"
      visibleToasts={3}
      gap={8}
      closeButton
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'group flex w-full items-start gap-3 rounded-lg border border-line bg-overlay p-3.5 text-sm text-ink shadow-lg',
          title: 'font-medium leading-snug',
          description: 'mt-0.5 text-xs leading-snug text-ink-muted',
          actionButton:
            'h-7 shrink-0 rounded-sm border border-line px-2 text-xs font-medium text-ink-secondary transition-colors hover:bg-ink/6',
          cancelButton: 'h-7 shrink-0 rounded-sm px-2 text-xs text-ink-muted hover:text-ink',
          closeButton:
            'absolute top-1.5 -right-1.5 rounded-sm bg-overlay p-1 text-ink-subtle transition-colors hover:text-ink',
          icon: 'mt-0.5 size-4 shrink-0',
        },
      }}
    />
  )
}

export { AppToaster, toast }
