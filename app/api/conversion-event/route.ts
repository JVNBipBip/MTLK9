import { FieldValue } from "firebase-admin/firestore"
import { NextResponse } from "next/server"
import {
  CONVERSION_EVENTS_COLLECTION,
  parseConversionEventPayload,
} from "@/lib/conversion-event-schema"
import { getAdminDb } from "@/lib/firebase-admin"
import { heroCtaExperimentProperties, parseHeroCtaCookieHeader } from "@/lib/hero-cta-experiment"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const payload = parseConversionEventPayload(await request.json().catch(() => null))
  if (!payload) {
    return NextResponse.json({ error: "Invalid conversion event" }, { status: 400 })
  }

  try {
    await getAdminDb().collection(CONVERSION_EVENTS_COLLECTION).add({
      ...payload,
      ...heroCtaExperimentProperties(parseHeroCtaCookieHeader(request.headers.get("cookie"))),
      observedAtIso: new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ ok: true }, { status: 202 })
  } catch (error) {
    console.error("[conversion-event] write failed", error)
    return NextResponse.json({ error: "Could not record conversion event" }, { status: 500 })
  }
}
