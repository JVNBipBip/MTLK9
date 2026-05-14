import { NextResponse } from "next/server"
import { CLASS_SESSIONS_COLLECTION } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import { groupSessionsIntoSeriesList, releaseStaleGroupSeriesHolds, type SessionForSeries } from "@/lib/group-class-series"
import { programLabel } from "@/lib/programs"
import { getPrivateServiceVariationIds } from "@/lib/square-service-config"
import { loadTrainingPortalContext } from "@/lib/training-portal"
import { PUPPY_SOCIALIZATION_CLASS_TYPE_ID } from "@/lib/puppy-social-drop-in"

export const runtime = "nodejs"

type Payload = {
  clientEmail?: string
  dogName?: string
  /** When true, skip assessment and list only puppy socialization cohorts (drop-in path). */
  dropInPuppySocialization?: boolean
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

  const dropIn = Boolean(payload.dropInPuppySocialization)

  let allowedClassTypes: Set<string>
  let eligible: boolean
  let blockedReason: string | null

  if (dropIn) {
    allowedClassTypes = new Set([PUPPY_SOCIALIZATION_CLASS_TYPE_ID])
    eligible = true
    blockedReason = null
  } else {
    if (!portal.assessmentCompleted) {
      return NextResponse.json({
        ok: true,
        eligible: false,
        blockedReason: "assessment_required",
        series: [] as ReturnType<typeof groupSessionsIntoSeriesList>,
      })
    }

    allowedClassTypes = new Set(portal.allowedGroupClassTypeIds)

    if (allowedClassTypes.size === 0) {
      return NextResponse.json({
        ok: true,
        eligible: false,
        blockedReason: "no_group_program_access",
        series: [],
      })
    }
    eligible = true
    blockedReason = null
  }

  const sessionsSnap = await db.collection(CLASS_SESSIONS_COLLECTION).orderBy("startsAtIso", "asc").limit(400).get()
  const nowIso = new Date().toISOString()
  const raw: SessionForSeries[] = sessionsSnap.docs.map((doc) => {
    const d = doc.data() as Omit<SessionForSeries, "id">
    return { id: doc.id, ...d }
  })

  const series = groupSessionsIntoSeriesList(raw, allowedClassTypes, nowIso)
  const seriesWithLabels = series.map((row) => ({
    ...row,
    programLabel: programLabel(row.classType),
  }))

  return NextResponse.json({
    ok: true,
    eligible,
    blockedReason,
    series: seriesWithLabels,
    lookup: { clientEmail, dogName: portal.dogName },
    dropInPuppySocialization: dropIn,
  })
}
