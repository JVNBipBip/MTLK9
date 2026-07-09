import { NextResponse } from "next/server"
import { isAppLocale, type AppLocale } from "@/lib/i18n/config"
import { captureServerEvent } from "@/lib/posthog-server"
import { buildWelcomeSignupTags } from "@/lib/welcome-flow"

export const runtime = "nodejs"

const GHL_BASE_URL = "https://services.leadconnectorhq.com"
const GHL_API_VERSION = "2021-07-28"
const OUTBOUND_TIMEOUT_MS = 8000

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_EMAIL_LENGTH = 254
const MAX_MESSAGE_LENGTH = 1000
const MAX_PATH_LENGTH = 300

type WelcomeSignupPayload = {
  email: string
  message: string | null
  variant: "a" | "b"
  locale: AppLocale
  path: string
}

function parsePayload(body: unknown): WelcomeSignupPayload | null {
  if (!body || typeof body !== "object") return null
  const obj = body as Record<string, unknown>

  const email = typeof obj.email === "string" ? obj.email.trim().toLowerCase() : ""
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) return null

  const variant = obj.variant === "a" || obj.variant === "b" ? obj.variant : null
  if (!variant) return null

  const locale = typeof obj.locale === "string" && isAppLocale(obj.locale) ? obj.locale : null
  if (!locale) return null

  const messageRaw = typeof obj.message === "string" ? obj.message.trim() : ""
  if (messageRaw.length > MAX_MESSAGE_LENGTH) return null

  const pathRaw = typeof obj.path === "string" ? obj.path.trim() : ""

  return {
    email,
    message: messageRaw || null,
    variant,
    locale,
    path: pathRaw.slice(0, MAX_PATH_LENGTH),
  }
}

/** POST to LeadConnector v2 with auth headers and an 8s abort timeout. */
async function ghlRequest(path: string, apiKey: string, body: unknown): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), OUTBOUND_TIMEOUT_MS)
  try {
    return await fetch(`${GHL_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: GHL_API_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

export async function POST(request: Request) {
  let body: unknown = null
  try {
    body = await request.json()
  } catch {
    body = null
  }

  const payload = parsePayload(body)
  if (!payload) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const apiKey = process.env.GHL_API_KEY
  const locationId = process.env.GHL_LOCATION_ID
  if (!apiKey || !locationId) {
    // Popup is feature-flagged dark until GHL is configured, so this is a
    // deploy-order guard, not an expected user-facing path.
    return NextResponse.json({ error: "not_configured" }, { status: 503 })
  }

  try {
    const upsertRes = await ghlRequest("/contacts/upsert", apiKey, {
      locationId,
      email: payload.email,
      tags: buildWelcomeSignupTags(payload),
      source: "website-popup",
      customFields: [],
    })

    if (!upsertRes.ok) {
      const text = await upsertRes.text().catch(() => "")
      console.error(`[welcome-signup] GHL upsert failed (${upsertRes.status}):`, text)
      return NextResponse.json({ error: "upstream" }, { status: 502 })
    }

    const data = (await upsertRes.json().catch(() => null)) as { contact?: { id?: string } } | null
    const contactId = data?.contact?.id || null

    // Variant A's optional message goes on the contact as a note. A note
    // failure must not fail the signup — the contact is already captured.
    if (payload.message) {
      if (!contactId) {
        console.warn("[welcome-signup] GHL upsert returned no contact id; skipping note")
      } else {
        try {
          const noteRes = await ghlRequest(`/contacts/${contactId}/notes`, apiKey, {
            body: `Website welcome popup (${payload.path || "unknown path"}):\n${payload.message}`,
          })
          if (!noteRes.ok) {
            const noteText = await noteRes.text().catch(() => "")
            console.error(`[welcome-signup] GHL note failed (${noteRes.status}):`, noteText)
          }
        } catch (noteErr) {
          console.error("[welcome-signup] GHL note request errored:", noteErr)
        }
      }
    }

    await captureServerEvent({
      distinctId: contactId || "welcome-popup-anonymous",
      event: "welcome_signup_received",
      properties: { variant: payload.variant, locale: payload.locale },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[welcome-signup] POST", err)
    return NextResponse.json({ error: "upstream" }, { status: 502 })
  }
}
