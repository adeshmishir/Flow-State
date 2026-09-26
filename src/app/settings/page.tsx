import type { Metadata } from 'next'

import { PageHeader } from '@/components/layout/page-header'
import { PageContainer, PageSection } from '@/components/motion/page-container'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Surface } from '@/components/ui/surface'
import { AppearanceControl } from '@/features/settings/appearance-control'
import { DataPanel } from '@/features/settings/data-panel'
import { FocusPreferences } from '@/features/settings/focus-preferences'

/**
 * Settings.
 *
 * A real route now, with the three settings that have a second reader somewhere
 * else in the app. The header and the section framing stay server-rendered; only
 * the controls hydrate.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Focus goals, session defaults and appearance.',
}

export default function SettingsPage() {
  return (
    <PageContainer className="gap-10 lg:gap-12 flex flex-col">
      <PageSection>
        <PageHeader
          eyebrow="Settings"
          title="Set the defaults once."
          description="Everything here is stored on this device. Flowstate should stop asking."
        />
      </PageSection>

      <PageSection>
        <Surface className="p-6 sm:p-8">
          <Eyebrow>Focus</Eyebrow>
          <div className="mt-5">
            <FocusPreferences />
          </div>
        </Surface>
      </PageSection>

      <PageSection>
        <Surface className="p-6 sm:p-8">
          <Eyebrow>Appearance</Eyebrow>
          <div className="mt-5">
            <AppearanceControl />
          </div>
        </Surface>
      </PageSection>

      <PageSection>
        <DataPanel />
      </PageSection>
    </PageContainer>
  )
}
