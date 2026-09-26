import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  /** Route path. */
  to: string
  icon: LucideIcon
  /** Used in tooltips when the label is hidden (collapsed rail, mobile). */
  description: string
}
