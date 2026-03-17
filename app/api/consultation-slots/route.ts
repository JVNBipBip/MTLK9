import { NextResponse } from "next/server"
import { retrieveSquareTeamMember, searchSquareAvailability } from "@/lib/square"
import { getConsultationServiceVariationIds } from "@/lib/square-service-config"

export const runtime = "nodejs"

function minLeadMinutes() {
  const raw = Number.parseInt(process.env.SQUARE_CONSULTATION_MIN_LEAD_MINUTES || "", 10)
  if (Number.isNaN(raw) || raw < 0) return 120
  return raw
}

export async function GET() {
  const serviceVariationIds = await getConsultationServiceVariationIds()
  if (serviceVariationIds.length === 0) {
    return NextResponse.json(
      { error: "Square consultation slots are not configured. Set in Admin → Service Mapping." },
      { status: 500 },
    )
  }

  const startAt = new Date().toISOString()
  const endAt = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
  const minStartMs = Date.now() + minLeadMinutes() * 60 * 1000

  const rawSlots: { slotKey: string; startAt: string; teamMemberId: string }[] = []
  const skippedServices: string[] = []

  for (const serviceVariationId of serviceVariationIds) {
    try {
      const availability = await searchSquareAvailability({ serviceVariationId, startAt, endAt })
      const rawFromSquare = availability.availabilities || []
      for (const slot of rawFromSquare) {
        const startAtValue = slot.start_at || ""
        const teamMemberId = slot.appointment_segments?.[0]?.team_member_id || ""
        if (!startAtValue || !teamMemberId) continue
        const startMs = new Date(startAtValue).getTime()
        if (Number.isNaN(startMs) || startMs < minStartMs) continue
        rawSlots.push({
          slotKey: `${startAtValue}|${serviceVariationId}|${teamMemberId}`,
          startAt: startAtValue,
          teamMemberId,
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes("not bookable") || msg.includes("Service variation")) {
        skippedServices.push(serviceVariationId)
        console.warn("[consultation-slots] Skipping service (not bookable in Square):", serviceVariationId)
      } else {
        throw err
      }
    }
  }
  rawSlots.sort((a, b) => a.startAt.localeCompare(b.startAt))

  if (skippedServices.length > 0) {
    console.log("[consultation-slots] Skipped", skippedServices.length, "services (not bookable):", skippedServices)
  }

  const teamIdsFromSquare = [...new Set(rawSlots.map((s) => s.teamMemberId))]
  console.log("[consultation-slots] Queried", serviceVariationIds.length, "evaluation types. Total slots:", rawSlots.length)
  console.log("[consultation-slots] Team member IDs from Square:", teamIdsFromSquare)

  const uniqueTeamIds = [...new Set(rawSlots.map((s) => s.teamMemberId))]
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

  const slots = rawSlots.map((slot) => ({
    slotKey: slot.slotKey,
    startAt: slot.startAt,
    teamMemberId: slot.teamMemberId,
    teamMemberName: teamNames.get(slot.teamMemberId) ?? null,
  }))

  const staffSummary = Object.fromEntries(
    [...new Set(slots.map((s) => s.teamMemberId))].map((id) => [id, teamNames.get(id) ?? "(unknown)"])
  )
  console.log("[consultation-slots] Returning", slots.length, "slots. Staff in response:", staffSummary)

  return NextResponse.json({ slots })
}

