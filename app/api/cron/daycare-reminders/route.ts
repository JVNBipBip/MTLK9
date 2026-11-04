import { NextResponse } from "next/server"
import { isAuthorizedCronRequest } from "@/lib/cron-auth"
import { getAdminDb } from "@/lib/firebase-admin"
import { sendDaycareReminders } from "@/lib/daycare-reminder-notification"

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
    const result = await sendDaycareReminders(getAdminDb())
    return NextResponse.json(
      { ok: true, ...result },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch (error) {
    console.error("[cron/daycare-reminders] reminders failed", error)
    return NextResponse.json({ error: "reminders_failed" }, { status: 500 })
  }
}
