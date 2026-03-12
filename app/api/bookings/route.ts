import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { ISSUE_SERVICE_MAP } from "@/app/booking/constants"
import type { BookingFormData } from "@/app/booking/types"
import { CONSULTATIONS_COLLECTION } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import { createSquareBooking, getOrCreateSquareCustomer } from "@/lib/square"

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

function buildSquareIntakeNote(formData: BookingFormData) {
  const parts = [
    `Dog: ${formData.dogName || "Unknown"} (${formData.dogBreed || "Unknown"}, ${formData.dogAge || "Unknown"})`,
    `Issue: ${formData.issueOther?.trim() ? formData.issueOther : formData.issue || "Not provided"}`,
    `Duration: ${formData.duration || "Not provided"}`,
    `Goals: ${formData.goals.slice(0, 3).join(", ") || "Not provided"}`,
    `Tried: ${formData.tried.slice(0, 3).join(", ") || "Not provided"}`,
    `Impact: ${formData.impact.slice(0, 2).join(", ") || "Not provided"}`,
    `Contact pref: ${formData.contactBestTime || "Not provided"}`,
  ]
  if (formData.contactNotes?.trim()) {
    parts.push(`Client notes: ${truncate(formData.contactNotes, 160)}`)
  }
  return truncate(parts.join(" | "), 900)
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { formData?: unknown }

    if (!isBookingFormData(payload.formData)) {
      return NextResponse.json({ error: "Invalid booking payload." }, { status: 400 })
    }

    const formData = payload.formData
    if (!formData.contactEmail) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }
    if (!formData.contactName) {
      return NextResponse.json({ error: "Contact name is required." }, { status: 400 })
    }
    if (!formData.dogName) {
      return NextResponse.json({ error: "Dog name is required." }, { status: 400 })
    }
    if (!formData.connectMethod) {
      return NextResponse.json({ error: "Unsupported booking type." }, { status: 400 })
    }

    const clientId = formData.contactEmail.trim().toLowerCase()
    const consultationStatus = formData.connectMethod === "in-person-evaluation" ? "scheduled" : "intake_submitted"
    const isConsultation = formData.connectMethod === "in-person-evaluation"
    let squareCustomerId: string | null = null
    let squareConsultationBookingId: string | null = null
    let squareConsultationStatus: string | null = null

    if (isConsultation && formData.consultationDateTime) {
      const serviceVariationId = process.env.SQUARE_CONSULTATION_SERVICE_VARIATION_ID
      if (!serviceVariationId) {
        return NextResponse.json(
          { error: "Square consultation configuration is incomplete. Set SQUARE_CONSULTATION_SERVICE_VARIATION_ID." },
          { status: 500 },
        )
      }
      const consultationSlotKey = String(formData.consultationSlotKey || "").trim()
      if (!consultationSlotKey) {
        return NextResponse.json({ error: "Consultation slot selection is required." }, { status: 400 })
      }
      const [slotStartAt, slotServiceVariationId, slotTeamMemberId] = consultationSlotKey.split("|")
      if (!slotStartAt || !slotServiceVariationId || !slotTeamMemberId) {
        return NextResponse.json({ error: "Invalid consultation slot selection." }, { status: 400 })
      }
      if (slotServiceVariationId !== serviceVariationId) {
        return NextResponse.json({ error: "Selected consultation slot is no longer valid." }, { status: 400 })
      }

      squareCustomerId = await getOrCreateSquareCustomer({
        name: formData.contactName,
        email: formData.contactEmail,
        phone: formData.contactPhone,
      })
      const squareBooking = await createSquareBooking({
        customerId: squareCustomerId,
        startAt: new Date(slotStartAt).toISOString(),
        serviceVariationId,
        teamMemberId: slotTeamMemberId,
        idempotencyKey: crypto.randomUUID(),
        note: buildSquareIntakeNote(formData),
      })
      squareConsultationBookingId = squareBooking.booking?.id || null
      squareConsultationStatus = squareBooking.booking?.status || null
    }

    const submission = {
      clientId,
      clientName: formData.contactName,
      clientEmail: formData.contactEmail,
      clientPhone: formData.contactPhone,
      dogName: formData.dogName,
      issue: formData.issue,
      issueOther: formData.issueOther,
      connectMethod: formData.connectMethod,
      duration: formData.duration,
      tried: formData.tried,
      impact: formData.impact,
      goals: formData.goals,
      dogBreed: formData.dogBreed,
      dogAge: formData.dogAge,
      dogDuration: formData.dogDuration,
      dogSource: formData.dogSource,
      contactBestTime: formData.contactBestTime,
      contactNotes: formData.contactNotes,
      consultationDateTime: formData.consultationDateTime || null,
      consultationSlotKey: formData.consultationSlotKey || null,
      consultationLocation: formData.consultationLocation || null,
      consultationWhat: formData.consultationWhat || "In-person evaluation (60-75 minutes)",
      suggestedService: ISSUE_SERVICE_MAP[formData.issue] || "Manual Review",
      highPriority: formData.impact.includes("thought-about-rehoming"),
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
      source: "website-booking-form",
      submittedAtIso: new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = await getAdminDb().collection(CONSULTATIONS_COLLECTION).add(submission)

    return NextResponse.json({
      ok: true,
      id: docRef.id,
      collection: CONSULTATIONS_COLLECTION,
    })
  } catch (error) {
    console.error("[Booking API] Failed to save booking:", error)
    return NextResponse.json({ error: "Failed to save booking." }, { status: 500 })
  }
}
