// Health endpoint for the Control Center. Returns statuses only, never secrets.
// Requires `Authorization: Bearer <HEALTH_TOKEN>` (set HEALTH_TOKEN in Vercel).
import { createHash } from "node:crypto"
import nodemailer from "nodemailer"
import { getAdminDb } from "@/lib/firebase-admin"
import { SQUARE_TOKENS_COLLECTION } from "@/lib/domain"
import { Timestamp } from "firebase-admin/firestore"
import { getSquareConfigAsync, searchSquareAvailability } from "@/lib/square"
import { getConsultationServiceVariationId } from "@/lib/square-service-config"
import { activityOutcome, customCheck, healthHandler, outcome } from "@/lib/health-kit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

const env = (name: string) => process.env[name]?.trim() ?? ""

const checks = () => [
  // The exact path bookings use: OAuth token from Firestore, refreshed if near expiry, then a live Square call.
  customCheck("square", "Square bookings", async () => {
    let cfg: Awaited<ReturnType<typeof getSquareConfigAsync>>
    try {
      cfg = await getSquareConfigAsync()
    } catch (err) {
      return outcome.fail(err instanceof Error ? err.message : "Square is not configured")
    }
    const res = await fetch(`${cfg.baseUrl}/v2/locations/${encodeURIComponent(cfg.locationId)}`, {
      headers: { Authorization: `Bearer ${cfg.accessToken}`, "Square-Version": cfg.apiVersion },
      cache: "no-store",
    })
    if (res.status === 401) return outcome.fail("Square rejected the access token. Reconnect Square in the admin.")
    if (res.status === 404) return outcome.fail("Square location not found (check SQUARE_LOCATION_ID / Service Mapping)")
    if (!res.ok) return outcome.warn(`Square API returned HTTP ${res.status}`)
    if (cfg.baseUrl.includes("sandbox")) return outcome.warn("Connected, but to the Square SANDBOX, not production", { squareVersion: cfg.apiVersion })
    return outcome.ok(`Connected (Square-Version ${cfg.apiVersion})`, { squareVersion: cfg.apiVersion })
  }, "square"),

  // When the stored OAuth token expires; refresh normally happens within the last hour.
  customCheck("square-token", "Square OAuth token", async () => {
    const snap = await getAdminDb().collection(SQUARE_TOKENS_COLLECTION).limit(5).get()
    const doc = snap.docs.find((d) => d.data()?.accessToken || d.data()?.refreshToken)
    if (!doc) return outcome.warn("No OAuth connection stored; using the SQUARE_ACCESS_TOKEN env fallback")
    const data = doc.data() as { expiresAt?: string; refreshToken?: string }
    if (!data.refreshToken) return outcome.fail("No refresh token stored. The connection will die when the access token expires.")
    if (!data.expiresAt) return outcome.ok("Connected (no expiry recorded)")
    const hours = Math.round((Date.parse(data.expiresAt) - Date.now()) / 3_600_000)
    if (hours < 0) return outcome.fail(`Access token expired ${-hours} h ago and wasn't refreshed`)
    return outcome.ok(`Access token valid for ${hours >= 48 ? `${Math.round(hours / 24)} days` : `${hours} h`}; refresh token present`, {
      tokenExpiresAt: data.expiresAt,
    })
  }, "square"),

  // What a customer sees: can a consultation actually be booked in the next 7 days?
  customCheck("consultation-slots", "Bookable consultation slots", async () => {
    const serviceVariationId = await getConsultationServiceVariationId()
    if (!serviceVariationId) return outcome.warn("No consultation service configured (Admin → Service Mapping)")
    const start = new Date(Date.now() + 60 * 60_000)
    const end = new Date(Date.now() + 7 * 86_400_000)
    const res = await searchSquareAvailability({ serviceVariationId, startAt: start.toISOString(), endAt: end.toISOString() })
    const slots = res.availabilities?.length ?? 0
    if (!slots) return outcome.warn("No bookable consultation slots in the next 7 days. Check staff availability in Square.")
    const next = res.availabilities?.[0]?.start_at
    return outcome.ok(`${slots} slot${slots === 1 ? "" : "s"} in the next 7 days${next ? `; next ${new Date(next).toISOString().slice(0, 16).replace("T", " ")} UTC` : ""}`)
  }, "square"),

  // Are consultation requests still coming in at the usual rate?
  customCheck("consultation-activity", "Consultation requests", async () => {
    const requests = getAdminDb().collectionGroup("consultations")
    const since = (days: number) => Timestamp.fromMillis(Date.now() - days * 86_400_000)
    const [last, week, month] = await Promise.all([
      requests.orderBy("createdAt", "desc").limit(1).get(),
      requests.where("createdAt", ">=", since(7)).orderBy("createdAt", "desc").count().get(),
      requests.where("createdAt", ">=", since(28)).orderBy("createdAt", "desc").count().get(),
    ])
    const lastAt = (last.docs[0]?.get("createdAt") as Timestamp | undefined)?.toDate() ?? null
    return activityOutcome({ what: "consultation requests", lastAt, count7d: week.data().count, count28d: month.data().count })
  }, "firebase"),

  customCheck("firestore", "Firestore", async () => {
    await getAdminDb().collection(SQUARE_TOKENS_COLLECTION).limit(1).get()
    return outcome.ok("Reads succeed")
  }, "firebase"),

  // Email: SMTP is used when configured, otherwise Resend (same order as lib/email.ts).
  customCheck("email", "Email sending", async () => {
    if (env("SMTP_HOST") && env("SMTP_USER") && env("SMTP_PASS")) {
      const port = Number(env("SMTP_PORT")) || 587
      const transport = nodemailer.createTransport({
        host: env("SMTP_HOST"), port, secure: env("SMTP_SECURE") === "true",
        auth: { user: env("SMTP_USER"), pass: env("SMTP_PASS") },
        connectionTimeout: 8_000, greetingTimeout: 8_000, socketTimeout: 8_000,
      })
      // Log in to the mailbox at most once an hour (failures are rechecked after 10 min) and reuse the result
      // in between, so the client's account doesn't see a sign-in every 5 minutes. Cached in Firestore
      // because serverless instances don't keep memory between calls.
      // Keyed by server + login, so a local run with other credentials never shares production's result.
      const cacheKey = createHash("sha256").update(`${env("SMTP_HOST")}|${env("SMTP_USER")}`).digest("hex").slice(0, 16)
      const cacheRef = getAdminDb().collection("system_health").doc(`smtp-${cacheKey}`)
      const cached = (await cacheRef.get()).data() as { checkedAt?: number; status?: "ok" | "fail"; message?: string } | undefined
      const maxAgeMs = cached?.status === "fail" ? 10 * 60_000 : 60 * 60_000
      if (cached?.checkedAt && cached.status && cached.message && Date.now() - cached.checkedAt < maxAgeMs) {
        const mins = Math.max(1, Math.round((Date.now() - cached.checkedAt) / 60_000))
        return outcome[cached.status](`${cached.message} (checked ${mins} min ago)`)
      }
      let result: { status: "ok" | "fail"; message: string }
      try {
        await transport.verify() // connects and logs in; sends nothing
        result = { status: "ok", message: `SMTP login works (${env("SMTP_HOST")})` }
      } catch (err) {
        const code = (err as { code?: string }).code
        result = {
          status: "fail",
          message: code === "EAUTH" ? "SMTP login rejected (password changed or app password revoked?)" : `SMTP connection failed (${code ?? "error"})`,
        }
      }
      await cacheRef.set({ ...result, checkedAt: Date.now() }).catch(() => {})
      return outcome[result.status](result.message)
    }
    if (env("RESEND_API_KEY")) {
      const res = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}` }, cache: "no-store" })
      if (res.ok) return outcome.ok("Resend key valid")
      const body = (await res.json().catch(() => ({}))) as { name?: string }
      if (body.name === "restricted_api_key") return outcome.ok("Resend key valid (send-only)")
      return outcome.fail(`Resend rejected the key (HTTP ${res.status})`)
    }
    return outcome.fail("No email provider configured: confirmation emails can't send")
  }, "gmail_smtp"),
]

export const GET = healthHandler(checks)
