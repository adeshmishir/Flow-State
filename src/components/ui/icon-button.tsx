import { type ButtonProps, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type IconButtonProps = Omit<ButtonProps, 'size'> & {
  size?: 'icon-sm' | 'icon-md' | 'icon-lg'
  /**
   * Required. Icon-only controls have no visible text, so the accessible name
   * cannot be inferred — forcing it here removes an entire class of a11y bug.
   */
  label: string
}

/**
 * Square, icon-only button. Shares every variant and state with `Button`; the
 * only differences are the mandatory label and the square footprint.
 */
function IconButton({
  label,
  size = 'icon-md',
  variant = 'ghost',
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      data-slot="icon-button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { IconButton }
export type { IconButtonProps }
