import type { Transition, Variants } from 'motion/react'

/**
 * Flowstate — motion foundation
 * ---------------------------------------------------------------------------
 * One vocabulary of movement, declared once. Durations are deliberately short
 * (120–300ms) and easing never overshoots: motion here should confirm an action,
 * not perform one.
 *
 * The whole product is switched to reduced-motion in `app/providers.tsx` via
 * Motion's `reducedMotion: 'user'`, so nothing below needs its own opt-out.
 */

/** Fast, for micro-feedback: hovers, presses, small state flips. */
export const EASE_OUT: [number, number, number, number] = [0.2, 0, 0, 1]

/** Decelerating, for things entering the viewport. */
export const EASE_ENTRANCE: [number, number, number, number] = [0.16, 1, 0.3, 1]

/** Route-level cross-fade plus a few pixels of travel. */
export const ROUTE_TRANSITION: Transition = {
  duration: 0.24,
  ease: EASE_OUT,
}

/** Overlay scrims. */
export const OVERLAY_TRANSITION: Transition = {
  duration: 0.16,
  ease: EASE_OUT,
}

/** The wrapper `app/template.tsx` puts around every route. */
export const routeVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: ROUTE_TRANSITION },
}

/**
 * Page root. Owns nothing itself — it only hands the timing to its children so
 * a page composes its entrance from reading order.
 */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
}

/** The standard child: fades up 6px. Nothing more. */
export const blockVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_ENTRANCE } },
}
