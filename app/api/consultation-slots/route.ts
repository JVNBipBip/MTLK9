import { NextResponse } from "next/server"
import { retrieveSquareTeamMember, searchSquareAvailability } from "@/lib/square"
import { getConsultationServiceVariationId } from "@/lib/square-service-config"

export const runtime = "nodejs"

function minLeadMinutes() {
  const raw = Number.parseInt(process.env.SQUARE_CONSULTATION_MIN_LEAD_MINUTES || "", 10)
  if (Number.isNaN(raw) || raw < 0) return 120
  return raw
}

export async function GET() {
  const serviceVariationId = await getConsultationServiceVariationId()
  if (!serviceVariationId) {
    return NextResponse.json(
      { error: "Square consultation slots are not configured. Set in Admin → Service Mapping." },
      { status: 500 },
    )
  }

  const startAt = new Date().toISOString()
  const endAt = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
  const minStartMs = Date.now() + minLeadMinutes() * 60 * 1000
  const availability = await searchSquareAvailability({
    serviceVariationId,
    startAt,
    endAt,
  })

  const rawSlots = (availability.availabilities || [])
    .map((slot) => {
      const startAtValue = slot.start_at || ""
      const teamMemberId = slot.appointment_segments?.[0]?.team_member_id || ""
      if (!startAtValue || !teamMemberId) return null
      const startMs = new Date(startAtValue).getTime()
      if (Number.isNaN(startMs) || startMs < minStartMs) return null
      return {
        slotKey: `${startAtValue}|${serviceVariationId}|${teamMemberId}`,
        startAt: startAtValue,
        teamMemberId,
      }
    })
    .filter((value): value is { slotKey: string; startAt: string; teamMemberId: string } => Boolean(value))
    .sort((a, b) => a.startAt.localeCompare(b.startAt))

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

  return NextResponse.json({ slots })
}

