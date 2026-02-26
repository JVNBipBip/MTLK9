import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { ISSUE_SERVICE_MAP } from "@/app/booking/constants"
import type { BookingFormData } from "@/app/booking/types"
import { getAdminDb } from "@/lib/firebase-admin"

export const runtime = "nodejs"

const COLLECTION_BY_CONNECT_METHOD = {
  "discovery-call": "bookings_discovery_calls",
  "in-person-evaluation": "bookings_in_person_evaluations",
} as const

function isBookingFormData(value: unknown): value is BookingFormData {
  if (!value || typeof value !== "object") return false

  const data = value as Partial<BookingFormData>
  return typeof data.connectMethod === "string" && data.connectMethod.length > 0
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      formData?: unknown
      paymentIntentId?: string
      paymentStatus?: string
    }

    if (!isBookingFormData(payload.formData)) {
      return NextResponse.json({ error: "Invalid booking payload." }, { status: 400 })
    }

    const formData = payload.formData
    const collectionName = COLLECTION_BY_CONNECT_METHOD[formData.connectMethod as keyof typeof COLLECTION_BY_CONNECT_METHOD]

    if (!collectionName) {
      return NextResponse.json({ error: "Unsupported booking type." }, { status: 400 })
    }

    const submission = {
      ...formData,
      bookingType: formData.connectMethod,
      suggestedService: ISSUE_SERVICE_MAP[formData.issue] || "Manual Review",
      highPriority: formData.impact.includes("thought-about-rehoming"),
      paymentIntentId: payload.paymentIntentId || null,
      paymentStatus:
        payload.paymentStatus ||
        (formData.connectMethod === "in-person-evaluation" ? "requires_payment_method" : "not_required"),
      source: "website-booking-form",
      submittedAtIso: new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp(),
    }

    const docRef = await getAdminDb().collection(collectionName).add(submission)

    return NextResponse.json({
      ok: true,
      id: docRef.id,
      collection: collectionName,
    })
  } catch (error) {
    console.error("[Booking API] Failed to save booking:", error)
    return NextResponse.json({ error: "Failed to save booking." }, { status: 500 })
  }
}
