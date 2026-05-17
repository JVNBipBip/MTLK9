import crypto from "node:crypto"
import { getAdminDb } from "@/lib/firebase-admin"
import {
  clientBookingSettingsRef,
  findClientConsultationByAccessTokenHash,
  findClientConsultationById,
} from "@/lib/client-records"

/** Matches MTLK9-Admin `hashInviteToken` — booking access stores SHA-256 hex of the raw token. */
export function hashInviteToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export type TrainingPortalConsultationTrust = {
  consultationId: string
  consultation: Record<string, unknown>
}

function normalizedEmail(value: string) {
  return value.trim().toLowerCase()
}

function normalizedDog(value: string) {
  return value.trim().toLowerCase()
}

function consultationRowFromDoc(
  id: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  return { ...data, id: String(data.id || id) }
}

function bookingAccessIsValid(
  bookingAccess: { expiresAtIso?: string; revokedAtIso?: string | null } | undefined,
): boolean {
  if (!bookingAccess?.expiresAtIso || bookingAccess.revokedAtIso) return false
  const t = new Date(bookingAccess.expiresAtIso).getTime()
  return Number.isFinite(t) && t > Date.now()
}

async function trustFromBookingAccessToken(
  bookingAccessToken: string,
  clientEmail: string,
  dogName: string,
): Promise<TrainingPortalConsultationTrust | null> {
  const db = getAdminDb()
  const hash = hashInviteToken(bookingAccessToken.trim())
  const doc = await findClientConsultationByAccessTokenHash(db, hash)
  if (!doc?.exists) return null

  const data = doc.data() as Record<string, unknown>
  if (String(data.status || "") !== "completed") return null
  if (!bookingAccessIsValid(data.bookingAccess as { expiresAtIso?: string; revokedAtIso?: string | null })) {
    return null
  }

  const docClient = normalizedEmail(
    String(data.clientEmail || data.clientId || ""),
  )
  const docDogNorm = normalizedDog(String(data.dogName || ""))
  const reqDogNorm = normalizedDog(dogName)
  if (docClient !== normalizedEmail(clientEmail)) return null
  if (reqDogNorm && docDogNorm && reqDogNorm !== docDogNorm) return null

  const consultationId = String(data.id || doc.id)
  return {
    consultationId,
    consultation: consultationRowFromDoc(doc.id, data),
  }
}

async function trustFromPortalProof(
  portalProof: string,
  clientEmail: string,
  dogName: string,
): Promise<TrainingPortalConsultationTrust | null> {
  const secret = process.env.PORTAL_BOOKING_LINK_SECRET?.trim()
  if (!secret) return null

  const parts = portalProof.split(".")
  if (parts.length !== 2) return null
  const [payloadB64, sigHex] = parts
  if (!payloadB64 || !sigHex || !/^[0-9a-f]+$/i.test(sigHex)) return null

  const expectedSig = crypto.createHmac("sha256", secret).update(payloadB64).digest("hex")
  try {
    const a = Buffer.from(expectedSig, "hex")
    const b = Buffer.from(sigHex, "hex")
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  let payload: { v?: number; e?: string; d?: string; c?: string; x?: number }
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as typeof payload
  } catch {
    return null
  }

  if (payload.v !== 1 || !payload.c || !payload.e || !payload.d || typeof payload.x !== "number") return null
  if (Date.now() / 1000 > payload.x) return null
  if (normalizedEmail(payload.e) !== normalizedEmail(clientEmail)) return null
  if (normalizedDog(payload.d) !== normalizedDog(dogName)) return null

  const db = getAdminDb()
  const doc = await findClientConsultationById(db, String(payload.c))
  if (!doc?.exists) return null

  const data = doc.data() as Record<string, unknown>
  if (String(data.status || "") !== "completed") return null

  const docClient = normalizedEmail(String(data.clientEmail || data.clientId || ""))
  const docDog = normalizedDog(String(data.dogName || ""))
  if (docClient !== normalizedEmail(clientEmail)) return null
  if (normalizedDog(dogName) !== docDog) return null

  const consultationId = String(data.id || doc.id)
  return {
    consultationId,
    consultation: consultationRowFromDoc(doc.id, data),
  }
}

/**
 * Staff-issued booking access token (`/booking-access/{token}`) or HMAC `portalProof`
 * proves a completed consultation so clients skip re-entering assessment in the training portal.
 */
export async function assertTrainingPortalConsultationTrust(input: {
  portalProof?: string | undefined
  bookingAccessToken?: string | undefined
  clientEmail: string
  dogName: string
}): Promise<TrainingPortalConsultationTrust | null> {
  const bookingAccessToken = input.bookingAccessToken?.trim()
  if (bookingAccessToken) {
    const trust = await trustFromBookingAccessToken(bookingAccessToken, input.clientEmail, input.dogName)
    if (trust) return trust
  }

  const portalProof = input.portalProof?.trim()
  if (portalProof) {
    const trust = await trustFromPortalProof(portalProof, input.clientEmail, input.dogName)
    if (trust) return trust
  }

  return null
}

function normalizeTeamMemberIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const item of raw) {
    const id = String(item || "").trim()
    if (id) out.push(id)
  }
  return [...new Set(out)]
}

/**
 * Resolves which Square team_member_ids may appear for private lessons from this consultation / client.
 *
 * Order: per-invite list on the consultation → client booking settings → consultation trainer → unrestricted (null).
 */
export async function resolvePrivateTrainerAllowList(
  clientId: string,
  consultationRow: Record<string, unknown> | null | undefined,
): Promise<string[] | null> {
  const invite = normalizeTeamMemberIdList(consultationRow?.privateLessonInviteTrainerTeamMemberIds)
  if (invite.length > 0) return invite

  const key = clientId.trim().toLowerCase()
  if (key) {
    const db = getAdminDb()
    const snap = await clientBookingSettingsRef(db, key).get()
    const fromSettings = normalizeTeamMemberIdList(snap.data()?.privatePortalTrainerTeamMemberIds)
    if (fromSettings.length > 0) return fromSettings
  }

  const consultTrainer = String(
    consultationRow?.consultationTeamMemberId || consultationRow?.teamMemberId || "",
  ).trim()
  if (consultTrainer) return [consultTrainer]

  return null
}

export function trainerAllowedByList(teamMemberId: string, allowList: string[] | null): boolean {
  if (!allowList || allowList.length === 0) return true
  const id = teamMemberId.trim()
  if (!id) return false
  return allowList.includes(id)
}
