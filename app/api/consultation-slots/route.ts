import { NextResponse } from "next/server"
import { retrieveSquareTeamMember, searchSquareAvailability } from "@/lib/square"
import { intakeRequiresNickOnlyConsultation } from "@/lib/consultation-routing"
import { getConsultationServiceVariationIds, getNickTeamMemberIdForConsultation } from "@/lib/square-service-config"

export const runtime = "nodejs"

type RawSlot = { slotKey: string; startAt: string; teamMemberId: string }

function minLeadMinutes() {
  const raw = Number.parseInt(process.env.SQUARE_CONSULTATION_MIN_LEAD_MINUTES || "", 10)
  if (Number.isNaN(raw) || raw < 0) return 120
  return raw
}

async function loadRawConsultationSlots(serviceVariationIds: string[]): Promise<RawSlot[]> {
  const startAt = new Date().toISOString()
  const endAt = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
  const minStartMs = Date.now() + minLeadMinutes() * 60 * 1000

  const rawSlots: RawSlot[] = []
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

  return rawSlots
}

type Intake = { issue: string; impact: string[] }

async function respondWithConsultationSlots(intake: Intake) {
  const serviceVariationIds = await getConsultationServiceVariationIds()
  if (serviceVariationIds.length === 0) {
    return NextResponse.json(
      { error: "Square consultation slots are not configured. Set in Admin → Service Mapping." },
      { status: 500 },
    )
  }

  const rawSlots = await loadRawConsultationSlots(serviceVariationIds)
  const teamIdsFromSquare = [...new Set(rawSlots.map((s) => s.teamMemberId))]
  console.log("[consultation-slots] Queried", serviceVariationIds.length, "evaluation types. Total slots:", rawSlots.length)
  console.log("[consultation-slots] Team member IDs from Square:", teamIdsFromSquare)

  const nickRequired = intakeRequiresNickOnlyConsultation(intake.issue, intake.impact)
  const nickId = await getNickTeamMemberIdForConsultation()

  if (nickRequired && !nickId) {
    return NextResponse.json(
      {
        error:
          "High-risk consultations require a specialist calendar. In Admin → Service Mapping, choose the high-risk consultation staff member (or set SQUARE_NICK_TEAM_MEMBER_ID on the server).",
        slots: [],
        nickRoutingActive: true,
      },
      { status: 503 },
    )
  }

  let filtered = nickRequired && nickId ? rawSlots.filter((s) => s.teamMemberId === nickId) : rawSlots

  const slotsMessage =
    nickRequired && filtered.length === 0
      ? "No assessment times are currently available with our specialist for dogs with safety-related concerns. Please call or email us and we will help you schedule."
      : undefined

  const uniqueTeamIds = [...new Set(filtered.map((s) => s.teamMemberId))]
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

  const slots = filtered.map((slot) => ({
    slotKey: slot.slotKey,
    startAt: slot.startAt,
    teamMemberId: slot.teamMemberId,
    teamMemberName: teamNames.get(slot.teamMemberId) ?? null,
  }))

  const staffSummary = Object.fromEntries(
    [...new Set(slots.map((s) => s.teamMemberId))].map((id) => [id, teamNames.get(id) ?? "(unknown)"])
  )
  console.log("[consultation-slots] Returning", slots.length, "slots. Staff in response:", staffSummary)

  return NextResponse.json({
    slots,
    recommendedTeamMemberId: nickRequired ? null : nickId,
    nickRoutingActive: nickRequired,
    slotsMessage: slotsMessage ?? null,
  })
}

function parseIntakeFromSearchParams(searchParams: URLSearchParams): Intake {
  const issue = searchParams.get("issue") ?? ""
  const impact = searchParams.getAll("impact").filter(Boolean)
  return { issue, impact }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  return respondWithConsultationSlots(parseIntakeFromSearchParams(searchParams))
}

export async function POST(request: Request) {
  let body: unknown = null
  try {
    body = await request.json()
  } catch {
    body = null
  }
  const obj = body && typeof body === "object" ? (body as Record<string, unknown>) : {}
  const issue = typeof obj.issue === "string" ? obj.issue : ""
  const impactRaw = obj.impact
  const impact = Array.isArray(impactRaw)
    ? impactRaw.filter((x): x is string => typeof x === "string")
    : []
  return respondWithConsultationSlots({ issue, impact })
}
