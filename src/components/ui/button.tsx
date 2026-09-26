import { type VariantProps, cva } from 'class-variance-authority'
import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/utils'

/**
 * Flowstate button.
 *
 * Surfaces are built from `ink` tints rather than extra colour tokens, so a
 * neutral button reads correctly in both themes. Every variant carries
 * hover / active / focus-visible / disabled behaviour.
 *
 * Server-safe: no hooks, no context, no browser APIs.
 */
export const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 select-none items-center justify-center gap-2',
    'rounded-md font-medium whitespace-nowrap',
    'transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-150 ease-standard',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    'disabled:pointer-events-none disabled:opacity-40',
    'aria-disabled:pointer-events-none aria-disabled:opacity-40',
    '[&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-accent-ink shadow-xs hover:bg-accent-hover active:bg-accent-active',
        secondary:
          'border border-line-control bg-surface text-ink hover:border-line-control-hover hover:bg-raised active:bg-ink/5',
        outline:
          'border border-line-control bg-transparent text-ink-secondary hover:border-line-control-hover hover:bg-ink/5 hover:text-ink active:bg-ink/8',
        ghost: 'text-ink-secondary hover:bg-ink/5 hover:text-ink active:bg-ink/8',
        subtle: 'bg-ink/5 text-ink hover:bg-ink/8 active:bg-ink/12',
        danger:
          'border border-danger/30 bg-danger-soft text-danger hover:border-danger/45 hover:bg-danger/15',
        link: 'text-ink-secondary underline-offset-4 hover:text-ink hover:underline',
      },
      size: {
        sm: 'h-8 gap-1.5 px-2.5 text-xs [&_svg]:size-3.5',
        md: 'h-9 px-3.5 text-sm',
        lg: 'h-11 gap-2.5 px-5 text-base [&_svg]:size-[1.125rem]',
        'icon-sm': 'tap-target size-8 [&_svg]:size-4',
        'icon-md': 'tap-target size-9',
        'icon-lg': 'size-11 [&_svg]:size-[1.125rem]',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  },
)

type ButtonProps = ComponentPropsWithoutRef<'button'> & VariantProps<typeof buttonVariants>

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button }
export type { ButtonProps }
