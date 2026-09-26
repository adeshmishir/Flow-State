import { cn } from '@/lib/utils'

export type SegmentedOption<T extends string> = {
  value: T
  label: string
}

type SegmentedRadioProps<T extends string> = {
  legend: string
  name: string
  options: readonly SegmentedOption<T>[]
  value: T
  onValueChange: (value: T) => void
  /** One line explaining the current choice. */
  hint?: string | undefined
  /** Grid classes for the option row, e.g. `grid-cols-3`. */
  columnsClassName?: string
  className?: string
}

const segmentClasses = [
  'flex h-9 cursor-pointer items-center justify-center rounded-md border border-line bg-surface',
  'text-center text-sm text-ink-secondary transition-colors duration-150 ease-standard',
  'hover:border-line-strong hover:text-ink',
  'peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:font-medium peer-checked:text-accent-soft-ink',
  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus',
].join(' ')

/**
 * Segmented single-choice control built on native radio inputs.
 *
 * Radix has no radio group in our dependency set, and native radios already
 * give correct keyboard behaviour (arrow keys, roving focus, form semantics)
 * for free. The visible control is a `peer` sibling, so the focus ring lands on
 * the segment the user is actually on.
 */
function SegmentedRadio<T extends string>({
  legend,
  name,
  options,
  value,
  onValueChange,
  hint,
  columnsClassName = 'grid-cols-3',
  className,
}: SegmentedRadioProps<T>) {
  return (
    <fieldset className={cn('space-y-2', className)}>
      <legend className="font-medium text-2xs tracking-[0.09em] text-ink-muted uppercase">
        {legend}
      </legend>
      <div className={cn('gap-2 grid', columnsClassName)}>
        {options.map((option) => (
          <label key={option.value} className="block">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onValueChange(option.value)}
              className="peer sr-only"
            />
            <span className={segmentClasses}>{option.label}</span>
          </label>
        ))}
      </div>
      {hint ? <p className="text-xs text-ink-subtle">{hint}</p> : null}
    </fieldset>
  )
}

export { SegmentedRadio }
export type { SegmentedRadioProps }
