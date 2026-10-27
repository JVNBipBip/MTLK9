import { createHmac } from "node:crypto"
import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase-admin"
import { validateDaycareAnswers } from "@/lib/daycare-intake"
import { DaycareSubmissionConflict, DaycareSubmissionLimited, storeDaycareApplication } from "@/lib/daycare-application-store"
import { notifyDaycareApplication } from "@/lib/daycare-notifications"

export const runtime = "nodejs"
export const maxDuration = 60
const response = (data: object, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } })

async function boundedJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader()
  if (!reader) throw new Error("invalid")
  let size = 0
  const chunks: Uint8Array[] = []
  for (;;) {
    const result = await reader.read()
    if (result.done) break
    size += result.value.byteLength
    if (size > 24_000) { await reader.cancel(); throw new Error("too_large") }
    chunks.push(result.value)
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"))
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return response({ error: "forbidden" }, 403)
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return response({ error: "invalid_request" }, 415)
  let body: Record<string, unknown>
  try {
    const raw = await boundedJson(request)
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("invalid")
    body = raw as Record<string, unknown>
  } catch (error) { return response({ error: "invalid_request" }, error instanceof Error && error.message === "too_large" ? 413 : 400) }
  if (body.website) return response({ ok: true })
  if (typeof body.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId) || (body.locale !== "en" && body.locale !== "fr")) return response({ error: "invalid_request" }, 400)
  const parsed = validateDaycareAnswers(body.answers)
  if (parsed.errors.length) return response({ error: "invalid_answers", fields: parsed.errors }, 400)
  try {
    // A separate key keeps intake rate limiting independent of database credentials.
    const secret = process.env.DAYCARE_RATE_LIMIT_SECRET
    if (!secret || secret.length < 32) return response({ error: "unavailable" }, 503)
    const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
    const rateIdentity = createHmac("sha256", secret).update(ip).digest("hex")
    const saved = await storeDaycareApplication(getAdminDb(), { requestId: body.requestId, locale: body.locale, answers: parsed.answers, rateIdentity })
    if (saved.created) {
      let sent = false
      try { sent = await notifyDaycareApplication(saved.id) } catch { /* The saved application must remain successful even if email is down. */ }
      try { await saved.ref.update({ notificationStatus: sent ? "sent" : "failed", notificationAttemptAtIso: new Date().toISOString() }) } catch { console.error("[daycare] Could not record notification status") }
    }
    return response({ ok: true })
  } catch (error) {
    if (error instanceof DaycareSubmissionConflict) return response({ error: "request_conflict" }, 409)
    if (error instanceof DaycareSubmissionLimited) return response({ error: "please_try_later" }, 429)
    console.error("[daycare] Application could not be saved")
    return response({ error: "unavailable" }, 503)
  }
}
