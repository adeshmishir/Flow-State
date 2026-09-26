'use client'

import { SegmentedRadio, type SegmentedOption } from '@/components/ui/segmented-radio'
import { Surface } from '@/components/ui/surface'
import { Eyebrow } from '@/components/ui/eyebrow'
import { type ThemePreference, useTheme } from '@/hooks/use-theme'

const THEME_OPTIONS: readonly SegmentedOption<ThemePreference>[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const HINTS: Record<ThemePreference, string> = {
  system: 'Follows your operating system, including its light and dark schedule.',
  light: 'A warm paper canvas, for bright rooms and long reading.',
  dark: 'A warm charcoal canvas. Flowstate opens here by default.',
}

/**
 * Appearance is the one preference that belongs to the design system itself
 * rather than to a later feature, so it is live on this route. Everything else
 * on Settings is still on the roadmap.
 */
function AppearanceControl() {
  const { preference, setPreference } = useTheme()

  return (
    <Surface className="p-6 sm:p-8">
      <Eyebrow>Appearance</Eyebrow>
      <SegmentedRadio
        className="mt-4 max-w-sm"
        legend="Theme"
        name="theme"
        options={THEME_OPTIONS}
        value={preference}
        onValueChange={setPreference}
        hint={HINTS[preference]}
      />
    </Surface>
  )
}

export { AppearanceControl }
