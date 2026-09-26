'use client'

import { SegmentedRadio, type SegmentedOption } from '@/components/ui/segmented-radio'
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
 * Appearance.
 *
 * Kept as its own component rather than folded into the focus preferences, for
 * one reason: theme is applied by an inline script in the document head, before
 * React exists at all, so it is a different kind of setting with a different kind
 * of failure mode. Merging the two would hide that behind a shared form.
 */
function AppearanceControl() {
  const { preference, setPreference } = useTheme()

  return (
    <SegmentedRadio
      legend="Theme"
      name="theme"
      options={THEME_OPTIONS}
      value={preference}
      onValueChange={setPreference}
      hint={HINTS[preference]}
    />
  )
}

export { AppearanceControl }
