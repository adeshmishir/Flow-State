export type Plan = 'Personal' | 'Studio'

export interface UserProfile {
  id: string
  name: string
  email: string
  /** Fallback for the avatar when no image is available. */
  initials: string
  plan: Plan
  /** IANA zone, e.g. `"Europe/Lisbon"`. */
  timeZone: string
}
