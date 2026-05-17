import { NextResponse } from "next/server"
import { getPrivateServiceVariationIds } from "@/lib/square-service-config"
import { getSquareBookingSiteUrlForLocation } from "@/lib/square"
import { assertTrainingPortalConsultationTrust } from "@/lib/booking-access-training"
import { loadTrainingPortalContext } from "@/lib/training-portal"
import { PUPPY_SOCIAL_DROP_IN_DEPOSIT_CENTS } from "@/lib/puppy-social-drop-in"

export const runtime = "nodejs"

type Payload = {
  clientEmail?: string
  dogName?: string
  /** Signed proof from staff email — skips re-verifying assessment when valid. */
  portalProof?: string
  /** Plain-text booking-access token from `/booking-access/{token}` — same trust as proof when valid. */
  bookingAccessToken?: string
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

  const portalProof = String(payload.portalProof || "").trim() || undefined
  const bookingAccessToken = String(payload.bookingAccessToken || "").trim() || undefined

  try {
    const oneOnOneServiceVariationIds = await getPrivateServiceVariationIds()
    if (oneOnOneServiceVariationIds.length === 0) {
      return NextResponse.json({ error: "Missing one-on-one Square mapping configuration." }, { status: 500 })
    }

    const trust = await assertTrainingPortalConsultationTrust({
      portalProof,
      bookingAccessToken,
      clientEmail,
      dogName,
    })

    const portal = await loadTrainingPortalContext({
      clientEmail,
      dogName,
      oneOnOneServiceVariationIds,
    })
    const assessmentCompleted = portal.assessmentCompleted || Boolean(trust)

    const latestConsultation =
      portal.latestConsultation ||
      (trust
        ? {
            id: trust.consultationId,
            clientName: String(trust.consultation.clientName || ""),
            clientEmail: String(trust.consultation.clientEmail || trust.consultation.clientId || clientEmail),
            clientPhone: String(trust.consultation.clientPhone || "") || null,
            dogName: String(trust.consultation.dogName || dogName),
            dogBreed: String(trust.consultation.dogBreed || "") || null,
            dogAge: String(trust.consultation.dogAge || "") || null,
            issue: String(trust.consultation.issue || "") || null,
            status: "completed",
          }
        : null)
    let squareBookingSiteUrl: string | null = null
    try {
      squareBookingSiteUrl = await getSquareBookingSiteUrlForLocation()
    } catch {
      squareBookingSiteUrl = null
    }

    return NextResponse.json({
      ok: true,
      hasConsultation: Boolean(portal.latestConsultation) || Boolean(trust),
      assessmentCompleted,
      latestConsultationStatus: latestConsultation?.status || portal.latestConsultation?.status || null,
      consultationId: latestConsultation?.id || portal.latestConsultation?.id || null,
      clientSummary: latestConsultation
        ? {
            clientName: latestConsultation.clientName || null,
            clientEmail: latestConsultation.clientEmail || clientEmail,
            clientPhone: latestConsultation.clientPhone || null,
            dogName: latestConsultation.dogName || dogName || portal.dogName || null,
            dogBreed: latestConsultation.dogBreed || null,
            dogAge: latestConsultation.dogAge || null,
            issue: latestConsultation.issue || null,
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
            portal.privateTrainingAccess !== "blocked" && assessmentCompleted && !portal.packageSelectionRequired,
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
          eligible: assessmentCompleted && portal.allowedGroupClassTypeIds.length > 0,
          allowedProgramIds: portal.allowedGroupClassTypeIds,
          blockedReason: !assessmentCompleted
            ? "assessment_required"
            : portal.allowedGroupClassTypeIds.length === 0
              ? "no_group_program_access"
              : null,
          dropInPuppySocialization: {
            available: true,
            depositCents: PUPPY_SOCIAL_DROP_IN_DEPOSIT_CENTS,
            currency: "cad",
          },
        },
      },
      privateLocationAccess: portal.privateLocationAccess,
      inHomeBookingAllowed: portal.privateLocationAccess === "facility_and_in_home",
      privateTrainingAccess: portal.privateTrainingAccess,
      privateTrainingAllowed: portal.privateTrainingAccess !== "blocked",
      squareBookingSiteUrl,
    })
  } catch (error) {
    console.error("[training-portal/status] Lookup failed:", error)
    return NextResponse.json({ error: "Could not load training portal status." }, { status: 500 })
  }
}
