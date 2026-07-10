import { NextResponse } from "next/server"
import { captureServerEvent } from "@/lib/posthog-server"
import { buildWelcomeSignupTags } from "@/lib/welcome-flow"
import { parseWelcomeSignupPayload } from "@/lib/welcome-signup"

export const runtime = "nodejs"

const GHL_BASE_URL = "https://services.leadconnectorhq.com"
const GHL_API_VERSION = "2021-07-28"
const OUTBOUND_TIMEOUT_MS = 8000

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

  const payload = parseWelcomeSignupPayload(body)
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
    const signupTags = buildWelcomeSignupTags(payload)
    const upsertRes = await ghlRequest("/contacts/upsert", apiKey, {
      locationId,
      email: payload.email,
      ...(payload.phone ? { phone: payload.phone } : {}),
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
    if (!contactId) {
      console.error("[welcome-signup] GHL upsert returned no contact id")
      return NextResponse.json({ error: "upstream" }, { status: 502 })
    }

    // Upsert's `tags` field replaces the contact's existing tags. Use the
    // additive endpoint so an existing lead keeps all prior CRM segmentation.
    const tagRes = await ghlRequest(`/contacts/${contactId}/tags`, apiKey, { tags: signupTags })
    if (!tagRes.ok) {
      const tagText = await tagRes.text().catch(() => "")
      console.error(`[welcome-signup] GHL tag add failed (${tagRes.status}):`, tagText)
      return NextResponse.json({ error: "upstream" }, { status: 502 })
    }

    // Variant A's optional message goes on the contact as a note. A note
    // failure must not fail the signup — the contact is already captured.
    if (payload.message) {
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
