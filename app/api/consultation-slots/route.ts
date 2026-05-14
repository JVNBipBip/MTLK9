import { NextResponse } from "next/server"
import { retrieveSquareTeamMember, searchSquareAvailability } from "@/lib/square"
import { getVisibleTrainerNamesForIntake, intakeRequiresNickOnlyConsultation } from "@/lib/consultation-routing"
import { getConsultationServiceVariationIds, getNickTeamMemberIdForConsultation } from "@/lib/square-service-config"
import { filterSlotsByFacilityRoomCapacity } from "@/lib/facility-room-capacity"

export const runtime = "nodejs"

// Team member IDs that should never be offered to customers in the
// public consultation booking flow, regardless of what Square returns.
const HIDDEN_CONSULTATION_TEAM_MEMBER_IDS = new Set<string>([
  "TM32wtl__BW48AwU", // Sam Di Q
])

type RawSlot = {
  slotKey: string
  startAt: string
  teamMemberId: string
  serviceVariationId: string
  durationMinutes?: number
}

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
          serviceVariationId,
          durationMinutes: slot.appointment_segments?.[0]?.duration_minutes,
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

type Intake = { issue: string; impact: string[]; followUps: Record<string, string> }

function dedupeSlotsByTimeAndTeam(slots: RawSlot[]) {
  const seen = new Set<string>()
  const unique: RawSlot[] = []
  for (const slot of slots) {
    const startMs = new Date(slot.startAt).getTime()
    const key = `${Number.isFinite(startMs) ? startMs : slot.startAt}|${slot.teamMemberId}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(slot)
  }
  return unique
}

function teamMemberMatchesTrainerName(teamMemberName: string | null | undefined, trainerName: string): boolean {
  return (teamMemberName || "").toLowerCase().includes(trainerName.toLowerCase())
}

async function respondWithConsultationSlots(
  intake: Intake,
  options?: { forceTeamMemberId?: string | null },
) {
  const serviceVariationIds = await getConsultationServiceVariationIds()
  if (serviceVariationIds.length === 0) {
    return NextResponse.json(
      { error: "Square consultation slots are not configured. Set in Admin → Service Mapping." },
      { status: 500 },
    )
  }

  const rawSlotsFromSquare = await filterSlotsByFacilityRoomCapacity(
    await loadRawConsultationSlots(serviceVariationIds),
  )
  const rawSlots = rawSlotsFromSquare.filter(
    (s) => !HIDDEN_CONSULTATION_TEAM_MEMBER_IDS.has(s.teamMemberId),
  )
  const teamIdsFromSquare = [...new Set(rawSlotsFromSquare.map((s) => s.teamMemberId))]
  console.log("[consultation-slots] Queried", serviceVariationIds.length, "evaluation types. Total slots:", rawSlotsFromSquare.length)
  console.log("[consultation-slots] Team member IDs from Square:", teamIdsFromSquare)
  if (rawSlotsFromSquare.length !== rawSlots.length) {
    console.log(
      "[consultation-slots] Hiding",
      rawSlotsFromSquare.length - rawSlots.length,
      "slot(s) from blocked team members:",
      [...HIDDEN_CONSULTATION_TEAM_MEMBER_IDS],
    )
  }

  const forceTeamMemberId = options?.forceTeamMemberId?.trim() || null
  const pool = forceTeamMemberId
    ? rawSlots.filter((s) => s.teamMemberId === forceTeamMemberId)
    : rawSlots

  const trainerNames = getVisibleTrainerNamesForIntake(intake)
  const nickRequired =
    !forceTeamMemberId && intakeRequiresNickOnlyConsultation(intake.issue, intake.impact, intake.followUps)
  const nickId = await getNickTeamMemberIdForConsultation()

  const uniqueTeamIds = [...new Set(pool.map((s) => s.teamMemberId))]
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

  const filtered = forceTeamMemberId
    ? pool
    : trainerNames.length === 0
      ? pool
      : pool.filter((slot) =>
          trainerNames.some((trainerName) => {
            if (trainerName === "Nick" && nickId && slot.teamMemberId === nickId) return true
            return teamMemberMatchesTrainerName(teamNames.get(slot.teamMemberId), trainerName)
          }),
        )
  const deduped = dedupeSlotsByTimeAndTeam(filtered)

  const slotsMessage =
    deduped.length === 0
      ? forceTeamMemberId
        ? "No assessment times are currently available with this trainer. Please contact us and we will help you schedule."
        : nickRequired
          ? "No assessment times are currently available with the trainer matched to your dog's needs. Please call or email us and we will help you schedule."
          : "No assessment times are currently available with the trainers matched to your answers. Please call or email us and we will help you schedule."
      : undefined

  const slots = deduped.map((slot) => ({
    slotKey: slot.slotKey,
    startAt: slot.startAt,
    teamMemberId: slot.teamMemberId,
    teamMemberName: teamNames.get(slot.teamMemberId) ?? null,
  }))

  const staffSummary = Object.fromEntries(
    [...new Set(slots.map((s) => s.teamMemberId))].map((id) => [id, teamNames.get(id) ?? "(unknown)"])
  )
  if (filtered.length !== deduped.length) {
    console.log("[consultation-slots] Deduped", filtered.length - deduped.length, "duplicate time/staff slot(s)")
  }
  console.log("[consultation-slots] Returning", slots.length, "slots. Staff in response:", staffSummary)

  return NextResponse.json({
    slots,
    recommendedTeamMemberId: null,
    nickRoutingActive: forceTeamMemberId ? false : nickRequired,
    forcedTrainerFilter: Boolean(forceTeamMemberId),
    slotsMessage: slotsMessage ?? null,
  })
}

function parseIntakeFromSearchParams(searchParams: URLSearchParams): Intake {
  const issue = searchParams.get("issue") ?? ""
  const impact = searchParams.getAll("impact").filter(Boolean)
  const followUps: Record<string, string> = {}
  for (const raw of searchParams.getAll("followUp")) {
    const [key, ...rest] = raw.split(":")
    const value = rest.join(":")
    if (key && value) followUps[key] = value
  }
  return { issue, impact, followUps }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const intake = parseIntakeFromSearchParams(searchParams)
  const forceTeamMemberId = searchParams.get("teamMemberId")?.trim() || null
  return respondWithConsultationSlots(intake, { forceTeamMemberId })
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
  const followUpsRaw = obj.followUps
  const followUps =
    followUpsRaw && typeof followUpsRaw === "object" && !Array.isArray(followUpsRaw)
      ? Object.fromEntries(
          Object.entries(followUpsRaw).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ),
        )
      : {}
  const tmRaw = obj.teamMemberId
  const forceTeamMemberId = typeof tmRaw === "string" ? tmRaw.trim() || null : null
  return respondWithConsultationSlots({ issue, impact, followUps }, { forceTeamMemberId })
}
