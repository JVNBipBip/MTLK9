import { NextResponse } from "next/server"
import { getCatalogVariationDisplayName } from "@/lib/square"
import { migratedGroupProgramSlotOrder } from "@/lib/group-program-slots"
import { programLabel } from "@/lib/programs"
import { getPrivateServiceVariationIds, getSquareServiceConfig, type SquareServiceConfig } from "@/lib/square-service-config"
import { loadTrainingPortalContext } from "@/lib/training-portal"

export const runtime = "nodejs"

type Payload = {
  clientEmail?: string
  dogName?: string
}

async function displayLabelForGroupProgram(
  programId: string,
  config: SquareServiceConfig,
  slotOrder: string[],
  cache: Map<string, string>,
): Promise<string> {
  const hit = cache.get(programId)
  if (hit) return hit

  const configuredLabel = config.groupProgramLabels?.[programId]?.trim()
  if (configuredLabel) {
    cache.set(programId, configuredLabel)
    return configuredLabel
  }

  for (const variationId of [config.groupClassSeriesVariations?.[programId], config.programs?.[programId]]) {
    const value = variationId?.trim()
    if (!value) continue
    const fromSquare = await getCatalogVariationDisplayName(value)
    if (fromSquare) {
      cache.set(programId, fromSquare)
      return fromSquare
    }
  }

  const fallback = programLabel(programId, slotOrder)
  cache.set(programId, fallback)
  return fallback
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

  const config = await getSquareServiceConfig(null)
  const slotOrder = migratedGroupProgramSlotOrder(config)
  const labelCache = new Map<string, string>()
  const programs = await Promise.all(
    portal.allowedGroupClassTypeIds.map(async (programId) => ({
      programId,
      programLabel: await displayLabelForGroupProgram(programId, config, slotOrder, labelCache),
      squareUrl: config.groupProgramSquareUrls?.[programId]?.trim() || null,
    })),
  )

  return NextResponse.json({
    ok: true,
    eligible: true,
    blockedReason: null,
    programs,
    lookup: { clientEmail, dogName: portal.dogName },
  })
}
