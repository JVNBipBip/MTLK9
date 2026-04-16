import { NextResponse } from "next/server"
import { getPrivateServiceVariationIds } from "@/lib/square-service-config"
import { getSquareBookingSiteUrlForLocation } from "@/lib/square"
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
  let squareBookingSiteUrl: string | null = null
  try {
    squareBookingSiteUrl = await getSquareBookingSiteUrlForLocation()
  } catch {
    squareBookingSiteUrl = null
  }

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
          dogName: portal.latestConsultation.dogName || dogName || portal.dogName || null,
          dogBreed: portal.latestConsultation.dogBreed || null,
          dogAge: portal.latestConsultation.dogAge || null,
          issue: portal.latestConsultation.issue || null,
        }
      : null,
    lookup: {
      clientEmail,
      dogName: portal.dogName || dogName,
    },
    existingBookings: portal.upcomingBookings,
    privateUpcomingBookings: portal.upcomingBookings.filter((booking) => booking.type === "one_on_one"),
    activePrivatePackage: portal.activePrivatePackage,
    options: {
      oneOnOne: {
        eligible:
          portal.privateTrainingAccess !== "blocked" &&
          portal.assessmentCompleted &&
          !portal.packageSelectionRequired,
        hasUpcoming: portal.hasOneOnOneUpcoming,
        blockedReason:
          portal.privateTrainingAccess === "blocked"
            ? "private_training_blocked"
            : portal.packageSelectionRequired
              ? "private_package_required"
              : portal.activePrivatePackage && portal.activePrivatePackage.sessionsRemaining <= 0
                ? "private_package_exhausted"
                : null,
        sessionsRemaining: portal.activePrivatePackage?.sessionsRemaining ?? 0,
      },
      groupClasses: {
        eligible: portal.assessmentCompleted && portal.allowedGroupClassTypeIds.length > 0,
        allowedProgramIds: portal.allowedGroupClassTypeIds,
        blockedReason: !portal.assessmentCompleted
          ? "assessment_required"
          : portal.allowedGroupClassTypeIds.length === 0
            ? "no_group_program_access"
            : null,
      },
    },
    privateLocationAccess: portal.privateLocationAccess,
    inHomeBookingAllowed: portal.privateLocationAccess === "facility_and_in_home",
    privateTrainingAccess: portal.privateTrainingAccess,
    privateTrainingAllowed: portal.privateTrainingAccess !== "blocked",
    squareBookingSiteUrl,
  })
}
