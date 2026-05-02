import { NextResponse } from "next/server"
import { getPrivateServiceVariationId, getPrivateServiceVariationIds } from "@/lib/square-service-config"
import {
  listBookableTeamMemberIdsForLocation,
  retrieveSquareTeamMember,
  searchSquareAvailability,
} from "@/lib/square"
import { filterSlotsByFacilityRoomCapacity } from "@/lib/facility-room-capacity"
import { inHomeBookingAllowed, privateTrainingBookingAllowed } from "@/lib/client-booking-settings"
import { ONE_ON_ONE_PROGRAM_ID, loadTrainingPortalContext } from "@/lib/training-portal"

export const runtime = "nodejs"

type Payload = {
  clientEmail?: string
  dogName?: string
}

type OneOnOneSlot = {
  slotKey: string
  startAt: string
  programId: string
  programLabel: string
  teamMemberId: string
  teamMemberName?: string | null
  serviceVariationId: string
  durationMinutes?: number
}

function minLeadMinutes() {
  const raw = Number.parseInt(process.env.SQUARE_ONE_ON_ONE_MIN_LEAD_MINUTES || "", 10)
  if (Number.isNaN(raw) || raw < 0) return 60
  return raw
}

function isSquareServiceAssignmentMismatch(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes("Search did not find a team member who performs the selected service variation")
}

export async function POST(request: Request) {
  try {
    let payload: Payload
    try {
      payload = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
    }

    const clientEmail = String(payload.clientEmail || "").trim().toLowerCase()
    const dogName = String(payload.dogName || "").trim()
    if (!clientEmail || !dogName) {
      return NextResponse.json({ error: "clientEmail and dogName are required." }, { status: 400 })
    }

    const oneOnOneServiceVariationIds = await getPrivateServiceVariationIds()
    if (oneOnOneServiceVariationIds.length === 0) {
      return NextResponse.json({ error: "Missing private training Square mapping configuration." }, { status: 500 })
    }

    const portal = await loadTrainingPortalContext({
      clientEmail,
      dogName,
      oneOnOneServiceVariationIds,
    })
    if (!portal.assessmentCompleted) {
      return NextResponse.json({ error: "Assessment must be completed before booking training." }, { status: 403 })
    }
    if (!privateTrainingBookingAllowed(portal.privateTrainingAccess)) {
      return NextResponse.json(
        { error: "Private training is not enabled for your account.", code: "private_training_blocked" },
        { status: 403 },
      )
    }
    if (!portal.activePrivatePackage) {
      return NextResponse.json(
        {
          error: "Please select a private package before loading available slots.",
          code: "private_package_required",
        },
        { status: 409 },
      )
    }
    if (portal.activePrivatePackage.sessionsRemaining <= 0 || portal.activePrivatePackage.status !== "active") {
      return NextResponse.json(
        {
          error: "Your selected private package has no remaining sessions.",
          code: "private_package_exhausted",
        },
        { status: 409 },
      )
    }
    if (portal.activePrivatePackage.serviceType === "in_home" && !inHomeBookingAllowed(portal.privateLocationAccess)) {
      return NextResponse.json(
        {
          error: "In-home training is no longer enabled for your account. Please contact us or switch to in-facility packages.",
          code: "in_home_not_allowed",
        },
        { status: 403 },
      )
    }

    const serviceVariationId = await getPrivateServiceVariationId({
      serviceType: portal.activePrivatePackage.serviceType,
      planType: portal.activePrivatePackage.planType,
    })
    if (!serviceVariationId) {
      return NextResponse.json({ error: "Selected private package is not mapped to a Square service variation." }, { status: 500 })
    }
    const resolvedServiceVariationId = serviceVariationId

    const now = new Date()
    const minStartMs = now.getTime() + minLeadMinutes() * 60 * 1000
    const slotMap = new Map<string, OneOnOneSlot>()

    const DAY_MS = 24 * 60 * 60 * 1000
    const WINDOW_DAYS = 31

    let bookableTeamIds: string[] = []
    try {
      bookableTeamIds = await listBookableTeamMemberIdsForLocation()
      if (bookableTeamIds.length === 0) {
        console.warn(
          "[one-on-one-slots] Square returned no bookable team members for this location (check Team → Booking / Appointments in Square, or location_id). Using aggregate availability — often only one staff per slot.",
        )
      }
    } catch (err) {
      console.warn(
        "[one-on-one-slots] Could not list bookable team profiles (need APPOINTMENTS_BUSINESS_SETTINGS_READ); using aggregate availability only:",
        err,
      )
    }

    /**
     * Square's unfiltered availability search returns one team_member_id per slot; another trainer
     * can be chosen even when Jessica (etc.) is also free for that service. Query each bookable
     * staff member with team_member_id_filter and merge so the portal shows everyone's real openings.
     */
    async function fetchWindowsForTeam(teamMemberId: string | undefined) {
      return Promise.all(
        [0, 1, 2].map((i) => {
          const windowStart = new Date(now.getTime() + i * WINDOW_DAYS * DAY_MS)
          const windowEnd = new Date(now.getTime() + (i + 1) * WINDOW_DAYS * DAY_MS)
          return searchSquareAvailability({
            serviceVariationId: resolvedServiceVariationId,
            startAt: windowStart.toISOString(),
            endAt: windowEnd.toISOString(),
            ...(teamMemberId ? { teamMemberId } : {}),
          })
        }),
      )
    }

    let availabilityResults: Awaited<ReturnType<typeof searchSquareAvailability>>[]
    if (bookableTeamIds.length > 0) {
      const perStaff = await Promise.allSettled(bookableTeamIds.map((id) => fetchWindowsForTeam(id)))
      const unexpectedFailure = perStaff.find(
        (result) => result.status === "rejected" && !isSquareServiceAssignmentMismatch(result.reason),
      )
      if (unexpectedFailure?.status === "rejected") {
        throw unexpectedFailure.reason
      }

      perStaff.forEach((result, index) => {
        if (result.status === "rejected") {
          console.warn(
            "[one-on-one-slots] Skipping team member for service variation mismatch:",
            bookableTeamIds[index],
            resolvedServiceVariationId,
            result.reason,
          )
        }
      })

      const fulfilled = perStaff
        .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchWindowsForTeam>>> => result.status === "fulfilled")
        .map((result) => result.value)

      if (fulfilled.length > 0) {
        availabilityResults = fulfilled.flat()
      } else {
        console.warn(
          "[one-on-one-slots] All per-staff availability searches were skipped; falling back to aggregate availability for service variation:",
          resolvedServiceVariationId,
        )
        availabilityResults = await fetchWindowsForTeam(undefined)
      }
    } else {
      availabilityResults = await fetchWindowsForTeam(undefined)
    }

    for (const availability of availabilityResults) {
      for (const item of availability.availabilities || []) {
        const start = item.start_at || ""
        if (!start) continue
        const startMs = new Date(start).getTime()
        if (Number.isNaN(startMs) || startMs < minStartMs) continue
        const teamMemberId = item.appointment_segments?.[0]?.team_member_id || ""
        if (!teamMemberId) continue
        const slotKey = `${start}|${ONE_ON_ONE_PROGRAM_ID}|${teamMemberId}|${resolvedServiceVariationId}`
        slotMap.set(slotKey, {
          slotKey,
          startAt: start,
          programId: ONE_ON_ONE_PROGRAM_ID,
          programLabel: "1-on-1 Training",
          teamMemberId,
          serviceVariationId: resolvedServiceVariationId,
          durationMinutes: item.appointment_segments?.[0]?.duration_minutes,
        })
      }
    }

    const rawSlots = Array.from(slotMap.values()).sort((a, b) => a.startAt.localeCompare(b.startAt))
    const slots =
      portal.activePrivatePackage.serviceType === "in_facility"
        ? await filterSlotsByFacilityRoomCapacity(rawSlots)
        : rawSlots
    const uniqueTeamIds = [...new Set(slots.map((s) => s.teamMemberId))]
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
    const slotsWithNames = slots.map((s) => ({
      ...s,
      teamMemberName: teamNames.get(s.teamMemberId) ?? null,
    }))
    const staffSummary = Object.fromEntries(
      uniqueTeamIds.map((id) => [id, teamNames.get(id) ?? "(unknown)"])
    )
    console.log("[one-on-one-slots] Returning", slotsWithNames.length, "slots. Staff in response:", staffSummary)

    return NextResponse.json({
      ok: true,
      package: portal.activePrivatePackage,
      slots: slotsWithNames,
    })
  } catch (err) {
    console.error("[one-on-one-slots]", err)
    const message = err instanceof Error ? err.message : "Could not load available times."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
