import { NextResponse } from "next/server"
import { isAuthorizedCronRequest } from "@/lib/cron-auth"
import { createInquiryImpactSnapshot } from "@/lib/inquiry-impact"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: "cron_not_configured" }, { status: 503 })
  }

  if (!isAuthorizedCronRequest(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  try {
    const snapshot = await createInquiryImpactSnapshot()
    return NextResponse.json(
      { ok: true, snapshot },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch (error) {
    console.error("[cron/inquiry-impact] snapshot failed", error)
    return NextResponse.json({ error: "snapshot_failed" }, { status: 500 })
  }
}
