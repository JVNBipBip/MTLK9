import { FieldValue } from "firebase-admin/firestore"
import { NextResponse } from "next/server"
import { BOOKINGS_COLLECTION } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import { createSquareBooking, getOrCreateSquareCustomer } from "@/lib/square"

export const runtime = "nodejs"

type Payload = {
  selectedSlotKey?: string
  classLabel?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  dogName?: string
}

export async function POST(request: Request) {
  let payload: Payload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const selectedSlotKey = String(payload.selectedSlotKey || "")
  const classLabel = String(payload.classLabel || "Group Class")
  const clientName = String(payload.clientName || "").trim()
  const clientEmail = String(payload.clientEmail || "").trim().toLowerCase()
  const clientPhone = String(payload.clientPhone || "").trim()
  const dogName = String(payload.dogName || "").trim()

  if (!selectedSlotKey || !clientName || !clientEmail) {
    return NextResponse.json({ error: "selectedSlotKey, clientName and clientEmail are required." }, { status: 400 })
  }

  const [startAt, serviceVariationId, teamMemberId] = selectedSlotKey.split("|")
  if (!startAt || !serviceVariationId || !teamMemberId) {
    return NextResponse.json({ error: "Invalid slot key format." }, { status: 400 })
  }

  const customerId = await getOrCreateSquareCustomer({
    name: clientName,
    email: clientEmail,
    phone: clientPhone || undefined,
  })
  const squareBooking = await createSquareBooking({
    customerId,
    startAt: new Date(startAt).toISOString(),
    serviceVariationId,
    teamMemberId,
    idempotencyKey: crypto.randomUUID(),
    note: `Group class reservation (${classLabel})${dogName ? ` for ${dogName}` : ""}. Pay in person.`,
  })

  const bookingRef = await getAdminDb().collection(BOOKINGS_COLLECTION).add({
    consultationId: "public-group-class-reservation",
    clientId: clientEmail,
    clientName,
    clientEmail,
    dogName,
    selectedSlots: [selectedSlotKey],
    selectedClassTypes: [classLabel],
    summary: {
      when: [startAt],
      where: ["Square booking (pay in person)"],
      what: [classLabel],
    },
    paymentIntentId: null,
    paymentStatus: "not_required",
    amountCents: 0,
    currency: "cad",
    paidAtIso: null,
    bookingStatus: "booked_no_payment",
    squareBookingId: squareBooking.booking?.id || null,
    squareBookingStatus: squareBooking.booking?.status || "ACCEPTED",
    squareServiceVariationId: serviceVariationId,
    squareTeamMemberId: teamMemberId,
    source: "public-group-class-booking-test",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({
    ok: true,
    bookingId: bookingRef.id,
    squareBookingId: squareBooking.booking?.id || null,
  })
}
