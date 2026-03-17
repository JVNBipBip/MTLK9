import { NextResponse } from "next/server"
import { CONSULTATIONS_COLLECTION, DOG_CLASS_ACCESS_COLLECTION } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import { getProgramServiceVariationId } from "@/lib/square-service-config"
import { hashAccessToken } from "@/lib/tokens"
import { retrieveSquareTeamMember, searchSquareAvailability } from "@/lib/square"

export const runtime = "nodejs"

export type ScheduleSlot = {
  slotKey: string
  startAt: string
  programId?: string
  programLabel: string
  teamMemberId?: string
  teamMemberName?: string | null
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

  const allowedClasses = await Promise.all(
    classAccessSnap.docs.map(async (d) => {
      const data = d.data() as { classTypeId?: string; classLabel?: string; squareServiceVariationId?: string }
      const classTypeId = data.classTypeId || ""
      const mappedVariationId = await getProgramServiceVariationId(classTypeId)
      return {
        classTypeId,
        classLabel: data.classLabel || classTypeId || "Class",
        squareServiceVariationId: data.squareServiceVariationId || mappedVariationId || "",
      }
    }),
  )
  if (allowedClasses.length === 0) {
    return NextResponse.json({ error: "No approved class types for this consultation." }, { status: 400 })
  }

  const now = new Date()
  const startAt = now.toISOString()
  const end = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000)
  const endAt = end.toISOString()
  const minStartMs = now.getTime() + minLeadMinutes() * 60 * 1000

  const slotMap = new Map<string, ScheduleSlot>()
  const teamIdsFromSquareByService = new Map<string, string[]>()
  for (const allowed of allowedClasses) {
    if (!allowed.squareServiceVariationId) continue
    try {
      const availability = await searchSquareAvailability({
        serviceVariationId: allowed.squareServiceVariationId,
        startAt,
        endAt,
      })
      const tmIds = [...new Set((availability.availabilities || []).map((i) => i.appointment_segments?.[0]?.team_member_id).filter(Boolean))] as string[]
      teamIdsFromSquareByService.set(allowed.classLabel, tmIds)
      for (const item of availability.availabilities || []) {
        const start = item.start_at || ""
        if (!start) continue
        const startMs = new Date(start).getTime()
        if (Number.isNaN(startMs) || startMs < minStartMs) continue
        const teamMemberId = item.appointment_segments?.[0]?.team_member_id || ""
        if (!teamMemberId) continue
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

  const rawSlots = Array.from(slotMap.values()).sort((a, b) => a.startAt.localeCompare(b.startAt))
  const uniqueTeamIds = [...new Set(rawSlots.map((s) => s.teamMemberId).filter(Boolean))] as string[]
  const teamNames = new Map<string, string | null>()
  await Promise.all(
    uniqueTeamIds.map(async (id) => {
      try {
        const name = await retrieveSquareTeamMember(id)
        teamNames.set(id, name ?? null)
      } catch {
        teamNames.set(id, null)
      }
    }),
  )
  const slots = rawSlots.map((s) => ({
    ...s,
    teamMemberName: s.teamMemberId ? teamNames.get(s.teamMemberId) ?? null : null,
  }))
  const staffSummary = Object.fromEntries(
    uniqueTeamIds.map((id) => [id, teamNames.get(id) ?? "(unknown)"])
  )
  console.log("[schedule-slots] Square team IDs by service:", Object.fromEntries(teamIdsFromSquareByService))
  console.log("[schedule-slots] Returning", slots.length, "slots. Staff in response:", staffSummary)

  return NextResponse.json({ slots })
}
