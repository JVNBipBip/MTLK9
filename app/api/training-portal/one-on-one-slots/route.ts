import { NextResponse } from "next/server"
import { getPrivateServiceVariationId, getPrivateServiceVariationIds } from "@/lib/square-service-config"
import { retrieveSquareTeamMember, searchSquareAvailability } from "@/lib/square"
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
}

function minLeadMinutes() {
  const raw = Number.parseInt(process.env.SQUARE_ONE_ON_ONE_MIN_LEAD_MINUTES || "", 10)
  if (Number.isNaN(raw) || raw < 0) return 60
  return raw
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

    const serviceVariationId = await getPrivateServiceVariationId({
      serviceType: portal.activePrivatePackage.serviceType,
      planType: portal.activePrivatePackage.planType,
    })
    if (!serviceVariationId) {
      return NextResponse.json({ error: "Selected private package is not mapped to a Square service variation." }, { status: 500 })
    }

    const now = new Date()
    const minStartMs = now.getTime() + minLeadMinutes() * 60 * 1000
    const slotMap = new Map<string, OneOnOneSlot>()

    const DAY_MS = 24 * 60 * 60 * 1000
    const WINDOW_DAYS = 31

    const availabilityPromises = [0, 1, 2].map((i) => {
      const windowStart = new Date(now.getTime() + i * WINDOW_DAYS * DAY_MS)
      const windowEnd = new Date(now.getTime() + (i + 1) * WINDOW_DAYS * DAY_MS)
      return searchSquareAvailability({
        serviceVariationId,
        startAt: windowStart.toISOString(),
        endAt: windowEnd.toISOString(),
      })
    })

    const availabilityResults = await Promise.all(availabilityPromises)

    for (const availability of availabilityResults) {
      for (const item of availability.availabilities || []) {
        const start = item.start_at || ""
        if (!start) continue
        const startMs = new Date(start).getTime()
        if (Number.isNaN(startMs) || startMs < minStartMs) continue
        const teamMemberId = item.appointment_segments?.[0]?.team_member_id || ""
        if (!teamMemberId) continue
        const slotKey = `${start}|${ONE_ON_ONE_PROGRAM_ID}|${teamMemberId}|${serviceVariationId}`
        slotMap.set(slotKey, {
          slotKey,
          startAt: start,
          programId: ONE_ON_ONE_PROGRAM_ID,
          programLabel: "1-on-1 Training",
          teamMemberId,
          serviceVariationId,
        })
      }
    }

    const slots = Array.from(slotMap.values()).sort((a, b) => a.startAt.localeCompare(b.startAt))
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
    return NextResponse.json({
      ok: true,
      package: portal.activePrivatePackage,
      slots: slotsWithNames,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load available times."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
