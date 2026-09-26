'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import { blockVariants, staggerContainer } from '@/lib/motion'

type PageContainerProps = {
  children: ReactNode
  className?: string
}

/**
 * Page root and the single stagger container for a route's entrance.
 *
 * The wrapper itself does not fade — `app/template.tsx` owns that — so a page
 * can never end up with two nested fades.
 */
function PageContainer({ children, className }: PageContainerProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

type PageSectionProps = {
  children: ReactNode
  className?: string
}

/** A block inside a `PageContainer`: fades up 6px, in reading order. */
function PageSection({ children, className }: PageSectionProps) {
  return (
    <motion.div variants={blockVariants} className={className}>
      {children}
    </motion.div>
  )
}

export { PageContainer, PageSection }
export type { PageContainerProps, PageSectionProps }
