import type { Metadata } from 'next'

import { RoutePlaceholder } from '@/components/layout/route-placeholder'
import { AppearanceControl } from '@/features/settings/appearance-control'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Preferences and account.',
}

export default function SettingsPage() {
  return (
    <RoutePlaceholder
      eyebrow="Settings"
      title="Preferences."
      description="Set the defaults once. Flowstate should stop asking."
      stage="Stage 3"
      planned={[
        'Session lengths and daily focus goals',
        'What happens when a session ends',
        'Notifications, and when to stay quiet',
        'Projects, tags and how they are grouped',
        'Account, plan and data export',
      ]}
    >
      <AppearanceControl />
    </RoutePlaceholder>
  )
}
