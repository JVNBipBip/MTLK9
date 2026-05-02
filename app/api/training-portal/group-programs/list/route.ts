import { NextResponse } from "next/server"
import { groupClassProgramOptionsFromSessions } from "@/lib/group-class-programs"
import { programLabel } from "@/lib/programs"
import { getPrivateServiceVariationIds } from "@/lib/square-service-config"
import { loadTrainingPortalContext } from "@/lib/training-portal"

export const runtime = "nodejs"

type Payload = {
  clientEmail?: string
  dogName?: string
}

export async function POST(request: Request) {
  let payload: Payload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const clientEmail = String(payload.clientEmail || "").trim().toLowerCase()
  const dogName = String(payload.dogName || "").trim()
  if (!clientEmail) {
    return NextResponse.json({ error: "clientEmail is required." }, { status: 400 })
  }

  const oneOnOneServiceVariationIds = await getPrivateServiceVariationIds()
  if (oneOnOneServiceVariationIds.length === 0) {
    return NextResponse.json({ error: "Missing one-on-one Square mapping configuration." }, { status: 500 })
  }

  const portal = await loadTrainingPortalContext({
    clientEmail,
    dogName,
    oneOnOneServiceVariationIds,
  })

  if (!portal.assessmentCompleted) {
    return NextResponse.json({
      ok: true,
      eligible: false,
      blockedReason: "assessment_required",
      programs: [],
    })
  }

  if (portal.allowedGroupClassTypeIds.length === 0) {
    return NextResponse.json({
      ok: true,
      eligible: false,
      blockedReason: "no_group_program_access",
      programs: [],
    })
  }

  const options = await groupClassProgramOptionsFromSessions(portal.allowedGroupClassTypeIds)
  const labelById = new Map(options.map((option) => [option.id, option.label]))
  const programs = portal.allowedGroupClassTypeIds.map((programId) => ({
    programId,
    programLabel: labelById.get(programId) || programLabel(programId),
    squareUrl: null,
  }))

  return NextResponse.json({
    ok: true,
    eligible: true,
    blockedReason: null,
    programs,
    lookup: { clientEmail, dogName: portal.dogName },
  })
}
