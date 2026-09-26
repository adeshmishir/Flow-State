'use client'

import {
  Dialog as DialogPrimitive,
  DialogClose as DialogClosePrimitive,
  DialogContent as DialogContentPrimitive,
  DialogDescription as DialogDescriptionPrimitive,
  DialogOverlay as DialogOverlayPrimitive,
  DialogPortal as DialogPortalPrimitive,
  DialogTitle as DialogTitlePrimitive,
  DialogTrigger as DialogTriggerPrimitive,
} from '@radix-ui/react-dialog'
import { motion } from 'motion/react'
import type { ComponentPropsWithoutRef } from 'react'

import { IconButton } from '@/components/ui/icon-button'
import { EASE_ENTRANCE, OVERLAY_TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive
const DialogTrigger = DialogTriggerPrimitive
const DialogClose = DialogClosePrimitive
const DialogPortal = DialogPortalPrimitive

type DialogOverlayProps = {
  className?: string | undefined
}

/**
 * Scrim only — no consumer props are forwarded, which keeps the Radix element's
 * `style` from clashing with Motion's own transform handling.
 */
function DialogOverlay({ className }: DialogOverlayProps) {
  return (
    <DialogOverlayPrimitive asChild>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={OVERLAY_TRANSITION}
        className={cn('inset-0 fixed z-50 bg-canvas/80', className)}
      />
    </DialogOverlayPrimitive>
  )
}

type DialogContentProps = Omit<
  ComponentPropsWithoutRef<typeof DialogContentPrimitive>,
  'asChild' | 'title'
>

/**
 * Centred dialog on tablet and up; a bottom sheet on phones, which is the
 * pattern people already expect from their OS. Motion is applied to an inner
 * element so the CSS positioning of the Radix content is never fought over.
 */
function DialogContent({ className, children, ...props }: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogContentPrimitive asChild {...props}>
        <div
          className={cn(
            'inset-x-0 bottom-0 fixed z-50 mx-auto flex w-full justify-center',
            'pb-[max(1rem,env(safe-area-inset-bottom))]',
            'max-sm:items-end max-sm:px-3',
            'sm:bottom-auto sm:top-1/2 sm:items-center sm:px-4 sm:-translate-y-1/2',
          )}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.28, ease: EASE_ENTRANCE }}
            className={cn(
              'relative w-full max-w-[26rem] overflow-hidden border border-line bg-overlay shadow-lg',
              'max-sm:rounded-b-none max-sm:border-b-0 sm:rounded-b-xl rounded-t-xl',
              className,
            )}
          >
            {children}
            <DialogClosePrimitive asChild>
              <IconButton
                label="Close dialog"
                size="icon-sm"
                className="top-3 right-3 absolute text-ink-muted"
              />
            </DialogClosePrimitive>
          </motion.div>
        </div>
      </DialogContentPrimitive>
    </DialogPortal>
  )
}

type DialogHeaderProps = ComponentPropsWithoutRef<'div'>
function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return <div className={cn('gap-1.5 p-6 pb-5 flex flex-col', className)} {...props} />
}

type DialogBodyProps = ComponentPropsWithoutRef<'div'>
function DialogBody({ className, ...props }: DialogBodyProps) {
  return <div className={cn('px-6', className)} {...props} />
}

type DialogFooterProps = ComponentPropsWithoutRef<'div'>
function DialogFooter({ className, ...props }: DialogFooterProps) {
  return (
    <div
      className={cn('gap-2 px-6 pt-6 pb-6 flex items-center justify-end', className)}
      {...props}
    />
  )
}

type DialogTitleProps = ComponentPropsWithoutRef<typeof DialogTitlePrimitive>
function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <DialogTitlePrimitive
      className={cn('font-medium tracking-tight text-lg text-ink', className)}
      {...props}
    />
  )
}

type DialogDescriptionProps = ComponentPropsWithoutRef<typeof DialogDescriptionPrimitive>
function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <DialogDescriptionPrimitive className={cn('text-sm text-ink-muted', className)} {...props} />
  )
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
export type { DialogBodyProps, DialogContentProps, DialogFooterProps, DialogHeaderProps }
