import { FieldValue } from "firebase-admin/firestore"
import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase-admin"
import { migratedGroupProgramSlotOrder } from "@/lib/group-program-slots"
import { programLabel } from "@/lib/programs"
import { getProgramServiceVariationId, getSquareServiceConfig } from "@/lib/square-service-config"
import { hashAccessToken } from "@/lib/tokens"
import { createSquareBooking, getOrCreateSquareCustomer } from "@/lib/square"
import { clientBookingRef, clientBookingsCollection, findClientConsultationByAccessTokenHash, upsertClientProfile } from "@/lib/client-records"
import { notifyStaffOfBooking } from "@/lib/staff-booking-notify"

export const runtime = "nodejs"

type Payload = {
  token?: string
  consultationId?: string
  selectedSlotKey?: string
}

export async function POST(request: Request) {
  let payload: Payload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const token = String(payload.token || "")
  const consultationId = String(payload.consultationId || "")
  const selectedSlotKey = String(payload.selectedSlotKey || "")
  if (!token || !consultationId || !selectedSlotKey) {
    return NextResponse.json({ error: "token, consultationId and selectedSlotKey are required." }, { status: 400 })
  }

  const db = getAdminDb()
  const tokenHash = hashAccessToken(token)
  const consultationSnap = await findClientConsultationByAccessTokenHash(db, tokenHash, consultationId)
  if (!consultationSnap) {
    return NextResponse.json({ error: "Consultation not found." }, { status: 404 })
  }

  const consultation = consultationSnap.data() as {
    bookingAccess?: { tokenHash?: string; expiresAtIso?: string; revokedAtIso?: string }
    recommendedClassTypes?: string[]
    clientId?: string
    clientName?: string
    clientEmail?: string
    dogName?: string
    preferredLocale?: string | null
    websiteLocale?: string | null
    status?: string
  }

  const access = consultation.bookingAccess
  if (
    !access?.tokenHash ||
    access.tokenHash !== tokenHash ||
    (access.expiresAtIso ? new Date(access.expiresAtIso).getTime() < Date.now() : true) ||
    access.revokedAtIso ||
    consultation.status !== "completed"
  ) {
    return NextResponse.json({ error: "Booking access is invalid or expired." }, { status: 401 })
  }
  const bookingClientEmail = String(consultation.clientEmail || consultation.clientId || "").trim().toLowerCase()
  if (!bookingClientEmail) {
    return NextResponse.json({ error: "Consultation is missing client email." }, { status: 400 })
  }

  const recommendedSet = new Set((consultation.recommendedClassTypes || []).map(String))
  const [startAt, programId, teamMemberId, serviceVariationFromSlot] = selectedSlotKey.split("|")
  if (!startAt || !programId || !teamMemberId) {
    return NextResponse.json({ error: "Invalid slot key." }, { status: 400 })
  }
  if (!recommendedSet.has(programId)) {
    return NextResponse.json({ error: "Selected slot is outside approved class types." }, { status: 400 })
  }
  const serviceVariationId = serviceVariationFromSlot || (await getProgramServiceVariationId(programId))
  if (!serviceVariationId) {
    return NextResponse.json({ error: "Selected class is not mapped to a Square service variation." }, { status: 400 })
  }

  const squareCfg = await getSquareServiceConfig(null)
  const groupSlotOrder = migratedGroupProgramSlotOrder(squareCfg)

  const duplicateSnap = await clientBookingsCollection(db, bookingClientEmail)
    .where("consultationId", "==", consultationId)
    .where("selectedSlots", "array-contains", selectedSlotKey)
    .limit(1)
    .get()
  if (!duplicateSnap.empty) {
    return NextResponse.json({ ok: true, bookingId: duplicateSnap.docs[0].id, duplicate: true })
  }

  const customerId = await getOrCreateSquareCustomer({
    name: consultation.clientName || "",
    email: consultation.clientEmail || "",
    phone: undefined,
  })
  const squareBooking = await createSquareBooking({
    customerId,
    startAt: new Date(startAt).toISOString(),
    serviceVariationId,
    teamMemberId,
    idempotencyKey: crypto.randomUUID(),
    note: `Class booking for ${consultation.dogName || "dog"}.`,
  })

  await upsertClientProfile(db, {
    clientEmail: bookingClientEmail,
    clientName: consultation.clientName,
    dogName: consultation.dogName,
    squareCustomerId: customerId,
    source: "booking-access-schedule",
    preferredLocale: consultation.preferredLocale || consultation.websiteLocale,
  })
  const bookingRef = clientBookingRef(db, bookingClientEmail)
  const bookingData = {
    id: bookingRef.id,
    consultationId,
    clientId: consultation.clientId || "",
    clientName: consultation.clientName || "",
    clientEmail: consultation.clientEmail || "",
    dogName: consultation.dogName || "",
    selectedSlots: [selectedSlotKey],
    selectedClassTypes: [programId],
    summary: {
      when: [startAt],
      where: ["Square booking"],
      what: [programLabel(programId, groupSlotOrder) || programId],
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
    preferredLocale: consultation.preferredLocale || consultation.websiteLocale || null,
    websiteLocale: consultation.websiteLocale || consultation.preferredLocale || null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }
  await bookingRef.set({ ...bookingData, clientCollectionPath: bookingRef.path })

  notifyStaffOfBooking({
    kind: "group_class_post_assessment",
    bookingId: bookingRef.id,
    clientName: bookingData.clientName,
    clientEmail: bookingData.clientEmail,
    dogName: bookingData.dogName,
    programLabel: bookingData.summary.what[0] || programId,
    slotStartAtIso: new Date(startAt).toISOString(),
    squareBookingId: squareBooking.booking?.id || null,
  })

  return NextResponse.json({
    ok: true,
    bookingId: bookingRef.id,
    squareBookingId: squareBooking.booking?.id || null,
  })
}
