import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/utils'

type InputProps = ComponentPropsWithoutRef<'input'>

/**
 * Text field. The focus ring is a 1px accent border plus a soft halo rather
 * than a browser outline, which keeps long-form entry calm while staying
 * obvious.
 */
function Input({ className, type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-9 min-w-0 px-3 w-full rounded-md border border-line bg-surface text-sm text-ink',
        'placeholder:text-ink-subtle',
        'transition-[border-color,box-shadow,background-color] duration-150 ease-standard',
        'hover:border-line-strong',
        'focus-visible:shadow-focus focus-visible:border-accent focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-subtle',
        'aria-invalid:border-danger aria-invalid:shadow-none',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
export type { InputProps }
