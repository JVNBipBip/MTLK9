import { unstable_cache } from "next/cache"
import { HIDDEN_PUBLIC_CONSULTATION_TEAM_MEMBER_IDS } from "@/lib/consultation-public-team-members"
import { SQUARE_SERVICE_CONFIG_COLLECTION } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import {
  listBookableTeamMemberIdsForLocation,
  retrieveSquareTeamMemberProfile,
} from "@/lib/square"
import { getSquareServiceConfig } from "@/lib/square-service-config"
import { defaultBookingTrainerImageMap } from "@/lib/team-trainer-photos"

/** URL segment for `/booking/[slug]` — lowercase, hyphenated ASCII. */
export function slugifyConsultationBookingSlug(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

type BookableTrainerRow = { id: string; given: string; family: string }

async function buildConsultationBookingTrainerSlugMapFromSquare(): Promise<Record<string, string>> {
  let ids: string[] = []
  try {
    ids = await listBookableTeamMemberIdsForLocation()
  } catch {
    return {}
  }

  const visible = ids.filter((id) => !HIDDEN_PUBLIC_CONSULTATION_TEAM_MEMBER_IDS.has(id))
  const rows = (
    await Promise.all(
      visible.map(async (id) => {
        try {
          const p = await retrieveSquareTeamMemberProfile(id)
          if (!p) return null
          return { id, given: p.givenName, family: p.familyName } satisfies BookableTrainerRow
        } catch {
          return null
        }
      }),
    )
  ).filter((r): r is BookableTrainerRow => r !== null)

  if (rows.length === 0) return {}

  const shortSlug = (row: BookableTrainerRow): string => {
    const g = slugifyConsultationBookingSlug(row.given)
    if (g) return g
    return slugifyConsultationBookingSlug(row.family)
  }

  const fullSlug = (row: BookableTrainerRow): string => {
    const combined = [row.given, row.family].filter(Boolean).join(" ")
    const s = slugifyConsultationBookingSlug(combined)
    return s || shortSlug(row)
  }

  const shortCounts = new Map<string, number>()
  for (const row of rows) {
    const s = shortSlug(row)
    if (!s) continue
    shortCounts.set(s, (shortCounts.get(s) || 0) + 1)
  }

  const slugToTeamMemberId = new Map<string, string>()
  const assignUnique = (preferredSlug: string, teamMemberId: string) => {
    let base = slugifyConsultationBookingSlug(preferredSlug)
    if (!base) base = slugifyConsultationBookingSlug(teamMemberId.replace(/^TM/i, "")) || "trainer"
    let slug = base
    let n = 2
    while (slugToTeamMemberId.has(slug) && slugToTeamMemberId.get(slug) !== teamMemberId) {
      slug = `${base}-${n++}`
    }
    slugToTeamMemberId.set(slug, teamMemberId)
  }

  for (const row of rows) {
    const short = shortSlug(row)
    const ambiguous = !short || (shortCounts.get(short) || 0) > 1
    let candidate = ambiguous ? fullSlug(row) : short
    if (!slugifyConsultationBookingSlug(candidate)) {
      candidate = slugifyConsultationBookingSlug(row.id.replace(/^TM/i, "")) || row.id.toLowerCase()
    }
    assignUnique(candidate, row.id)
  }

  return Object.fromEntries(slugToTeamMemberId)
}

const getCachedAutoConsultationBookingTrainerSlugMap = unstable_cache(
  async () => buildConsultationBookingTrainerSlugMapFromSquare(),
  ["consultation-booking-trainer-slugs-from-square"],
  { revalidate: 600 },
)

/** Optional override only — prefer Admin/Firestore `consultationBookingTrainerSlugs` or rely on Square bookable staff slugs. */
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

/**
 * `/booking/[slug]` → Square `team_member_id`.
 * Slugs are derived from Square bookable staff (first name if unique, else first-last). Cached ~10m.
 * Firestore/env entries override auto slugs for the same key (aliases / corrections).
 */
export async function getConsultationBookingTrainerSlugMap(): Promise<Record<string, string>> {
  const auto = await getCachedAutoConsultationBookingTrainerSlugMap()
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
  return { ...auto, ...fromEnv, ...fromRoot, ...fromLocation }
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
