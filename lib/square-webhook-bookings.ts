import { FieldValue, type Firestore } from "firebase-admin/firestore"
import { BOOKINGS_COLLECTION, CONSULTATIONS_COLLECTION } from "@/lib/domain"
import { getConsultationServiceVariationIds } from "@/lib/square-service-config"
import type { SquareBooking } from "@/lib/square"

export type SquareWebhookPayload = {
  type?: string
  event_id?: string
  created_at?: string
  data?: {
    type?: string
    id?: string
    object?: Record<string, unknown>
  }
}

type RetrieveSquareBooking = (bookingId: string) => Promise<{ booking?: SquareBooking }>

type ExistingBookingDoc = {
  bookingStatus?: string
  selectedSlots?: string[]
  summary?: {
    when?: string[]
    where?: string[]
    what?: string[]
  }
  squareWebhookLastEventId?: string | null
  squareCustomerId?: string | null
  squareBookingStartAtIso?: string | null
  squareServiceVariationId?: string | null
  squareTeamMemberId?: string | null
}

type ExistingConsultationDoc = {
  scheduledAtIso?: string | null
  consultationDateTime?: string | null
  rescheduleCount?: number
  squareWebhookLastEventId?: string | null
  squareCustomerId?: string | null
  locationId?: string | null
}

export type NormalizedSquareBooking = {
  id: string
  status: string | null
  startAtIso: string | null
  locationId: string | null
  customerId: string | null
  customerNote: string | null
  sellerNote: string | null
  source: string | null
  createdAtIso: string | null
  updatedAtIso: string | null
  serviceVariationId: string | null
  teamMemberId: string | null
  durationMinutes: number | null
  slotKey: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  return null
}

function normalizeIso(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function firstSegment(booking: SquareBooking) {
  const segments = Array.isArray(booking.appointment_segments) ? booking.appointment_segments : []
  return segments[0] ?? null
}

function extractInlineBooking(payload: SquareWebhookPayload): SquareBooking | null {
  const obj = asRecord(payload.data?.object)
  if (!obj) return null
  const nested = asRecord(obj.booking)
  if (nested) return nested as SquareBooking
  if (typeof obj.id === "string" && ("start_at" in obj || "status" in obj || "appointment_segments" in obj)) {
    return obj as SquareBooking
  }
  return null
}

function normalizeStatus(status: string | null) {
  return status ? status.trim().toUpperCase() : null
}

function isCancelledStatus(status: string | null, eventType?: string | null) {
  const normalized = normalizeStatus(status)
  if (normalized === "CANCELLED" || normalized === "CANCELED") return true
  return String(eventType || "").toLowerCase().includes("cancel")
}

function buildSlotKey(startAtIso: string | null, serviceVariationId: string | null, teamMemberId: string | null) {
  if (!startAtIso || !serviceVariationId || !teamMemberId) return null
  return [startAtIso, serviceVariationId, teamMemberId].join("|")
}

function bookingStartFromExisting(data: ExistingBookingDoc) {
  const slotStart = data.selectedSlots?.[0]?.split("|")?.[0]
  return normalizeIso(slotStart || data.squareBookingStartAtIso || null)
}

function consultationStartFromExisting(data: ExistingConsultationDoc) {
  return normalizeIso(data.scheduledAtIso || data.consultationDateTime || null)
}

export function isBookingLifecycleEvent(type?: string | null) {
  const normalized = String(type || "").toLowerCase()
  return normalized === "booking.created" || normalized === "booking.updated" || normalized === "booking.canceled" || normalized === "booking.cancelled"
}

export function normalizeSquareBooking(booking: SquareBooking): NormalizedSquareBooking | null {
  const id = asString(booking.id)
  if (!id) return null
  const segment = firstSegment(booking)
  const startAtIso = normalizeIso(asString(booking.start_at))
  const serviceVariationId = asString(segment?.service_variation_id)
  const teamMemberId = asString(segment?.team_member_id)
  return {
    id,
    status: normalizeStatus(asString(booking.status)),
    startAtIso,
    locationId: asString(booking.location_id),
    customerId: asString(booking.customer_id),
    customerNote: asString(booking.customer_note),
    sellerNote: asString(booking.seller_note),
    source: asString(booking.source),
    createdAtIso: normalizeIso(asString(booking.created_at)),
    updatedAtIso: normalizeIso(asString(booking.updated_at)),
    serviceVariationId,
    teamMemberId,
    durationMinutes: asNumber(segment?.duration_minutes),
    slotKey: buildSlotKey(startAtIso, serviceVariationId, teamMemberId),
  }
}

function shouldSkipByEventId(existingEventId: string | null | undefined, eventId: string | undefined) {
  return Boolean(eventId && existingEventId && existingEventId === eventId)
}

function nextBookingStatus(input: {
  existingStatus?: string
  squareStatus: string | null
  eventType?: string
  didReschedule: boolean
}) {
  if (isCancelledStatus(input.squareStatus, input.eventType)) return "cancelled"
  if (input.didReschedule) return "rescheduled"
  return input.existingStatus || "booked_no_payment"
}

function buildBookingUpdate(
  existing: ExistingBookingDoc,
  booking: NormalizedSquareBooking,
  payload: SquareWebhookPayload,
) {
  const previousStart = bookingStartFromExisting(existing)
  const didReschedule = Boolean(previousStart && booking.startAtIso && previousStart !== booking.startAtIso)
  return {
    bookingStatus: nextBookingStatus({
      existingStatus: existing.bookingStatus,
      squareStatus: booking.status,
      eventType: payload.type,
      didReschedule,
    }),
    squareBookingStatus: booking.status,
    squareCustomerId: booking.customerId ?? existing.squareCustomerId ?? null,
    squareBookingStartAtIso: booking.startAtIso ?? existing.squareBookingStartAtIso ?? null,
    squareServiceVariationId: booking.serviceVariationId ?? existing.squareServiceVariationId ?? null,
    squareTeamMemberId: booking.teamMemberId ?? existing.squareTeamMemberId ?? null,
    selectedSlots: booking.slotKey ? [booking.slotKey] : existing.selectedSlots ?? [],
    summary: {
      when: booking.startAtIso ? [booking.startAtIso] : existing.summary?.when ?? [],
      where: existing.summary?.where ?? ["Square booking"],
      what: existing.summary?.what ?? [booking.serviceVariationId || "Square booking"],
    },
    ...(didReschedule ? { lastRescheduledAtIso: booking.updatedAtIso || payload.created_at || new Date().toISOString() } : {}),
    squareWebhookLastEventId: payload.event_id || null,
    squareWebhookLastEventType: payload.type || null,
    updatedAt: FieldValue.serverTimestamp(),
  }
}

function buildConsultationUpdate(
  existing: ExistingConsultationDoc,
  booking: NormalizedSquareBooking,
  payload: SquareWebhookPayload,
) {
  const previousStart = consultationStartFromExisting(existing)
  const didReschedule = Boolean(previousStart && booking.startAtIso && previousStart !== booking.startAtIso)
  return {
    squareConsultationStatus: booking.status,
    squareCustomerId: booking.customerId ?? existing.squareCustomerId ?? null,
    scheduledAtIso: booking.startAtIso ?? existing.scheduledAtIso ?? existing.consultationDateTime ?? null,
    consultationDateTime: booking.startAtIso ?? existing.consultationDateTime ?? existing.scheduledAtIso ?? null,
    locationId: booking.locationId ?? existing.locationId ?? null,
    squareServiceVariationId: booking.serviceVariationId,
    squareTeamMemberId: booking.teamMemberId,
    ...(didReschedule
      ? {
          rescheduleCount: Number(existing.rescheduleCount || 0) + 1,
          lastRescheduledAtIso: booking.updatedAtIso || payload.created_at || new Date().toISOString(),
          lastRescheduledBy: "square-webhook",
          lastRescheduleReason: payload.type || "booking.updated",
        }
      : {}),
    squareWebhookLastEventId: payload.event_id || null,
    squareWebhookLastEventType: payload.type || null,
    updatedAt: FieldValue.serverTimestamp(),
  }
}

function isConsultationVariation(serviceVariationId: string | null, consultationVariationIds: string[]) {
  if (!serviceVariationId) return false
  return consultationVariationIds.includes(serviceVariationId)
}

async function createReviewStub(
  db: Firestore,
  booking: NormalizedSquareBooking,
  payload: SquareWebhookPayload,
  consultationVariationIds: string[],
) {
  const nowIso = new Date().toISOString()
  const needsReviewFields = {
    needsAdminReview: true,
    reviewReason: "unmatched_square_webhook_booking",
    squareWebhookLastEventId: payload.event_id || null,
    squareWebhookLastEventType: payload.type || null,
    squareWebhookReceivedAtIso: nowIso,
    squareCustomerId: booking.customerId,
    squareServiceVariationId: booking.serviceVariationId,
    squareTeamMemberId: booking.teamMemberId,
    squareBookingStartAtIso: booking.startAtIso,
    squareLocationId: booking.locationId,
    squareCustomerNote: booking.customerNote,
    squareSellerNote: booking.sellerNote,
    squareBookingSource: booking.source,
  }

  if (isConsultationVariation(booking.serviceVariationId, consultationVariationIds)) {
    await db.collection(CONSULTATIONS_COLLECTION).add({
      clientId: booking.customerId || "",
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      dogName: "",
      connectMethod: "square-webhook-import",
      consultationDateTime: booking.startAtIso,
      consultationSlotKey: booking.slotKey,
      scheduledAtIso: booking.startAtIso,
      locationId: booking.locationId,
      locationLabel: null,
      status: isCancelledStatus(booking.status, payload.type) ? "expired" : "scheduled",
      recommendedClassTypes: [],
      staffNotes: "Imported from Square webhook. Review and link this consultation.",
      bookingAccess: null,
      initialPaymentIntentId: null,
      initialPaymentStatus: "not_required",
      squareCustomerId: booking.customerId,
      squareConsultationBookingId: booking.id,
      squareConsultationStatus: booking.status,
      source: "square-webhook-review",
      submittedAtIso: booking.createdAtIso || nowIso,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      ...needsReviewFields,
    })
    return
  }

  await db.collection(BOOKINGS_COLLECTION).add({
    consultationId: "",
    clientId: booking.customerId || "",
    clientName: "",
    clientEmail: "",
    dogName: "",
    selectedSlots: booking.slotKey ? [booking.slotKey] : [],
    selectedClassTypes: [],
    summary: {
      when: booking.startAtIso ? [booking.startAtIso] : [],
      where: ["Square booking (review needed)"],
      what: [booking.serviceVariationId || "Square booking"],
    },
    paymentIntentId: null,
    paymentStatus: "not_required",
    amountCents: 0,
    currency: "cad",
    paidAtIso: null,
    bookingStatus: isCancelledStatus(booking.status, payload.type) ? "cancelled" : "booked_no_payment",
    squareBookingId: booking.id,
    squareBookingStatus: booking.status,
    squareServiceVariationId: booking.serviceVariationId,
    squareTeamMemberId: booking.teamMemberId,
    source: "square-webhook-review",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    ...needsReviewFields,
  })
}

export async function reconcileSquareBookingWebhook(
  db: Firestore,
  payload: SquareWebhookPayload,
  input: { retrieveBooking: RetrieveSquareBooking },
) {
  if (!isBookingLifecycleEvent(payload.type)) return

  const inlineBooking = extractInlineBooking(payload)
  const bookingId = asString(inlineBooking?.id)
  if (!bookingId) return

  let canonical = inlineBooking
  try {
    const response = await input.retrieveBooking(bookingId)
    if (response.booking?.id) canonical = response.booking
  } catch {
    /* fall back to inline webhook payload */
  }

  const booking = canonical ? normalizeSquareBooking(canonical) : null
  if (!booking) return

  const [bookingSnap, consultationSnap] = await Promise.all([
    db.collection(BOOKINGS_COLLECTION).where("squareBookingId", "==", booking.id).limit(1).get(),
    db.collection(CONSULTATIONS_COLLECTION).where("squareConsultationBookingId", "==", booking.id).limit(1).get(),
  ])

  let matched = false

  if (!bookingSnap.empty) {
    const ref = bookingSnap.docs[0].ref
    const existing = bookingSnap.docs[0].data() as ExistingBookingDoc
    matched = true
    if (!shouldSkipByEventId(existing.squareWebhookLastEventId, payload.event_id)) {
      await ref.set(buildBookingUpdate(existing, booking, payload), { merge: true })
    }
  }

  if (!consultationSnap.empty) {
    const ref = consultationSnap.docs[0].ref
    const existing = consultationSnap.docs[0].data() as ExistingConsultationDoc
    matched = true
    if (!shouldSkipByEventId(existing.squareWebhookLastEventId, payload.event_id)) {
      await ref.set(buildConsultationUpdate(existing, booking, payload), { merge: true })
    }
  }

  if (matched) return

  const consultationVariationIds = await getConsultationServiceVariationIds().catch(() => [])
  await createReviewStub(db, booking, payload, consultationVariationIds)
}
