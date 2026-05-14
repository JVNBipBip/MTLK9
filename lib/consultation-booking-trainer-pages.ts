import { SQUARE_SERVICE_CONFIG_COLLECTION } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import { getSquareServiceConfig } from "@/lib/square-service-config"
import { defaultBookingTrainerImageMap } from "@/lib/team-trainer-photos"

/** Parse CONSULTATION_BOOKING_TRAINER_SLUGS=nick:TMxxx,jane:TMyyy */
function trainerSlugsFromEnv(): Record<string, string> {
  const raw = process.env.CONSULTATION_BOOKING_TRAINER_SLUGS?.trim()
  if (!raw) return {}
  const out: Record<string, string> = {}
  for (const part of raw.split(",")) {
    const idx = part.indexOf(":")
    if (idx <= 0) continue
    const slug = part.slice(0, idx).trim().toLowerCase()
    const id = part.slice(idx + 1).trim()
    if (slug && id) out[slug] = id
  }
  return out
}

function normalizeSlugMap(input: Record<string, string | undefined> | null | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!input || typeof input !== "object") return out
  for (const [k, v] of Object.entries(input)) {
    const slug = k.trim().toLowerCase()
    const id = typeof v === "string" ? v.trim() : ""
    if (slug && id) out[slug] = id
  }
  return out
}

/** Parse CONSULTATION_BOOKING_TRAINER_IMAGES=nick:/images/team/custom.png — overrides bios/default paths */
function trainerImagesFromEnv(): Record<string, string> {
  const raw = process.env.CONSULTATION_BOOKING_TRAINER_IMAGES?.trim()
  if (!raw) return {}
  const out: Record<string, string> = {}
  for (const part of raw.split(",")) {
    const idx = part.indexOf(":")
    if (idx <= 0) continue
    const slug = part.slice(0, idx).trim().toLowerCase()
    const path = part.slice(idx + 1).trim()
    if (slug && path) out[slug] = path
  }
  return out
}

/** Slugs allowed for /booking/[slug] → Square team_member_id (Firestore overrides env for same key). */
export async function getConsultationBookingTrainerSlugMap(): Promise<Record<string, string>> {
  const fromEnv = trainerSlugsFromEnv()
  let fromRoot: Record<string, string> = {}
  try {
    const db = getAdminDb()
    const doc = await db.collection(SQUARE_SERVICE_CONFIG_COLLECTION).doc("default").get()
    const data = doc.data() as Record<string, unknown> | undefined
    fromRoot = normalizeSlugMap(data?.consultationBookingTrainerSlugs as Record<string, string | undefined>)
  } catch {
    /* non-blocking */
  }
  const config = await getSquareServiceConfig()
  const fromLocation = normalizeSlugMap(config.consultationBookingTrainerSlugs)
  return { ...fromEnv, ...fromRoot, ...fromLocation }
}

/** Slug → public image path under `/public` for trainer landing hero (Firestore/env override defaults from team bios). */
export async function getConsultationBookingTrainerImageMap(): Promise<Record<string, string>> {
  const defaults = defaultBookingTrainerImageMap()
  const fromEnv = trainerImagesFromEnv()
  let fromRoot: Record<string, string> = {}
  try {
    const db = getAdminDb()
    const doc = await db.collection(SQUARE_SERVICE_CONFIG_COLLECTION).doc("default").get()
    const data = doc.data() as Record<string, unknown> | undefined
    fromRoot = normalizeSlugMap(data?.consultationBookingTrainerImages as Record<string, string | undefined>)
  } catch {
    /* non-blocking */
  }
  const config = await getSquareServiceConfig()
  const fromLocation = normalizeSlugMap(config.consultationBookingTrainerImages)
  return { ...defaults, ...fromEnv, ...fromRoot, ...fromLocation }
}

export async function getConsultationBookingTrainerHeroImageForSlug(slug: string): Promise<string | null> {
  const key = slug.trim().toLowerCase()
  if (!key) return null
  const map = await getConsultationBookingTrainerImageMap()
  const src = map[key]?.trim()
  return src || null
}

export async function resolveConsultationBookingTrainerTeamMemberId(slug: string): Promise<string | null> {
  const key = slug.trim().toLowerCase()
  if (!key) return null
  const map = await getConsultationBookingTrainerSlugMap()
  return map[key] || null
}
