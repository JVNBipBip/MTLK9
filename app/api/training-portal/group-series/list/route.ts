import { NextResponse } from "next/server"
import { CLASS_SESSIONS_COLLECTION } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import { groupSessionsIntoSeriesList, releaseStaleGroupSeriesHolds, type SessionForSeries } from "@/lib/group-class-series"
import { migratedGroupProgramSlotOrder } from "@/lib/group-program-slots"
import { programLabel } from "@/lib/programs"
import { getCatalogVariationDisplayName } from "@/lib/square"
import {
  getGroupClassSeriesVariationId,
  getPrivateServiceVariationIds,
  getProgramServiceVariationId,
  getSquareServiceConfig,
} from "@/lib/square-service-config"
import { loadTrainingPortalContext } from "@/lib/training-portal"

export const runtime = "nodejs"

async function displayLabelForGroupProgram(
  classType: string,
  cache: Map<string, string>,
  groupSlotOrder: string[],
): Promise<string> {
  const hit = cache.get(classType)
  if (hit) return hit
  const fallback = programLabel(classType, groupSlotOrder).trim() || classType

  const seriesVid = await getGroupClassSeriesVariationId(classType, null)
  const programVid = await getProgramServiceVariationId(classType, null)

  for (const vid of [seriesVid, programVid]) {
    if (!vid?.trim()) continue
    const fromSquare = await getCatalogVariationDisplayName(vid)
    if (fromSquare) {
      cache.set(classType, fromSquare)
      return fromSquare
    }
  }

  cache.set(classType, fallback)
  return fallback
}

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

  const db = getAdminDb()
  await releaseStaleGroupSeriesHolds(db)

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
      series: [] as ReturnType<typeof groupSessionsIntoSeriesList>,
    })
  }

  const allowedClassTypes = new Set(portal.allowedGroupClassTypeIds)

  if (allowedClassTypes.size === 0) {
    return NextResponse.json({
      ok: true,
      eligible: false,
      blockedReason: "no_group_program_access",
      series: [],
    })
  }

  const sessionsSnap = await db.collection(CLASS_SESSIONS_COLLECTION).orderBy("startsAtIso", "asc").limit(400).get()
  const nowIso = new Date().toISOString()
  const raw: SessionForSeries[] = sessionsSnap.docs.map((doc) => {
    const d = doc.data() as Omit<SessionForSeries, "id">
    return { id: doc.id, ...d }
  })

  const squareCfg = await getSquareServiceConfig(null)
  const groupSlotOrder = migratedGroupProgramSlotOrder(squareCfg)
  const series = groupSessionsIntoSeriesList(raw, allowedClassTypes, nowIso, groupSlotOrder)
  const labelCache = new Map<string, string>()
  const seriesWithLabels = await Promise.all(
    series.map(async (row) => ({
      ...row,
      programLabel: await displayLabelForGroupProgram(row.classType, labelCache, groupSlotOrder),
    })),
  )

  return NextResponse.json({
    ok: true,
    eligible: true,
    blockedReason: null as string | null,
    series: seriesWithLabels,
    lookup: { clientEmail, dogName: portal.dogName },
  })
}
