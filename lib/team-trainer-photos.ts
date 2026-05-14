/**
 * Canonical trainer headshots under /public/images/team.
 * Used by About bios and default hero images for `/booking/[trainerSlug]` when
 * consultationBookingTrainerImages / env omit a slug (see consultation-booking-trainer-pages.ts).
 */

export const TEAM_TRAINER_PHOTOS_BY_BOOKING_SLUG = {
  nick: "/images/team/nick.png",
  tyson: "/images/team/tyson.jpg",
  mia: "/images/team/mia.jpeg",
} as const

export type CanonicalTrainerBookingSlug = keyof typeof TEAM_TRAINER_PHOTOS_BY_BOOKING_SLUG

/** Object-fit positions for bios (and optionally booking hero — same cropping intent). */
export const TEAM_TRAINER_PHOTO_POSITIONS_BY_BOOKING_SLUG = {
  nick: "object-[50%_8%]",
  mia: "object-[50%_30%]",
} as const satisfies Partial<Record<CanonicalTrainerBookingSlug, string>>

export function defaultBookingTrainerImageMap(): Record<string, string> {
  return { ...TEAM_TRAINER_PHOTOS_BY_BOOKING_SLUG }
}

/** Same framing as About bios for known slugs (`/booking/[slug]` hero). */
export function trainerPhotoPositionClassForBookingSlug(slug: string): string | undefined {
  const key = slug.trim().toLowerCase()
  if (key in TEAM_TRAINER_PHOTO_POSITIONS_BY_BOOKING_SLUG) {
    return TEAM_TRAINER_PHOTO_POSITIONS_BY_BOOKING_SLUG[key as keyof typeof TEAM_TRAINER_PHOTO_POSITIONS_BY_BOOKING_SLUG]
  }
  return undefined
}
