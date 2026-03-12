import { NextResponse } from "next/server"
import { searchSquareAvailability } from "@/lib/square"

export const runtime = "nodejs"

function minLeadMinutes() {
  const raw = Number.parseInt(process.env.SQUARE_CONSULTATION_MIN_LEAD_MINUTES || "", 10)
  if (Number.isNaN(raw) || raw < 0) return 120
  return raw
}

export async function GET() {
  const serviceVariationId = process.env.SQUARE_CONSULTATION_SERVICE_VARIATION_ID
  if (!serviceVariationId) {
    return NextResponse.json(
      { error: "Square consultation slots are not configured. Set SQUARE_CONSULTATION_SERVICE_VARIATION_ID." },
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

  const slots = (availability.availabilities || [])
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
    .map((slot) => ({
      slotKey: slot.slotKey,
      startAt: slot.startAt,
      teamMemberId: slot.teamMemberId,
    }))

  return NextResponse.json({ slots })
}

