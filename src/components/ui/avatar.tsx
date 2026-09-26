'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { type VariantProps, cva } from 'class-variance-authority'
import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/utils'

const avatarVariants = cva(
  'relative flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full',
  {
    variants: {
      size: {
        sm: 'size-7 text-2xs',
        md: 'size-9 text-xs',
        lg: 'size-11 text-sm',
      },
      tone: {
        neutral: 'bg-ink/8 text-ink-secondary',
        accent: 'bg-accent-soft text-accent-soft-ink',
      },
    },
    defaultVariants: { size: 'md', tone: 'neutral' },
  },
)

type AvatarProps = Omit<ComponentPropsWithoutRef<typeof Avatar>, 'children'> &
  VariantProps<typeof avatarVariants> & {
    /** Optional portrait. Falls back to `initials` when absent or broken. */
    src?: string | undefined
    alt?: string | undefined
    /** One or two characters, rendered when there is no image. */
    initials: string
  }

function AvatarRoot({ className, size, tone, src, alt, initials, ...props }: AvatarProps) {
  return (
    <Avatar data-slot="avatar" className={cn(avatarVariants({ size, tone }), className)} {...props}>
      {src ? <AvatarImage src={src} alt={alt ?? ''} className="size-full object-cover" /> : null}
      <AvatarFallback
        delayMs={src ? 400 : 0}
        className="font-medium flex size-full items-center justify-center tracking-[0.02em]"
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

export { AvatarRoot as Avatar, avatarVariants }
export type { AvatarProps }
