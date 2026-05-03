import { NextResponse } from "next/server"
import { FieldValue, type Firestore } from "firebase-admin/firestore"
import { getConsultationServiceVariationIds } from "@/lib/square-service-config"
import {
  ISSUE_SERVICE_MAP,
  goalLabelsForIssue,
  intakeResponsesForIssue,
  issueLabel,
} from "@/app/booking/constants"
import type { BookingFormData } from "@/app/booking/types"
import { getAdminDb } from "@/lib/firebase-admin"
import { createSquareBooking, getOrCreateSquareCustomer } from "@/lib/square"
import { pushLeadToGHL } from "@/lib/gohighlevel"
import { isFacilityRoomAvailable } from "@/lib/facility-room-capacity"
import { defaultLocale, isAppLocale, type AppLocale } from "@/lib/i18n/config"
import { clientConsultationRef, clientConsultationsCollection, upsertClientProfile } from "@/lib/client-records"

export const runtime = "nodejs"

function isBookingFormData(value: unknown): value is BookingFormData {
  if (!value || typeof value !== "object") return false

  const data = value as Partial<BookingFormData>
  return typeof data.connectMethod === "string" && data.connectMethod.length > 0
}

function truncate(value: string, max = 220) {
  const trimmed = value.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}

const bookingErrors = {
  en: {
    invalidPayload: "Invalid booking payload.",
    emailRequired: "Email is required.",
    contactRequired: "Contact name is required.",
    dogRequired: "Dog name is required.",
    unsupportedType: "Unsupported booking type.",
    configIncomplete: "Square consultation configuration is incomplete. Set in Admin -> Service Mapping.",
    slotRequired: "Consultation slot selection is required.",
    invalidSlot: "Invalid consultation slot selection.",
    slotExpired: "Selected consultation slot is no longer valid.",
    roomUnavailable: "That time is no longer available because both facility rooms are booked.",
    submitFailed: "Failed to submit booking form.",
  },
  fr: {
    invalidPayload: "La demande de réservation est invalide.",
    emailRequired: "L'adresse courriel est requise.",
    contactRequired: "Le nom du contact est requis.",
    dogRequired: "Le nom du chien est requis.",
    unsupportedType: "Ce type de réservation n'est pas pris en charge.",
    configIncomplete: "La configuration Square de consultation est incomplète. Configurez-la dans Admin -> Service Mapping.",
    slotRequired: "La sélection d'un créneau de consultation est requise.",
    invalidSlot: "La sélection du créneau de consultation est invalide.",
    slotExpired: "Le créneau de consultation sélectionné n'est plus valide.",
    roomUnavailable: "Cette heure n'est plus disponible, car les deux salles sont réservées.",
    submitFailed: "Impossible d'envoyer le formulaire de réservation.",
  },
} satisfies Record<AppLocale, Record<string, string>>

function resolvePayloadLocale(value: unknown): AppLocale {
  const candidate = typeof value === "string" ? value : null
  return isAppLocale(candidate) ? candidate : defaultLocale
}

function buildSquareIntakeNote(formData: BookingFormData) {
  const followUps = intakeResponsesForIssue(formData.issue, formData.followUps || {})
    .slice(0, 6)
    .map((response) => `${response.questionLabel}: ${response.answerLabel}`)
    .join(", ")
  const goals = goalLabelsForIssue(formData.issue, formData.goals || [])
  const parts = [
    `Dog: ${formData.dogName || "Unknown"} (${formData.dogBreed || "Unknown"}, ${formData.dogAge || "Unknown"})`,
    `Issue: ${issueLabel(formData.issue) || "Not provided"}`,
    `Follow-ups: ${followUps || "Not provided"}`,
    `Goals: ${goals.slice(0, 3).join(", ") || "Not provided"}`,
    `Contact pref: ${formData.contactBestTime || "Not provided"}`,
  ]
  if (formData.contactNotes?.trim()) {
    parts.push(`Client notes: ${truncate(formData.contactNotes, 160)}`)
  }
  return truncate(parts.join(" | "), 900)
}

function normalizedDogName(value?: string | null) {
  return String(value || "").trim().toLowerCase()
}

function isReplaceableConsultationStatus(value: unknown) {
  const status = String(value || "").trim().toLowerCase()
  return status === "intake_submitted" || status === "scheduled" || status === "expired"
}

function consultationActivityTime(data: Record<string, unknown>) {
  const candidate =
    data.submittedAtIso ||
    data.scheduledAtIso ||
    data.consultationDateTime ||
    data.updatedAtIso ||
    data.createdAtIso
  const time = candidate ? new Date(String(candidate)).getTime() : 0
  return Number.isFinite(time) ? time : 0
}

async function findReplaceableConsultationId(db: Firestore, clientId: string, dogName: string) {
  const targetDogName = normalizedDogName(dogName)
  if (!clientId || !targetDogName) return null

  const snap = await clientConsultationsCollection(db, clientId).limit(100).get()

  const candidates = snap.docs
    .map((doc) => ({ id: doc.id, data: doc.data() as Record<string, unknown> }))
    .filter(({ data }) => normalizedDogName(String(data.dogName || "")) === targetDogName)
    .filter(({ data }) => isReplaceableConsultationStatus(data.status))
    .sort((a, b) => consultationActivityTime(b.data) - consultationActivityTime(a.data))

  return candidates[0]?.id || null
}

export async function POST(request: Request) {
  let locale: AppLocale = defaultLocale
  try {
    const payload = (await request.json()) as { formData?: unknown; locale?: unknown }
    locale = resolvePayloadLocale(payload.locale)
    const errorText = bookingErrors[locale]

    if (!isBookingFormData(payload.formData)) {
      return NextResponse.json({ error: errorText.invalidPayload }, { status: 400 })
    }

    const formData = payload.formData
    if (!formData.contactEmail) {
      return NextResponse.json({ error: errorText.emailRequired }, { status: 400 })
    }
    if (!formData.contactName) {
      return NextResponse.json({ error: errorText.contactRequired }, { status: 400 })
    }
    if (!formData.dogName) {
      return NextResponse.json({ error: errorText.dogRequired }, { status: 400 })
    }
    if (!formData.connectMethod) {
      return NextResponse.json({ error: errorText.unsupportedType }, { status: 400 })
    }

    const clientId = formData.contactEmail.trim().toLowerCase()
    const consultationStatus = formData.connectMethod === "in-person-evaluation" ? "scheduled" : "intake_submitted"
    const isConsultation = formData.connectMethod === "in-person-evaluation"
    let squareCustomerId: string | null = null
    let squareConsultationBookingId: string | null = null
    let squareConsultationStatus: string | null = null
    let scheduledAtIso: string | null = null
    let consultationServiceVariationId: string | null = null
    let consultationTeamMemberId: string | null = null
    let consultationTeamMemberName: string | null = null

    if (isConsultation && formData.consultationDateTime) {
      const allowedServiceVariationIds = await getConsultationServiceVariationIds()
      if (allowedServiceVariationIds.length === 0) {
        return NextResponse.json(
          { error: errorText.configIncomplete },
          { status: 500 },
        )
      }
      const consultationSlotKey = String(formData.consultationSlotKey || "").trim()
      if (!consultationSlotKey) {
        return NextResponse.json({ error: errorText.slotRequired }, { status: 400 })
      }
      const [slotStartAt, slotServiceVariationId, slotTeamMemberId] = consultationSlotKey.split("|")
      if (!slotStartAt || !slotServiceVariationId || !slotTeamMemberId) {
        return NextResponse.json({ error: errorText.invalidSlot }, { status: 400 })
      }
      if (!allowedServiceVariationIds.includes(slotServiceVariationId)) {
        return NextResponse.json({ error: errorText.slotExpired }, { status: 400 })
      }
      scheduledAtIso = new Date(slotStartAt).toISOString()
      consultationServiceVariationId = slotServiceVariationId
      consultationTeamMemberId = slotTeamMemberId
      consultationTeamMemberName = formData.consultationTeamMemberName?.trim() || null
      const roomAvailable = await isFacilityRoomAvailable({
        startAt: scheduledAtIso,
        serviceVariationId: slotServiceVariationId,
      })
      if (!roomAvailable) {
        return NextResponse.json(
          { error: errorText.roomUnavailable },
          { status: 409 },
        )
      }

      squareCustomerId = await getOrCreateSquareCustomer({
        name: formData.contactName,
        email: formData.contactEmail,
        phone: formData.contactPhone,
      })
      const squareBooking = await createSquareBooking({
        customerId: squareCustomerId,
        startAt: scheduledAtIso,
        serviceVariationId: slotServiceVariationId,
        teamMemberId: slotTeamMemberId,
        idempotencyKey: crypto.randomUUID(),
        note: buildSquareIntakeNote(formData),
      })
      squareConsultationBookingId = squareBooking.booking?.id || null
      squareConsultationStatus = squareBooking.booking?.status || null
    }

    const intakeResponses = intakeResponsesForIssue(formData.issue, formData.followUps || {})
    const goalLabels = goalLabelsForIssue(formData.issue, formData.goals || [])
    const submission = {
      clientId,
      clientName: formData.contactName,
      clientEmail: formData.contactEmail,
      clientPhone: formData.contactPhone,
      dogName: formData.dogName,
      issue: formData.issue,
      issueLabel: issueLabel(formData.issue),
      issueOther: formData.issueOther,
      connectMethod: formData.connectMethod,
      followUps: formData.followUps || {},
      intakeQuestionVersion: "2026-05-dynamic-intake-v1",
      intakeResponses,
      intakeResponseSummary: intakeResponses.map((response) => `${response.questionLabel}: ${response.answerLabel}`).join("\n"),
      duration: formData.duration,
      tried: formData.tried,
      impact: formData.impact,
      goals: formData.goals,
      goalLabels,
      dogBreed: formData.dogBreed,
      dogAge: formData.dogAge,
      dogDuration: formData.dogDuration,
      dogSource: formData.dogSource,
      contactBestTime: formData.contactBestTime,
      contactNotes: formData.contactNotes,
      consultationDateTime: formData.consultationDateTime || null,
      consultationSlotKey: formData.consultationSlotKey || null,
      scheduledAtIso,
      locationLabel: formData.consultationLocation || null,
      consultationLocation: formData.consultationLocation || null,
      consultationWhat: formData.consultationWhat || "In-person evaluation (60-75 minutes)",
      consultationServiceVariationId,
      consultationTeamMemberId,
      consultationTeamMemberName,
      teamMemberId: consultationTeamMemberId,
      teamMemberName: consultationTeamMemberName,
      suggestedService: ISSUE_SERVICE_MAP[formData.issue] || "Manual Review",
      highPriority:
        formData.impact.includes("thought-about-rehoming") ||
        formData.followUps["bitten-human"] === "yes" ||
        formData.followUps["bitten-dog"] === "yes" ||
        formData.followUps["bitten-or-nipped-human"] === "yes",
      status: consultationStatus,
      recommendedClassTypes: [],
      completedAtIso: null,
      completedBy: null,
      staffNotes: "",
      bookingAccess: null,
      initialPaymentIntentId: null,
      initialPaymentStatus: "not_required",
      squareCustomerId,
      squareConsultationBookingId,
      squareConsultationStatus,
      preferredLocale: locale,
      websiteLocale: locale,
      source: "website-booking-form",
      submittedAtIso: new Date().toISOString(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const db = getAdminDb()
    await upsertClientProfile(db, {
      clientEmail: formData.contactEmail,
      clientName: formData.contactName,
      clientPhone: formData.contactPhone,
      dogName: formData.dogName,
      squareCustomerId,
      source: "website-booking-form",
      preferredLocale: locale,
    })
    const replaceConsultationId = await findReplaceableConsultationId(db, clientId, formData.dogName)
    const docRef = clientConsultationRef(db, clientId, replaceConsultationId || undefined)
    const writePayload = {
      ...submission,
      id: docRef.id,
      clientCollectionPath: docRef.path,
      ...(replaceConsultationId ? {} : { createdAt: FieldValue.serverTimestamp() }),
      ...(replaceConsultationId ? { replacedByLatestSubmissionAtIso: new Date().toISOString() } : {}),
    }
    await docRef.set(writePayload, { merge: Boolean(replaceConsultationId) })

    // Push lead to GoHighLevel (non-blocking)
    pushLeadToGHL(formData).catch((err) =>
      console.error("[Booking API] GHL push failed (non-blocking):", err)
    )

    return NextResponse.json({
      ok: true,
      id: docRef.id,
      collection: docRef.path,
    })
  } catch (error) {
    console.error("[Booking API] Failed to save booking:", error)
    return NextResponse.json({ error: bookingErrors[locale].submitFailed }, { status: 500 })
  }
}
