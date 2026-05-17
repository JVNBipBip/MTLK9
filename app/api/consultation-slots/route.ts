import { NextResponse } from "next/server"
import { retrieveSquareTeamMember, searchSquareAvailability } from "@/lib/square"
import {
  HIDDEN_PUBLIC_CONSULTATION_TEAM_MEMBER_IDS,
  isAllowedPublicConsultationTrainer,
} from "@/lib/consultation-public-team-members"
import { getVisibleTrainerNamesForIntake, intakeRequiresNickOnlyConsultation } from "@/lib/consultation-routing"
import { getConsultationServiceVariationIds, getNickTeamMemberIdForConsultation } from "@/lib/square-service-config"
import { filterSlotsByFacilityRoomCapacity } from "@/lib/facility-room-capacity"

export const runtime = "nodejs"

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Square Booking availability search rejects `start_at_range` spans over 32 days
 * ("Max query range is 32 days.").
 */
const SQUARE_AVAILABILITY_MAX_RANGE_DAYS = 32

/** Total calendar window: we query Square in {@link SQUARE_AVAILABILITY_MAX_RANGE_DAYS}-day chunks. */
const CONSULTATION_AVAILABILITY_LOOKAHEAD_DAYS = 42

function availabilitySearchWindows(totalDays: number): Array<{ startAt: string; endAt: string }> {
  const nowMs = Date.now()
  const absoluteEndMs = nowMs + totalDays * MS_PER_DAY
  const maxSpanMs = SQUARE_AVAILABILITY_MAX_RANGE_DAYS * MS_PER_DAY
  const windows: Array<{ startAt: string; endAt: string }> = []
  let cursor = nowMs
  while (cursor < absoluteEndMs) {
    const windowEndMs = Math.min(cursor + maxSpanMs, absoluteEndMs)
    windows.push({
      startAt: new Date(cursor).toISOString(),
      endAt: new Date(windowEndMs).toISOString(),
    })
    cursor = windowEndMs
  }
  return windows
}

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

function parseAvailabilitiesToSlots(
  rawFromSquare: NonNullable<
    Awaited<ReturnType<typeof searchSquareAvailability>>["availabilities"]
  >,
  serviceVariationId: string,
  minStartMs: number,
): RawSlot[] {
  const out: RawSlot[] = []
  for (const slot of rawFromSquare) {
    const startAtValue = slot.start_at || ""
    const teamMemberId = slot.appointment_segments?.[0]?.team_member_id || ""
    if (!startAtValue || !teamMemberId) continue
    const startMs = new Date(startAtValue).getTime()
    if (Number.isNaN(startMs) || startMs < minStartMs) continue
    out.push({
      slotKey: `${startAtValue}|${serviceVariationId}|${teamMemberId}`,
      startAt: startAtValue,
      teamMemberId,
      serviceVariationId,
      durationMinutes: slot.appointment_segments?.[0]?.duration_minutes,
    })
  }
  return out
}

async function loadRawConsultationSlots(
  serviceVariationIds: string[],
  options?: { augmentTeamMemberIds?: string[] },
): Promise<RawSlot[]> {
  const minStartMs = Date.now() + minLeadMinutes() * 60 * 1000
  const windows = availabilitySearchWindows(CONSULTATION_AVAILABILITY_LOOKAHEAD_DAYS)

  const rawSlots: RawSlot[] = []
  const skippedServices = new Set<string>()
  const seenSlotKeys = new Set<string>()
  let augmentAdded = 0

  const augmentIds = [...new Set((options?.augmentTeamMemberIds || []).map((id) => id.trim()).filter(Boolean))]

  for (const { startAt, endAt } of windows) {
    for (const serviceVariationId of serviceVariationIds) {
      try {
        const availability = await searchSquareAvailability({ serviceVariationId, startAt, endAt })
        for (const slot of parseAvailabilitiesToSlots(availability.availabilities || [], serviceVariationId, minStartMs)) {
          if (seenSlotKeys.has(slot.slotKey)) continue
          seenSlotKeys.add(slot.slotKey)
          rawSlots.push(slot)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes("not bookable") || msg.includes("Service variation")) {
          skippedServices.add(serviceVariationId)
          console.warn("[consultation-slots] Skipping service (not bookable in Square):", serviceVariationId)
        } else {
          throw err
        }
      }
    }

    /** Broad availability sometimes omits a staff member; per-team search can still return their segments. */
    if (augmentIds.length > 0) {
      for (const teamMemberId of augmentIds) {
        for (const serviceVariationId of serviceVariationIds) {
          try {
            const availability = await searchSquareAvailability({
              serviceVariationId,
              teamMemberId,
              startAt,
              endAt,
            })
            for (const slot of parseAvailabilitiesToSlots(
              availability.availabilities || [],
              serviceVariationId,
              minStartMs,
            )) {
              if (seenSlotKeys.has(slot.slotKey)) continue
              seenSlotKeys.add(slot.slotKey)
              rawSlots.push(slot)
              augmentAdded++
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            if (msg.includes("not bookable") || msg.includes("Service variation")) {
              console.warn(
                "[consultation-slots] Augment skip (not bookable in Square):",
                serviceVariationId,
                "teamMemberId:",
                teamMemberId,
              )
            } else {
              throw err
            }
          }
        }
      }
    }
  }

  rawSlots.sort((a, b) => a.startAt.localeCompare(b.startAt))

  if (augmentAdded > 0) {
    console.log(
      "[consultation-slots] Augmented",
      augmentAdded,
      "slot(s) via explicit team_member availability for:",
      augmentIds.join(", "),
    )
  }
  if (skippedServices.size > 0) {
    console.log(
      "[consultation-slots] Skipped",
      skippedServices.size,
      "services (not bookable):",
      [...skippedServices],
    )
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
  options?: { forceTeamMemberId?: string | null; allowTeamMemberIds?: string[] | null },
) {
  const serviceVariationIds = await getConsultationServiceVariationIds()
  if (serviceVariationIds.length === 0) {
    return NextResponse.json(
      { error: "Square consultation slots are not configured. Set in Admin → Service Mapping." },
      { status: 500 },
    )
  }

  const forceTeamMemberId = options?.forceTeamMemberId?.trim() || null
  const allowTeamMemberIds = (options?.allowTeamMemberIds || [])
    .map((id) => id.trim())
    .filter(Boolean)
  const allowSet = new Set(allowTeamMemberIds)
  const restrictedByStaffChoice = Boolean(forceTeamMemberId || allowSet.size > 0)

  const trainerNames = getVisibleTrainerNamesForIntake(intake)
  const nickId = await getNickTeamMemberIdForConsultation()

  if (intake.issue === "aggression-safety" && !nickId) {
    console.warn(
      "[consultation-slots] aggression-safety intake but Nick team member id is unset (Firestore highRiskConsultationTeamMemberId or SQUARE_NICK_TEAM_MEMBER_ID).",
    )
  }

  /** Broad Square search often omits bookable segments for configured Nick id; per-staff query merges them in. */
  let augmentTeamMemberIds: string[] | undefined
  if (nickId && trainerNames.includes("Nick")) {
    if (!restrictedByStaffChoice) {
      augmentTeamMemberIds = [nickId]
    } else if (forceTeamMemberId === nickId || allowSet.has(nickId)) {
      augmentTeamMemberIds = [nickId]
    }
  }

  const rawSlotsFromSquare = await filterSlotsByFacilityRoomCapacity(
    await loadRawConsultationSlots(serviceVariationIds, { augmentTeamMemberIds }),
  )
  const rawSlots = rawSlotsFromSquare.filter(
    (s) => !HIDDEN_PUBLIC_CONSULTATION_TEAM_MEMBER_IDS.has(s.teamMemberId),
  )
  const teamIdsFromSquare = [...new Set(rawSlotsFromSquare.map((s) => s.teamMemberId))]
  console.log("[consultation-slots] Queried", serviceVariationIds.length, "evaluation types. Total slots:", rawSlotsFromSquare.length)
  console.log("[consultation-slots] Team member IDs from Square:", teamIdsFromSquare)
  if (rawSlotsFromSquare.length !== rawSlots.length) {
    console.log(
      "[consultation-slots] Hiding",
      rawSlotsFromSquare.length - rawSlots.length,
      "slot(s) from blocked team members:",
      [...HIDDEN_PUBLIC_CONSULTATION_TEAM_MEMBER_IDS],
    )
  }

  let pool: typeof rawSlots
  if (allowSet.size > 0) {
    pool = rawSlots.filter((s) => allowSet.has(s.teamMemberId))
    if (pool.length === 0) {
      const staffSlots = [...new Set(rawSlots.map((s) => s.teamMemberId))]
      console.warn(
        "[consultation-slots] No slots after staff allow-filter. Allowed IDs:",
        [...allowSet],
        "IDs with openings after hidden-staff removal:",
        staffSlots,
      )
    }
  } else if (forceTeamMemberId) {
    pool = rawSlots.filter((s) => s.teamMemberId === forceTeamMemberId)
  } else {
    pool = rawSlots
  }

  const nickRequired =
    !restrictedByStaffChoice && intakeRequiresNickOnlyConsultation(intake.issue, intake.impact, intake.followUps)

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

  /** Staff-pin / inquiry resume already chose Square team ids — don't second-guess with the public "Mia/Tyson/Nick" name gate. */
  const publicTrainerPool = restrictedByStaffChoice
    ? pool
    : pool.filter((slot) =>
        isAllowedPublicConsultationTrainer(slot.teamMemberId, teamNames.get(slot.teamMemberId), nickId),
      )

  /** Pinned/resume staff skips name routing except aggression-safety, which must stay Nick-only. */
  const applyIntakeTrainerFilter =
    trainerNames.length > 0 && (!restrictedByStaffChoice || intake.issue === "aggression-safety")

  const filtered = applyIntakeTrainerFilter
    ? publicTrainerPool.filter((slot) =>
        trainerNames.some((trainerName) => {
          if (trainerName === "Nick" && nickId && slot.teamMemberId === nickId) return true
          return teamMemberMatchesTrainerName(teamNames.get(slot.teamMemberId), trainerName)
        }),
      )
    : publicTrainerPool
  const deduped = dedupeSlotsByTimeAndTeam(filtered)

  const slotsMessage =
    deduped.length === 0
      ? restrictedByStaffChoice
        ? allowSet.size > 1
          ? "No assessment times are currently available with these trainers. Please contact us and we will help you schedule."
          : "No assessment times are currently available with this trainer. Please contact us and we will help you schedule."
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
    nickRoutingActive: restrictedByStaffChoice ? false : nickRequired,
    forcedTrainerFilter: restrictedByStaffChoice,
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

function consultationSlotsErrorResponse(message: string, status = 500) {
  return NextResponse.json(
    {
      error: message,
      slots: [],
      recommendedTeamMemberId: null,
      nickRoutingActive: false,
      forcedTrainerFilter: false,
      slotsMessage: null,
    },
    { status },
  )
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const intake = parseIntakeFromSearchParams(searchParams)
    const forceTeamMemberId = searchParams.get("teamMemberId")?.trim() || null
    const allowTeamMemberIds = searchParams.getAll("allowTeamMemberId").map((s) => s.trim()).filter(Boolean)
    return await respondWithConsultationSlots(intake, {
      forceTeamMemberId,
      allowTeamMemberIds: allowTeamMemberIds.length ? allowTeamMemberIds : null,
    })
  } catch (err) {
    console.error("[consultation-slots] GET", err)
    const msg = err instanceof Error ? err.message : "Could not load consultation times."
    return consultationSlotsErrorResponse(msg)
  }
}

export async function POST(request: Request) {
  let body: unknown = null
  try {
    body = await request.json()
  } catch {
    body = null
  }
  try {
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
    const allowRaw = obj.allowTeamMemberIds
    const allowTeamMemberIds = Array.isArray(allowRaw)
      ? allowRaw.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean)
      : []
    return await respondWithConsultationSlots(
      { issue, impact, followUps },
      {
        forceTeamMemberId,
        allowTeamMemberIds: allowTeamMemberIds.length ? [...new Set(allowTeamMemberIds)] : null,
      },
    )
  } catch (err) {
    console.error("[consultation-slots] POST", err)
    const msg = err instanceof Error ? err.message : "Could not load consultation times."
    return consultationSlotsErrorResponse(msg)
  }
}
