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

/* ------------------------------------------------------------------------- *
 * The focus room
 * ------------------------------------------------------------------------- */

/**
 * Entering focus is the one transition in the product that is allowed to feel
 * like a change of *room* rather than a change of *page*.
 *
 * Four beats, 640ms end to end, and each one is quiet:
 *   1. the canvas settles (handled in CSS, see `[data-focus-room]`)
 *   2. the room itself arrives — a hair smaller and slightly transparent
 *   3. the task title resolves
 *   4. the ring draws itself in as far as the session has progressed
 *
 * Springs are deliberately absent. A spring here would read as playful, and
 * focus should not feel playful.
 */

/** How long the whole entrance takes. */
export const FOCUS_ENTRANCE_MS = 0.64

export const focusRoomVariants: Variants = {
  hidden: { opacity: 0, scale: 1.015 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: FOCUS_ENTRANCE_MS, ease: EASE_ENTRANCE },
  },
  exit: {
    opacity: 0,
    scale: 0.99,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  },
}

export const focusTitleVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: EASE_ENTRANCE, delay: 0.08 },
  },
}

export const focusDialVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_ENTRANCE, delay: 0.14 },
  },
}

/** Controls arrive last: the room should be usable before it is dressed. */
export const focusControlsVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: EASE_ENTRANCE, delay: 0.24 },
  },
}

/** The secondary row, revealed when notes or a dialog needs room. */
export const focusRevealVariants: Variants = {
  hidden: { opacity: 0, y: -4, height: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: { duration: 0.26, ease: EASE_ENTRANCE },
  },
  exit: { opacity: 0, y: -4, height: 0, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
}

/** Completion: the room lifts rather than slides. */
export const focusCompleteVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.44, ease: EASE_ENTRANCE } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
}

/** Pause/resume: a short, wide press. Reads as the room taking a breath. */
export const stateSwapVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE_ENTRANCE } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } },
}
