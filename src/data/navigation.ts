import { CalendarClock, House, ListTodo, SlidersHorizontal, Timer } from 'lucide-react'

import type { NavItem } from '@/types/navigation'

/**
 * Primary destinations. Identical order on desktop rail and mobile tab bar so
 * the two never disagree about where things are.
 */
export const primaryNavItems: readonly NavItem[] = [
  {
    label: 'Home',
    to: '/',
    icon: House,
    description: 'Today at a glance',
  },
  {
    label: 'Focus',
    to: '/focus',
    icon: Timer,
    description: 'Run a session',
  },
  {
    label: 'Tasks',
    to: '/tasks',
    icon: ListTodo,
    description: 'Your queue',
  },
  {
    label: 'History',
    to: '/history',
    icon: CalendarClock,
    description: 'Past sessions',
  },
] as const

/** Lives in the sidebar footer on desktop, as a tab on mobile. */
export const settingsNavItem: NavItem = {
  label: 'Settings',
  to: '/settings',
  icon: SlidersHorizontal,
  description: 'Preferences and account',
} as const

/** Primary destinations plus settings — used by the mobile tab bar. */
export const mobileNavItems: readonly NavItem[] = [...primaryNavItems, settingsNavItem] as const
