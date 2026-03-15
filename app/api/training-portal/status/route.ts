import { NextResponse } from "next/server"
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
  if (!clientEmail || !dogName) {
    return NextResponse.json({ error: "clientEmail and dogName are required." }, { status: 400 })
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

  return NextResponse.json({
    ok: true,
    hasConsultation: Boolean(portal.latestConsultation),
    assessmentCompleted: portal.assessmentCompleted,
    latestConsultationStatus: portal.latestConsultation?.status || null,
    consultationId: portal.latestConsultation?.id || null,
    clientSummary: portal.latestConsultation
      ? {
          clientName: portal.latestConsultation.clientName || null,
          clientEmail: portal.latestConsultation.clientEmail || clientEmail,
          clientPhone: portal.latestConsultation.clientPhone || null,
          dogName: portal.latestConsultation.dogName || dogName,
          dogBreed: portal.latestConsultation.dogBreed || null,
          dogAge: portal.latestConsultation.dogAge || null,
          issue: portal.latestConsultation.issue || null,
        }
      : null,
    lookup: {
      clientEmail,
      dogName,
    },
    existingBookings: portal.upcomingBookings,
    privateUpcomingBookings: portal.upcomingBookings.filter((booking) => booking.type === "one_on_one"),
    activePrivatePackage: portal.activePrivatePackage,
    options: {
      oneOnOne: {
        eligible: portal.assessmentCompleted && !portal.packageSelectionRequired,
        hasUpcoming: portal.hasOneOnOneUpcoming,
        blockedReason: portal.packageSelectionRequired
          ? "private_package_required"
          : portal.activePrivatePackage && portal.activePrivatePackage.sessionsRemaining <= 0
            ? "private_package_exhausted"
            : null,
        sessionsRemaining: portal.activePrivatePackage?.sessionsRemaining ?? 0,
      },
    },
  })
}
