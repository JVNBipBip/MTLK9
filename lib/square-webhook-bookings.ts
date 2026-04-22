import { FieldValue, type Firestore } from "firebase-admin/firestore"
import { BOOKINGS_COLLECTION, CONSULTATIONS_COLLECTION, SQUARE_CUSTOMERS_COLLECTION } from "@/lib/domain"
import { getConsultationServiceVariationIds } from "@/lib/square-service-config"
import type { SquareBooking, SquareCustomer } from "@/lib/square"

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
type RetrieveSquareCustomer = (customerId: string) => Promise<{ customer?: SquareCustomer }>

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
  squareConsultationBookingId?: string | null
  locationId?: string | null
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  status?: string
  dogName?: string
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

export type EnrichedSquareCustomer = {
  id: string | null
  name: string | null
  email: string | null
  phone: string | null
}

export type ReconcileAction =
  | "skipped_non_lifecycle"
  | "skipped_no_booking"
  | "skipped_duplicate_event"
  | "updated_booking"
  | "updated_consultation"
  | "merged_existing_consultation"
  | "created_consultation_stub"
  | "created_booking_stub"

export type ReconcileOutcome = {
  action: ReconcileAction
  eventId: string | null
  eventType: string | null
  squareBookingId: string | null
  docId: string | null
  collection: "consultations" | "bookings" | null
  matchedBy: "square_booking_id" | "email" | "phone" | "square_customer_id" | null
  clientName: string | null
  clientEmail: string | null
  clientPhone: string | null
  squareCustomerId: string | null
  isConsultation: boolean
  error?: string
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

/** Lowercase + trim for email equality checks. Returns null if empty. */
export function normalizeEmailForMatch(email: string | null | undefined): string | null {
  if (!email) return null
  const trimmed = email.trim().toLowerCase()
  return trimmed || null
}

/**
 * Normalize phone to last 10 digits for equality checks.
 * Handles "+1 (514) 555-1234", "5145551234", "+15145551234" → "5145551234".
 * Returns null if we don't have at least 7 digits to work with.
 */
export function normalizePhoneForMatch(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D+/g, "")
  if (digits.length < 7) return null
  return digits.length > 10 ? digits.slice(-10) : digits
}

function combineCustomerName(customer: SquareCustomer | null | undefined): string | null {
  if (!customer) return null
  const parts = [customer.given_name, customer.family_name]
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter((p) => p.length > 0)
  if (parts.length > 0) return parts.join(" ")
  const nickname = typeof customer.nickname === "string" ? customer.nickname.trim() : ""
  if (nickname) return nickname
  const company = typeof customer.company_name === "string" ? customer.company_name.trim() : ""
  return company || null
}

export function normalizeSquareCustomer(customer: SquareCustomer | null | undefined): EnrichedSquareCustomer {
  return {
    id: asString(customer?.id),
    name: combineCustomerName(customer),
    email: normalizeEmailForMatch(asString(customer?.email_address)),
    phone: asString(customer?.phone_number),
  }
}

/**
 * Combine two enrichment sources (e.g. local square_customers mirror + Square API)
 * taking the first non-empty value per field, with `primary` winning.
 */
export function combineEnrichment(
  primary: EnrichedSquareCustomer,
  fallback: EnrichedSquareCustomer,
): EnrichedSquareCustomer {
  return {
    id: primary.id || fallback.id || null,
    name: primary.name || fallback.name || null,
    email: primary.email || fallback.email || null,
    phone: primary.phone || fallback.phone || null,
  }
}

/**
 * Read the mirrored square_customers doc (populated by the "Sync Square customers"
 * button) and project it into the same shape as a live Square API lookup so we
 * can avoid the extra API call when the mirror already has what we need.
 */
export async function lookupLocalSquareCustomer(
  db: Firestore,
  customerId: string | null,
): Promise<EnrichedSquareCustomer> {
  if (!customerId) return { id: null, name: null, email: null, phone: null }
  try {
    const snap = await db.collection(SQUARE_CUSTOMERS_COLLECTION).doc(customerId).get()
    if (!snap.exists) return { id: customerId, name: null, email: null, phone: null }
    const data = snap.data() as
      | {
          displayName?: unknown
          givenName?: unknown
          familyName?: unknown
          email?: unknown
          emailLower?: unknown
          phone?: unknown
        }
      | undefined
    const name =
      combineCustomerName({
        given_name: asString(data?.givenName) || undefined,
        family_name: asString(data?.familyName) || undefined,
      }) ||
      asString(data?.displayName)
    return {
      id: customerId,
      name: name || null,
      email:
        normalizeEmailForMatch(asString(data?.emailLower)) ||
        normalizeEmailForMatch(asString(data?.email)),
      phone: asString(data?.phone),
    }
  } catch {
    return { id: customerId, name: null, email: null, phone: null }
  }
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

function buildMergeIntoExistingConsultation(
  existing: ExistingConsultationDoc,
  booking: NormalizedSquareBooking,
  enrichedCustomer: EnrichedSquareCustomer,
  payload: SquareWebhookPayload,
) {
  const nextStart =
    booking.startAtIso ?? existing.scheduledAtIso ?? existing.consultationDateTime ?? null
  const baseStatus = existing.status || "scheduled"
  const resolvedStatus = isCancelledStatus(booking.status, payload.type)
    ? "expired"
    : baseStatus === "intake_submitted"
      ? "scheduled"
      : baseStatus

  return {
    squareConsultationBookingId: booking.id,
    squareConsultationStatus: booking.status,
    squareCustomerId: booking.customerId ?? enrichedCustomer.id ?? existing.squareCustomerId ?? null,
    scheduledAtIso: nextStart,
    consultationDateTime: nextStart,
    locationId: booking.locationId ?? existing.locationId ?? null,
    squareServiceVariationId: booking.serviceVariationId,
    squareTeamMemberId: booking.teamMemberId,
    status: resolvedStatus,
    ...(existing.clientName ? {} : enrichedCustomer.name ? { clientName: enrichedCustomer.name } : {}),
    ...(existing.clientEmail ? {} : enrichedCustomer.email ? { clientEmail: enrichedCustomer.email } : {}),
    ...(existing.clientPhone ? {} : enrichedCustomer.phone ? { clientPhone: enrichedCustomer.phone } : {}),
    squareWebhookLastEventId: payload.event_id || null,
    squareWebhookLastEventType: payload.type || null,
    squareWebhookMergedAtIso: new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp(),
  }
}

function buildConsultationStub(
  booking: NormalizedSquareBooking,
  enrichedCustomer: EnrichedSquareCustomer,
  payload: SquareWebhookPayload,
) {
  const nowIso = new Date().toISOString()
  return {
    clientId: enrichedCustomer.email || booking.customerId || "",
    clientName: enrichedCustomer.name || "",
    clientEmail: enrichedCustomer.email || "",
    clientPhone: enrichedCustomer.phone || "",
    dogName: "",
    connectMethod: "square-webhook-import",
    consultationDateTime: booking.startAtIso,
    consultationSlotKey: booking.slotKey,
    scheduledAtIso: booking.startAtIso,
    locationId: booking.locationId,
    locationLabel: null as string | null,
    status: isCancelledStatus(booking.status, payload.type) ? "expired" : "scheduled",
    recommendedClassTypes: [] as string[],
    staffNotes: "Imported from Square webhook. Review and link this consultation.",
    bookingAccess: null,
    initialPaymentIntentId: null,
    initialPaymentStatus: "not_required",
    squareCustomerId: booking.customerId ?? enrichedCustomer.id ?? null,
    squareConsultationBookingId: booking.id,
    squareConsultationStatus: booking.status,
    source: "square-webhook-review",
    submittedAtIso: booking.createdAtIso || nowIso,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    needsAdminReview: true,
    reviewReason: "unmatched_square_webhook_booking",
    squareWebhookLastEventId: payload.event_id || null,
    squareWebhookLastEventType: payload.type || null,
    squareWebhookReceivedAtIso: nowIso,
    squareServiceVariationId: booking.serviceVariationId,
    squareTeamMemberId: booking.teamMemberId,
    squareBookingStartAtIso: booking.startAtIso,
    squareLocationId: booking.locationId,
    squareCustomerNote: booking.customerNote,
    squareSellerNote: booking.sellerNote,
    squareBookingSource: booking.source,
  }
}

function buildBookingStub(
  booking: NormalizedSquareBooking,
  enrichedCustomer: EnrichedSquareCustomer,
  payload: SquareWebhookPayload,
) {
  const nowIso = new Date().toISOString()
  return {
    consultationId: "",
    clientId: enrichedCustomer.email || booking.customerId || "",
    clientName: enrichedCustomer.name || "",
    clientEmail: enrichedCustomer.email || "",
    dogName: "",
    selectedSlots: booking.slotKey ? [booking.slotKey] : [],
    selectedClassTypes: [] as string[],
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
    needsAdminReview: true,
    reviewReason: "unmatched_square_webhook_booking",
    squareWebhookLastEventId: payload.event_id || null,
    squareWebhookLastEventType: payload.type || null,
    squareWebhookReceivedAtIso: nowIso,
    squareCustomerId: booking.customerId ?? enrichedCustomer.id ?? null,
    squareBookingStartAtIso: booking.startAtIso,
    squareLocationId: booking.locationId,
    squareCustomerNote: booking.customerNote,
    squareSellerNote: booking.sellerNote,
    squareBookingSource: booking.source,
  }
}

function isConsultationVariation(serviceVariationId: string | null, consultationVariationIds: string[]) {
  if (!serviceVariationId) return false
  return consultationVariationIds.includes(serviceVariationId)
}

async function findConsultationMatch(
  db: Firestore,
  enriched: EnrichedSquareCustomer,
): Promise<
  | { id: string; data: ExistingConsultationDoc; matchedBy: "email" | "phone" | "square_customer_id" }
  | null
> {
  // Prefer matching on squareCustomerId first — it's the strongest signal and
  // survives email/phone formatting differences.
  if (enriched.id) {
    const snap = await db
      .collection(CONSULTATIONS_COLLECTION)
      .where("squareCustomerId", "==", enriched.id)
      .limit(5)
      .get()
    const best = pickBestCandidate(snap.docs)
    if (best) {
      return {
        id: best.id,
        data: best.data as ExistingConsultationDoc,
        matchedBy: "square_customer_id",
      }
    }
  }
  if (enriched.email) {
    const snap = await db
      .collection(CONSULTATIONS_COLLECTION)
      .where("clientEmail", "==", enriched.email)
      .limit(5)
      .get()
    const best = pickBestCandidate(snap.docs)
    if (best) {
      return { id: best.id, data: best.data as ExistingConsultationDoc, matchedBy: "email" }
    }
  }
  if (enriched.phone) {
    const normalizedPhone = normalizePhoneForMatch(enriched.phone)
    if (normalizedPhone) {
      const snap = await db
        .collection(CONSULTATIONS_COLLECTION)
        .where("clientPhone", "==", enriched.phone)
        .limit(5)
        .get()
      const best = pickBestCandidate(snap.docs)
      if (best) {
        return { id: best.id, data: best.data as ExistingConsultationDoc, matchedBy: "phone" }
      }
    }
  }
  return null
}

type DocLike = {
  id: string
  data: () => Record<string, unknown>
}

/**
 * Prefer a consultation that does NOT already have a squareConsultationBookingId
 * (so we don't overwrite an existing linkage). Otherwise return the first candidate.
 */
function pickBestCandidate(docs: DocLike[]): { id: string; data: Record<string, unknown> } | null {
  if (!docs.length) return null
  const unlinked = docs.find((d) => {
    const id = (d.data() as ExistingConsultationDoc).squareConsultationBookingId
    return !id
  })
  const chosen = unlinked || docs[0]
  return { id: chosen.id, data: chosen.data() }
}

function outcome(partial: Partial<ReconcileOutcome> & Pick<ReconcileOutcome, "action">): ReconcileOutcome {
  return {
    eventId: partial.eventId ?? null,
    eventType: partial.eventType ?? null,
    squareBookingId: partial.squareBookingId ?? null,
    docId: partial.docId ?? null,
    collection: partial.collection ?? null,
    matchedBy: partial.matchedBy ?? null,
    clientName: partial.clientName ?? null,
    clientEmail: partial.clientEmail ?? null,
    clientPhone: partial.clientPhone ?? null,
    squareCustomerId: partial.squareCustomerId ?? null,
    isConsultation: partial.isConsultation ?? false,
    error: partial.error,
    action: partial.action,
  }
}

async function safeRetrieveCustomer(
  retrieveCustomer: RetrieveSquareCustomer | undefined,
  customerId: string | null,
): Promise<EnrichedSquareCustomer> {
  if (!retrieveCustomer || !customerId) {
    return { id: customerId, name: null, email: null, phone: null }
  }
  try {
    const response = await retrieveCustomer(customerId)
    return normalizeSquareCustomer(response.customer || null)
  } catch {
    return { id: customerId, name: null, email: null, phone: null }
  }
}

export async function reconcileSquareBookingWebhook(
  db: Firestore,
  payload: SquareWebhookPayload,
  input: {
    retrieveBooking: RetrieveSquareBooking
    retrieveCustomer?: RetrieveSquareCustomer
  },
): Promise<ReconcileOutcome> {
  const eventId = payload.event_id || null
  const eventType = payload.type || null

  if (!isBookingLifecycleEvent(payload.type)) {
    return outcome({ action: "skipped_non_lifecycle", eventId, eventType })
  }

  const inlineBooking = extractInlineBooking(payload)
  const bookingId = asString(inlineBooking?.id)
  if (!bookingId) {
    return outcome({ action: "skipped_no_booking", eventId, eventType })
  }

  let canonical = inlineBooking
  try {
    const response = await input.retrieveBooking(bookingId)
    if (response.booking?.id) canonical = response.booking
  } catch {
    /* fall back to inline webhook payload */
  }

  const booking = canonical ? normalizeSquareBooking(canonical) : null
  if (!booking) {
    return outcome({ action: "skipped_no_booking", eventId, eventType, squareBookingId: bookingId })
  }

  const [bookingSnap, consultationSnap] = await Promise.all([
    db.collection(BOOKINGS_COLLECTION).where("squareBookingId", "==", booking.id).limit(1).get(),
    db.collection(CONSULTATIONS_COLLECTION).where("squareConsultationBookingId", "==", booking.id).limit(1).get(),
  ])

  if (!bookingSnap.empty) {
    const ref = bookingSnap.docs[0].ref
    const existing = bookingSnap.docs[0].data() as ExistingBookingDoc
    if (shouldSkipByEventId(existing.squareWebhookLastEventId, payload.event_id)) {
      return outcome({
        action: "skipped_duplicate_event",
        eventId,
        eventType,
        squareBookingId: booking.id,
        docId: bookingSnap.docs[0].id,
        collection: "bookings",
        matchedBy: "square_booking_id",
        squareCustomerId: booking.customerId,
      })
    }
    await ref.set(buildBookingUpdate(existing, booking, payload), { merge: true })
    return outcome({
      action: "updated_booking",
      eventId,
      eventType,
      squareBookingId: booking.id,
      docId: bookingSnap.docs[0].id,
      collection: "bookings",
      matchedBy: "square_booking_id",
      squareCustomerId: booking.customerId,
    })
  }

  if (!consultationSnap.empty) {
    const ref = consultationSnap.docs[0].ref
    const existing = consultationSnap.docs[0].data() as ExistingConsultationDoc
    if (shouldSkipByEventId(existing.squareWebhookLastEventId, payload.event_id)) {
      return outcome({
        action: "skipped_duplicate_event",
        eventId,
        eventType,
        squareBookingId: booking.id,
        docId: consultationSnap.docs[0].id,
        collection: "consultations",
        matchedBy: "square_booking_id",
        squareCustomerId: booking.customerId,
        clientEmail: existing.clientEmail || null,
        clientName: existing.clientName || null,
        clientPhone: existing.clientPhone || null,
        isConsultation: true,
      })
    }
    await ref.set(buildConsultationUpdate(existing, booking, payload), { merge: true })
    return outcome({
      action: "updated_consultation",
      eventId,
      eventType,
      squareBookingId: booking.id,
      docId: consultationSnap.docs[0].id,
      collection: "consultations",
      matchedBy: "square_booking_id",
      squareCustomerId: booking.customerId,
      clientEmail: existing.clientEmail || null,
      clientName: existing.clientName || null,
      clientPhone: existing.clientPhone || null,
      isConsultation: true,
    })
  }

  // No direct Square-booking-id match. Enrich customer data (preferring the local
  // square_customers mirror, falling back to a live Square API call) and try to merge
  // into an existing consultation by squareCustomerId / email / phone before creating
  // a new stub.
  const [localCustomer, liveCustomer] = await Promise.all([
    lookupLocalSquareCustomer(db, booking.customerId),
    safeRetrieveCustomer(input.retrieveCustomer, booking.customerId),
  ])
  const enrichedCustomer = combineEnrichment(localCustomer, liveCustomer)

  const consultationVariationIds = await getConsultationServiceVariationIds().catch(() => [] as string[])
  const isConsultation = isConsultationVariation(booking.serviceVariationId, consultationVariationIds)

  if (isConsultation) {
    const match = await findConsultationMatch(db, enrichedCustomer)
    if (match) {
      await db
        .collection(CONSULTATIONS_COLLECTION)
        .doc(match.id)
        .set(buildMergeIntoExistingConsultation(match.data, booking, enrichedCustomer, payload), { merge: true })
      return outcome({
        action: "merged_existing_consultation",
        eventId,
        eventType,
        squareBookingId: booking.id,
        docId: match.id,
        collection: "consultations",
        matchedBy: match.matchedBy,
        squareCustomerId: booking.customerId ?? enrichedCustomer.id ?? null,
        clientEmail: match.data.clientEmail || enrichedCustomer.email || null,
        clientName: match.data.clientName || enrichedCustomer.name || null,
        clientPhone: match.data.clientPhone || enrichedCustomer.phone || null,
        isConsultation: true,
      })
    }

    const ref = await db.collection(CONSULTATIONS_COLLECTION).add(buildConsultationStub(booking, enrichedCustomer, payload))
    return outcome({
      action: "created_consultation_stub",
      eventId,
      eventType,
      squareBookingId: booking.id,
      docId: ref.id,
      collection: "consultations",
      matchedBy: null,
      squareCustomerId: booking.customerId ?? enrichedCustomer.id ?? null,
      clientEmail: enrichedCustomer.email,
      clientName: enrichedCustomer.name,
      clientPhone: enrichedCustomer.phone,
      isConsultation: true,
    })
  }

  const ref = await db.collection(BOOKINGS_COLLECTION).add(buildBookingStub(booking, enrichedCustomer, payload))
  return outcome({
    action: "created_booking_stub",
    eventId,
    eventType,
    squareBookingId: booking.id,
    docId: ref.id,
    collection: "bookings",
    matchedBy: null,
    squareCustomerId: booking.customerId ?? enrichedCustomer.id ?? null,
    clientEmail: enrichedCustomer.email,
    clientName: enrichedCustomer.name,
    clientPhone: enrichedCustomer.phone,
    isConsultation: false,
  })
}
