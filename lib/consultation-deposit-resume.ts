import type { BookingFormData } from "@/app/booking/types"
import { INITIAL_FORM_DATA } from "@/app/booking/types"
import { findClientConsultationByDepositResumeTokenHash } from "@/lib/client-records"
import { defaultLocale, isAppLocale, type AppLocale } from "@/lib/i18n/config"
import type { Firestore } from "firebase-admin/firestore"
import { hashAccessToken } from "@/lib/tokens"

/** Firestore may return string arrays as keyed maps; normalize IDs for resume eligibility. */
function coalesceFirestoreStringIds(value: unknown): string[] {
  if (value === null || value === undefined) return []
  if (Array.isArray(value)) {
    return [...new Set(value.map((x) => String(x).trim()).filter(Boolean))]
  }
  if (typeof value === "object") {
    const vals = Object.values(value as Record<string, unknown>)
      .map((x) => String(x).trim())
      .filter(Boolean)
    return [...new Set(vals)]
  }
  return []
}

export type ConsultationDepositResumePageData = {
  initialFormData: Partial<BookingFormData>
  pinnedTeamMemberId: string | null
  trainerPageSlug: string | null
  locale: AppLocale
  /** Limits scheduling step to these Square team member ids (staff-set on inquiry link). */
  allowTeamMemberIds: string[] | null
}

function str(v: unknown): string {
  return typeof v === "string" ? v : ""
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === "string")
}

function followUpsRecord(v: unknown): Record<string, string> {
  if (!v || typeof v !== "object") return {}
  const out: Record<string, string> = {}
  for (const [key, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === "string" && val) out[key] = val
  }
  return out
}

function consultationDataToFormPartial(data: Record<string, unknown>): Partial<BookingFormData> {
  const clientEmail = str(data.clientEmail || data.clientId)
  return {
    issue: str(data.issue),
    issueOther: str(data.issueOther),
    followUps: followUpsRecord(data.followUps),
    duration: str(data.duration),
    tried: strArray(data.tried),
    impact: strArray(data.impact),
    goals: strArray(data.goals),
    connectMethod: "in-person-evaluation",
    dogName: str(data.dogName),
    dogBreed: str(data.dogBreed),
    dogAge: str(data.dogAge),
    dogDuration: str(data.dogDuration),
    dogSource: str(data.dogSource),
    contactName: str(data.clientName),
    contactEmail: clientEmail,
    contactPhone: str(data.clientPhone),
    contactBestTime: str(data.contactBestTime),
    contactNotes: str(data.contactNotes),
    consultationDateTime: "",
    consultationSlotKey: "",
    consultationTeamMemberId: "",
    consultationTeamMemberName: "",
    consultationServiceVariationId: "",
    consultationLocation: "",
    consultationWhat: INITIAL_FORM_DATA.consultationWhat,
    fbclid: "",
  }
}

export async function loadConsultationDepositResumePageData(
  db: Firestore,
  plainToken: string,
): Promise<ConsultationDepositResumePageData | null> {
  const trimmed = plainToken.trim()
  if (!trimmed) return null

  const tokenHash = hashAccessToken(trimmed)
  const doc = await findClientConsultationByDepositResumeTokenHash(db, tokenHash)
  if (!doc) return null

  const data = doc.data() as Record<string, unknown>
  const access = data.depositResumeAccess as
    | { tokenHash?: string; expiresAtIso?: string; revokedAtIso?: string | null }
    | undefined
    | null

  if (!access?.tokenHash || access.tokenHash !== tokenHash) return null
  if (access.revokedAtIso) return null

  const status = String(data.status || "").trim().toLowerCase()
  if (status === "completed") return null

  const localeRaw = str(data.preferredLocale || data.websiteLocale)
  const locale = isAppLocale(localeRaw) ? localeRaw : defaultLocale

  const allowTeamMemberIds = coalesceFirestoreStringIds(data.depositResumeAllowedTeamMemberIds)

  const preferredPinned =
    str(data.consultationPreferredTrainerTeamMemberId).trim() ||
    str(data.consultationTeamMemberId).trim() ||
    null

  const slugRaw = str(data.consultationBookingTrainerPageSlug).trim()

  let pinnedTeamMemberId: string | null = preferredPinned
  let trainerPageSlug: string | null = slugRaw || null

  if (allowTeamMemberIds.length === 1) {
    pinnedTeamMemberId = allowTeamMemberIds[0]
    trainerPageSlug = null
  } else if (allowTeamMemberIds.length > 1) {
    pinnedTeamMemberId = null
    trainerPageSlug = null
  }

  return {
    initialFormData: consultationDataToFormPartial(data),
    pinnedTeamMemberId,
    trainerPageSlug,
    locale,
    allowTeamMemberIds: allowTeamMemberIds.length > 0 ? allowTeamMemberIds : null,
  }
}
