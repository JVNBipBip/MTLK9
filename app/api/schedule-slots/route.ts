import { NextResponse } from "next/server"
import { CONSULTATIONS_COLLECTION, DOG_CLASS_ACCESS_COLLECTION } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import { resolveProgramSquareServiceVariationId } from "@/lib/programs"
import { hashAccessToken } from "@/lib/tokens"
import { searchSquareAvailability } from "@/lib/square"

export const runtime = "nodejs"

export type ScheduleSlot = {
  slotKey: string
  startAt: string
  programId?: string
  programLabel: string
  teamMemberId?: string
  serviceVariationId?: string
}

function minLeadMinutes() {
  const raw = Number.parseInt(process.env.SQUARE_CLASS_MIN_LEAD_MINUTES || "", 10)
  if (Number.isNaN(raw) || raw < 0) return 60
  return raw
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")?.trim()
  if (!token) {
    return NextResponse.json({ error: "Token required." }, { status: 400 })
  }

  const tokenHash = hashAccessToken(token)
  const db = getAdminDb()
  const consultationSnap = await db
    .collection(CONSULTATIONS_COLLECTION)
    .where("bookingAccess.tokenHash", "==", tokenHash)
    .limit(1)
    .get()

  if (consultationSnap.empty) {
    return NextResponse.json({ error: "Invalid or expired booking link." }, { status: 404 })
  }

  const doc = consultationSnap.docs[0]
  const consultation = doc.data() as {
    status?: string
    bookingAccess?: { expiresAtIso?: string; revokedAtIso?: string }
    clientId?: string
    clientEmail?: string
    dogName?: string
  }

  const expiresAt = consultation.bookingAccess?.expiresAtIso ? new Date(consultation.bookingAccess.expiresAtIso).getTime() : 0
  if (
    consultation.bookingAccess?.revokedAtIso ||
    !expiresAt ||
    expiresAt < Date.now() ||
    consultation.status !== "completed"
  ) {
    return NextResponse.json({ error: "This booking link is no longer available." }, { status: 410 })
  }

  const clientId = String(consultation.clientId || consultation.clientEmail || "").trim().toLowerCase()
  const dogName = String(consultation.dogName || "")
  const classAccessSnap = await db
    .collection(DOG_CLASS_ACCESS_COLLECTION)
    .where("clientId", "==", clientId)
    .where("dogName", "==", dogName)
    .where("status", "==", "allowed")
    .get()

  const allowedClasses = classAccessSnap.docs.map((d) => {
    const data = d.data() as { classTypeId?: string; classLabel?: string; squareServiceVariationId?: string }
    const classTypeId = data.classTypeId || ""
    const mappedVariationId = resolveProgramSquareServiceVariationId(classTypeId)
    return {
      classTypeId,
      classLabel: data.classLabel || classTypeId || "Class",
      squareServiceVariationId: data.squareServiceVariationId || mappedVariationId || "",
    }
  })
  if (allowedClasses.length === 0) {
    return NextResponse.json({ error: "No approved class types for this consultation." }, { status: 400 })
  }

  const teamMemberId = process.env.SQUARE_DEFAULT_TEAM_MEMBER_ID
  if (!teamMemberId) {
    return NextResponse.json({ error: "Missing SQUARE_DEFAULT_TEAM_MEMBER_ID." }, { status: 500 })
  }

  const now = new Date()
  const startAt = now.toISOString()
  const end = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000)
  const endAt = end.toISOString()
  const minStartMs = now.getTime() + minLeadMinutes() * 60 * 1000

  const slotMap = new Map<string, ScheduleSlot>()
  for (const allowed of allowedClasses) {
    if (!allowed.squareServiceVariationId) continue
    try {
      const availability = await searchSquareAvailability({
        serviceVariationId: allowed.squareServiceVariationId,
        teamMemberId,
        startAt,
        endAt,
      })
      for (const item of availability.availabilities || []) {
        const start = item.start_at || ""
        if (!start) continue
        const startMs = new Date(start).getTime()
        if (Number.isNaN(startMs) || startMs < minStartMs) continue
        const slotKey = `${start}|${allowed.classTypeId}|${teamMemberId}|${allowed.squareServiceVariationId}`
        slotMap.set(slotKey, {
          slotKey,
          startAt: start,
          programId: allowed.classTypeId,
          programLabel: allowed.classLabel,
          teamMemberId,
          serviceVariationId: allowed.squareServiceVariationId,
        })
      }
    } catch {
      // Keep other classes loading even if one availability call fails.
    }
  }

  const slots = Array.from(slotMap.values()).sort((a, b) => a.startAt.localeCompare(b.startAt))
  return NextResponse.json({ slots })
}
