import { FieldValue } from "firebase-admin/firestore"
import { NextResponse } from "next/server"
import { PRIVATE_TRAINING_PACKAGES_COLLECTION } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import { getPrivateServiceVariationId, getPrivateServiceVariationIds } from "@/lib/square-service-config"
import { createSquareBooking, getOrCreateSquareCustomer } from "@/lib/square"
import { isFacilityRoomAvailable } from "@/lib/facility-room-capacity"
import { inHomeBookingAllowed, privateTrainingBookingAllowed } from "@/lib/client-booking-settings"
import { ONE_ON_ONE_PROGRAM_ID, ONE_ON_ONE_PROGRAM_LABEL, loadTrainingPortalContext } from "@/lib/training-portal"
import {
  clientBookingRef,
  clientBookingsCollection,
  clientPrivatePackageRef,
  upsertClientProfile,
} from "@/lib/client-records"
import { notifyStaffOfBooking } from "@/lib/staff-booking-notify"

export const runtime = "nodejs"

type Payload = {
  clientEmail?: string
  dogName?: string
  selectedSlotKey?: string
  locale?: string
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
  const selectedSlotKey = String(payload.selectedSlotKey || "")
  const locale = String(payload.locale || "").trim().toLowerCase()
  if (!clientEmail || !dogName || !selectedSlotKey) {
    return NextResponse.json({ error: "clientEmail, dogName and selectedSlotKey are required." }, { status: 400 })
  }

  const oneOnOneServiceVariationIds = await getPrivateServiceVariationIds()
  if (oneOnOneServiceVariationIds.length === 0) {
    return NextResponse.json({ error: "Missing private training Square mapping configuration." }, { status: 500 })
  }

  const portal = await loadTrainingPortalContext({
    clientEmail,
    dogName,
    oneOnOneServiceVariationIds,
  })
  if (!portal.assessmentCompleted) {
    return NextResponse.json({ error: "Assessment must be completed before booking training." }, { status: 403 })
  }
  if (!privateTrainingBookingAllowed(portal.privateTrainingAccess)) {
    return NextResponse.json(
      { error: "Private training is not enabled for your account.", code: "private_training_blocked" },
      { status: 403 },
    )
  }
  if (!portal.activePrivatePackage) {
    return NextResponse.json({ error: "Please select a private package before booking.", code: "private_package_required" }, { status: 409 })
  }
  if (portal.activePrivatePackage.sessionsRemaining <= 0 || portal.activePrivatePackage.status !== "active") {
    return NextResponse.json({ error: "Your private package has no remaining sessions.", code: "private_package_exhausted" }, { status: 409 })
  }
  if (portal.activePrivatePackage.serviceType === "in_home" && !inHomeBookingAllowed(portal.privateLocationAccess)) {
    return NextResponse.json(
      { error: "In-home training is not enabled for your account.", code: "in_home_not_allowed" },
      { status: 403 },
    )
  }

  const expectedServiceVariationId = await getPrivateServiceVariationId({
    serviceType: portal.activePrivatePackage.serviceType,
    planType: portal.activePrivatePackage.planType,
  })
  if (!expectedServiceVariationId) {
    return NextResponse.json({ error: "Selected private package is not mapped to a Square service variation." }, { status: 500 })
  }

  const [startAt, programId, teamMemberId, serviceVariationFromSlot] = selectedSlotKey.split("|")
  if (!startAt || !programId || !teamMemberId) {
    return NextResponse.json({ error: "Invalid slot key." }, { status: 400 })
  }
  if (programId !== ONE_ON_ONE_PROGRAM_ID) {
    return NextResponse.json({ error: "Selected slot is not a valid 1-on-1 slot." }, { status: 400 })
  }
  const serviceVariationId = serviceVariationFromSlot || expectedServiceVariationId
  if (serviceVariationId !== expectedServiceVariationId) {
    return NextResponse.json({ error: "Selected slot does not match your package service type." }, { status: 400 })
  }
  if (portal.activePrivatePackage.serviceType === "in_facility") {
    const roomAvailable = await isFacilityRoomAvailable({
      startAt: new Date(startAt).toISOString(),
      serviceVariationId,
      teamMemberId,
    })
    if (!roomAvailable) {
      return NextResponse.json(
        { error: "That time is no longer available because both facility rooms are booked." },
        { status: 409 },
      )
    }
  }

  const db = getAdminDb()
  const duplicateSlotSnap = await clientBookingsCollection(db, portal.clientId)
    .where("selectedSlots", "array-contains", selectedSlotKey)
    .limit(1)
    .get()
  const duplicateDoc = duplicateSlotSnap.docs[0]
  if (duplicateDoc) {
    return NextResponse.json({ ok: true, bookingId: duplicateDoc.id, duplicate: true })
  }

  const customerId = await getOrCreateSquareCustomer({
    name: portal.latestConsultation?.clientName || "MTLK9 Client",
    email: clientEmail,
    phone: portal.latestConsultation?.clientPhone,
  })

  const squareBooking = await createSquareBooking({
    customerId,
    startAt: new Date(startAt).toISOString(),
    serviceVariationId,
    teamMemberId,
    idempotencyKey: crypto.randomUUID(),
    note: `1-on-1 training booking for ${dogName}. Pay in person.`,
  })
  await upsertClientProfile(db, {
    clientEmail,
    clientName: portal.latestConsultation?.clientName,
    clientPhone: portal.latestConsultation?.clientPhone,
    dogName,
    squareCustomerId: customerId,
    source: "training-portal-one-on-one",
    preferredLocale: locale,
  })

  const packageRef = db.collection(PRIVATE_TRAINING_PACKAGES_COLLECTION).doc(portal.activePrivatePackage.id)
  const nestedPackageRef = clientPrivatePackageRef(db, clientEmail, dogName, portal.activePrivatePackage.id)
  const bookingRef = clientBookingRef(db, clientEmail)
  let privateSessionNumber: number | null = null
  try {
    await db.runTransaction(async (transaction) => {
      const [packageSnap, nestedPackageSnap] = await Promise.all([
        transaction.get(packageRef),
        transaction.get(nestedPackageRef),
      ])
      const primaryPackageSnap = nestedPackageSnap.exists ? nestedPackageSnap : packageSnap
      if (!primaryPackageSnap.exists) throw new Error("Private package not found.")
      const data = primaryPackageSnap.data() as { status?: string; sessionsRemaining?: number; sessionsBookedCount?: number }
      const remaining = Number(data.sessionsRemaining ?? 0)
      const bookedCount = Number(data.sessionsBookedCount ?? 0)
      const status = String(data.status || "")
      if (status !== "active" || remaining <= 0) {
        throw new Error("Private package has no remaining sessions.")
      }
      const nextBookedCount = bookedCount + 1
      privateSessionNumber = nextBookedCount
      const nextRemaining = Math.max(0, remaining - 1)
      const nextStatus = nextRemaining === 0 ? "exhausted" : "active"

      const packagePatch = {
        sessionsBookedCount: nextBookedCount,
        sessionsRemaining: nextRemaining,
        status: nextStatus,
        updatedAt: FieldValue.serverTimestamp(),
      }
      if (packageSnap.exists) transaction.update(packageRef, packagePatch)
      if (nestedPackageSnap.exists) transaction.update(nestedPackageRef, packagePatch)
      const bookingData = {
        id: bookingRef.id,
        consultationId: portal.latestConsultation?.id || "training-portal-lookup",
        clientId: portal.clientId,
        clientName: portal.latestConsultation?.clientName || "",
        clientEmail,
        dogName,
        selectedSlots: [selectedSlotKey],
        selectedClassTypes: [ONE_ON_ONE_PROGRAM_ID],
        summary: {
          when: [startAt],
          where: ["Square booking (pay in person)"],
          what: [ONE_ON_ONE_PROGRAM_LABEL],
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
        privatePackageId: portal.activePrivatePackage?.id || null,
        privateServiceType: portal.activePrivatePackage?.serviceType || null,
        privatePlanType: portal.activePrivatePackage?.planType || null,
        sessionNumber: nextBookedCount,
        source: "training-portal-one-on-one",
        preferredLocale: locale === "en" || locale === "fr" ? locale : null,
        websiteLocale: locale === "en" || locale === "fr" ? locale : null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }
      transaction.set(bookingRef, { ...bookingData, clientCollectionPath: bookingRef.path })
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reserve a session from this package."
    if (message.toLowerCase().includes("remaining sessions")) {
      return NextResponse.json({ error: message, code: "private_package_exhausted" }, { status: 409 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }

  notifyStaffOfBooking({
    kind: "private_session",
    bookingId: bookingRef.id,
    clientName: portal.latestConsultation?.clientName || "",
    clientEmail,
    dogName,
    sessionLabel: ONE_ON_ONE_PROGRAM_LABEL,
    slotStartAtIso: new Date(startAt).toISOString(),
    privateServiceType: portal.activePrivatePackage?.serviceType ?? null,
    sessionNumber: privateSessionNumber,
    squareBookingId: squareBooking.booking?.id || null,
  })

  return NextResponse.json({
    ok: true,
    bookingId: bookingRef.id,
    squareBookingId: squareBooking.booking?.id || null,
  })
}
