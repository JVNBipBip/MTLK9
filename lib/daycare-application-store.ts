import { createHash } from "node:crypto"
import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore"
import type { DaycareAnswers, DaycareLocale } from "@/lib/daycare-intake"

export class DaycareSubmissionConflict extends Error {}
export class DaycareSubmissionLimited extends Error {}

export async function storeDaycareApplication(db: Firestore, input: { requestId: string; locale: DaycareLocale; answers: DaycareAnswers; rateIdentity: string }, now = Date.now()) {
  const hash = (value: string) => createHash("sha256").update(value).digest("hex")
  const id = hash(`daycare:${input.requestId}`)
  const payloadHash = hash(JSON.stringify({ locale: input.locale, answers: input.answers }))
  const ref = db.collection("daycare_applications").doc(id)
  const hour = Math.floor(now / 3_600_000)
  const ipRate = db.collection("daycare_submission_limits").doc(`${hour}-ip-${input.rateIdentity}`)
  const emailRate = db.collection("daycare_submission_limits").doc(`${hour}-email-${hash(String(input.answers.ownerEmail))}`)
  const created = await db.runTransaction(async transaction => {
    const existing = await transaction.get(ref)
    if (existing.exists) {
      if (existing.data()?.payloadHash !== payloadHash) throw new DaycareSubmissionConflict()
      return false
    }
    const [ip, email] = await Promise.all([transaction.get(ipRate), transaction.get(emailRate)])
    if (Number(ip.data()?.count || 0) >= 10 || Number(email.data()?.count || 0) >= 3) throw new DaycareSubmissionLimited()
    const expiresAt = Timestamp.fromMillis(now + 172_800_000)
    transaction.set(ipRate, { count: Number(ip.data()?.count || 0) + 1, expiresAt })
    transaction.set(emailRate, { count: Number(email.data()?.count || 0) + 1, expiresAt })
    transaction.create(ref, { schemaVersion: 1, id, locale: input.locale, answers: input.answers, status: "pending", revision: 1, payloadHash, createdAt: FieldValue.serverTimestamp(), createdAtIso: new Date(now).toISOString(), notificationStatus: "pending", notificationAttemptAtIso: new Date(now).toISOString(), source: "website-daycare-application" })
    return true
  })
  return { id, ref, created }
}
