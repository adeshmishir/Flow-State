'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import { routeVariants } from '@/lib/motion'

/**
 * Route transition.
 *
 * `template.tsx` is re-created on every navigation, which is exactly the mount
 * a page entrance needs — so the shell (sidebar, tab bar) stays mounted and
 * only the page animates. `reducedMotion: 'user'` is set once in the app
 * providers, so this becomes an instant fade for anyone who has asked for less
 * motion.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div variants={routeVariants} initial="hidden" animate="visible">
      {children}
    </motion.div>
  )
}
