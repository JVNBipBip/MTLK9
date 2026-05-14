import { FieldValue, type DocumentReference, type Firestore } from "firebase-admin/firestore"
import type { ClassSessionRecord } from "@/lib/domain"
import { CLASS_SESSIONS_COLLECTION, CLIENTS_COLLECTION } from "@/lib/domain"
import {
  canonicalGroupClassTypeId,
  parseSingleSessionSeriesId,
  effectiveSeriesIdForSession,
} from "@/lib/group-class-programs"
import { programLabel } from "@/lib/programs"
import { CLIENT_BOOKINGS_SUBCOLLECTION, listClientSubcollectionDocs, queryClientSubcollectionDocsByField } from "@/lib/client-records"
import { notifyStaffOfBooking } from "@/lib/staff-booking-notify"

export const GROUP_SERIES_BOOKING_SOURCE = "training-portal-group-series"
export const GROUP_CLASS_REQUEST_SOURCE = "training-portal-group-class-request"

const HOLD_MS = 30 * 60 * 1000

function createdAtMs(data: { createdAt?: { toDate?: () => Date } }): number {
  const ts = data.createdAt?.toDate?.()
  if (!ts) return 0
  return ts.getTime()
}

export async function findGroupClassBookingRef(db: Firestore, bookingId: string) {
  const docs = await queryClientSubcollectionDocsByField(db, CLIENT_BOOKINGS_SUBCOLLECTION, "id", bookingId, 1)
  if (docs[0]) return docs[0].ref
  try {
    const clientsSnap = await db.collection(CLIENTS_COLLECTION).limit(500).get()
    const refs = clientsSnap.docs.map((doc) => doc.ref.collection(CLIENT_BOOKINGS_SUBCOLLECTION).doc(bookingId))
    const snaps = refs.length > 0 ? await db.getAll(...refs) : []
    const found = snaps.find((doc) => doc.exists)
    if (found) return found.ref
  } catch {
    return null
  }
  return null
}

function mirroredBookingRefs(
  db: Firestore,
  primaryPath: string,
  clientCollectionPath?: string,
) {
  const refs = new Map<string, DocumentReference>()
  refs.set(primaryPath, db.doc(primaryPath))
  if (clientCollectionPath) refs.set(clientCollectionPath, db.doc(clientCollectionPath))
  return [...refs.values()]
}

/** Release reserved seats for abandoned group checkouts (no composite index). */
export async function releaseStaleGroupSeriesHolds(db: Firestore) {
  const nestedDocs = (await listClientSubcollectionDocs(db, CLIENT_BOOKINGS_SUBCOLLECTION, 150))
    .filter((doc) => doc.data().source === GROUP_SERIES_BOOKING_SOURCE)
    .slice(0, 100)
  const cutoff = Date.now() - HOLD_MS
  const seen = new Set<string>()
  for (const doc of nestedDocs) {
    if (seen.has(doc.id)) continue
    seen.add(doc.id)
    const d = doc.data() as {
      paymentStatus?: string
      selectedSessionIds?: string[]
      createdAt?: { toDate?: () => Date }
    }
    if (d.paymentStatus !== "pending_payment") continue
    if (createdAtMs(d) > cutoff) continue
    await releaseHoldsForGroupBooking(db, doc.id)
  }
}

export async function releaseHoldsForGroupBooking(db: Firestore, bookingId: string) {
  const bookingRef = await findGroupClassBookingRef(db, bookingId)
  if (!bookingRef) return
  await db.runTransaction(async (t) => {
    // Firestore requires all reads before any writes in a transaction, so
    // read the booking first, then batch-read every session, then emit writes.
    const bSnap = await t.get(bookingRef)
    if (!bSnap.exists) return
    const bd = bSnap.data() as { paymentStatus?: string; selectedSessionIds?: string[]; clientCollectionPath?: string }
    if (bd.paymentStatus !== "pending_payment") return
    const sessionIds = bd.selectedSessionIds || []
    const sessionRefs = sessionIds.map((sid) => db.collection(CLASS_SESSIONS_COLLECTION).doc(sid))
    const sessionSnaps = sessionRefs.length > 0 ? await t.getAll(...sessionRefs) : []

    for (const sSnap of sessionSnaps) {
      if (!sSnap.exists) continue
      const sd = sSnap.data() as { reservedCount?: number }
      const reserved = Math.max(0, Number(sd.reservedCount ?? 0) - 1)
      t.update(sSnap.ref, { reservedCount: reserved, updatedAt: FieldValue.serverTimestamp() })
    }
    const patch = {
      bookingStatus: "cancelled",
      paymentStatus: "cancelled",
      updatedAt: FieldValue.serverTimestamp(),
    }
    for (const ref of mirroredBookingRefs(db, bookingRef.path, bd.clientCollectionPath)) {
      t.set(ref, patch, { merge: true })
    }
  })
}

export async function confirmGroupClassRequest(db: Firestore, bookingId: string) {
  const bookingRef = await findGroupClassBookingRef(db, bookingId)
  if (!bookingRef) return
  await db.runTransaction(async (t) => {
    const bSnap = await t.get(bookingRef)
    if (!bSnap.exists) return
    const bd = bSnap.data() as {
      source?: string
      bookingStatus?: string
      selectedSessionIds?: string[]
      clientCollectionPath?: string
    }
    if (bd.source !== GROUP_CLASS_REQUEST_SOURCE) return
    if (bd.bookingStatus === "confirmed") return
    if (bd.bookingStatus === "cancelled") return

    const sessionIds = bd.selectedSessionIds || []
    const sessionRefs = sessionIds.map((sid) => db.collection(CLASS_SESSIONS_COLLECTION).doc(sid))
    const sessionSnaps = sessionRefs.length > 0 ? await t.getAll(...sessionRefs) : []
    for (const sSnap of sessionSnaps) {
      if (!sSnap.exists) continue
      const sd = sSnap.data() as { bookedCount?: number; reservedCount?: number }
      const booked = Number(sd.bookedCount ?? 0)
      const reserved = Math.max(0, Number(sd.reservedCount ?? 0) - 1)
      t.update(sSnap.ref, {
        bookedCount: booked + 1,
        reservedCount: reserved,
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
    const patch = {
      bookingStatus: "confirmed",
      paymentStatus: "not_required",
      requestStatus: "added_to_square",
      adminActionRequired: false,
      addedToSquareAtIso: new Date().toISOString(),
      updatedAt: FieldValue.serverTimestamp(),
    }
    for (const ref of mirroredBookingRefs(db, bookingRef.path, bd.clientCollectionPath)) {
      t.set(ref, patch, { merge: true })
    }
  })
}

export async function declineGroupClassRequest(db: Firestore, bookingId: string) {
  const bookingRef = await findGroupClassBookingRef(db, bookingId)
  if (!bookingRef) return
  await db.runTransaction(async (t) => {
    const bSnap = await t.get(bookingRef)
    if (!bSnap.exists) return
    const bd = bSnap.data() as {
      source?: string
      bookingStatus?: string
      selectedSessionIds?: string[]
      clientCollectionPath?: string
    }
    if (bd.source !== GROUP_CLASS_REQUEST_SOURCE) return
    if (bd.bookingStatus === "cancelled") return

    const sessionIds = bd.selectedSessionIds || []
    const sessionRefs = sessionIds.map((sid) => db.collection(CLASS_SESSIONS_COLLECTION).doc(sid))
    const sessionSnaps = sessionRefs.length > 0 ? await t.getAll(...sessionRefs) : []
    for (const sSnap of sessionSnaps) {
      if (!sSnap.exists) continue
      const sd = sSnap.data() as { reservedCount?: number }
      const reserved = Math.max(0, Number(sd.reservedCount ?? 0) - 1)
      t.update(sSnap.ref, { reservedCount: reserved, updatedAt: FieldValue.serverTimestamp() })
    }
    const patch = {
      bookingStatus: "cancelled",
      paymentStatus: "cancelled",
      requestStatus: "declined",
      adminActionRequired: false,
      declinedAtIso: new Date().toISOString(),
      updatedAt: FieldValue.serverTimestamp(),
    }
    for (const ref of mirroredBookingRefs(db, bookingRef.path, bd.clientCollectionPath)) {
      t.set(ref, patch, { merge: true })
    }
  })
}

export type SessionForSeries = Pick<
  ClassSessionRecord,
  | "id"
  | "classType"
  | "title"
  | "startsAtIso"
  | "endsAtIso"
  | "locationLabel"
  | "priceAmountCents"
  | "priceCurrency"
  | "capacity"
  | "bookedCount"
  | "reservedCount"
  | "isActive"
  | "seriesId"
  | "coachId"
  | "coachLabel"
>

export type GroupSeriesListItem = {
  seriesId: string
  classType: string
  programLabel: string
  /** Square team member id when every session in the series shares one coach; otherwise omitted. */
  coachId?: string | null
  /** Staff-entered coach name when sessions share one labeled coach. */
  coachLabel?: string | null
  sessionCount: number
  spotsRemaining: number
  sessions: Array<{
    id: string
    title: string
    startsAtIso: string
    endsAtIso: string
    locationLabel: string
    priceAmountCents: number | null
    priceCurrency: string | null
    spotsRemaining: number
  }>
}

export function spotsRemainingForSessions(sessions: SessionForSeries[]): number {
  if (sessions.length === 0) return 0
  return Math.min(
    ...sessions.map((s) => {
      const cap = Number(s.capacity ?? 0)
      const booked = Number(s.bookedCount ?? 0)
      const reserved = Number(s.reservedCount ?? 0)
      return Math.max(0, cap - booked - reserved)
    }),
  )
}

function spotsRemainingForSession(session: SessionForSeries): number {
  const cap = Number(session.capacity ?? 0)
  const booked = Number(session.bookedCount ?? 0)
  const reserved = Number(session.reservedCount ?? 0)
  return Math.max(0, cap - booked - reserved)
}

export async function finalizeGroupSeriesPaymentFromWebhook(
  db: Firestore,
  input: { bookingId: string; squareOrderId: string; amountCents?: number; eventId?: string | null; eventType?: string | null },
) {
  const bookingRef = await findGroupClassBookingRef(db, input.bookingId)
  if (!bookingRef) return
  const paidAtIso = new Date().toISOString()
  const outcome = await db.runTransaction(async (t) => {
    const bSnap = await t.get(bookingRef)
    if (!bSnap.exists) return { finalized: false as const }
    const bd = bSnap.data() as {
      paymentStatus?: string
      source?: string
      selectedSessionIds?: string[]
      clientCollectionPath?: string
      clientId?: string
      clientName?: string
      clientEmail?: string
      dogName?: string
      groupSeriesId?: string
      summary?: { when?: string[]; where?: string[]; what?: string[] }
    }
    if (bd.source !== GROUP_SERIES_BOOKING_SOURCE) return { finalized: false as const }
    if (bd.paymentStatus === "paid") return { finalized: false as const }
    if (bd.paymentStatus !== "pending_payment" && bd.paymentStatus !== "processing") return { finalized: false as const }
    const sessionIds = bd.selectedSessionIds || []
    // Firestore requires all reads before any writes in a transaction, so
    // batch-read every session up front before emitting any updates.
    const sessionRefs = sessionIds.map((sid) => db.collection(CLASS_SESSIONS_COLLECTION).doc(sid))
    const sessionSnaps = sessionRefs.length > 0 ? await t.getAll(...sessionRefs) : []
    for (const sSnap of sessionSnaps) {
      if (!sSnap.exists) continue
      const sd = sSnap.data() as { bookedCount?: number; reservedCount?: number }
      const booked = Number(sd.bookedCount ?? 0)
      const reserved = Math.max(0, Number(sd.reservedCount ?? 0) - 1)
      t.update(sSnap.ref, {
        bookedCount: booked + 1,
        reservedCount: reserved,
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
    const patch = {
      paymentStatus: "paid",
      bookingStatus: "confirmed",
      paidAtIso,
      squareOrderId: input.squareOrderId,
      ...(input.amountCents != null && Number.isFinite(input.amountCents) ? { amountCents: input.amountCents } : {}),
      squareWebhookLastEventId: input.eventId ?? null,
      squareWebhookLastEventType: input.eventType ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    }
    for (const ref of mirroredBookingRefs(db, bookingRef.path, bd.clientCollectionPath)) {
      t.set(ref, patch, { merge: true })
    }
    const clientEmail =
      String(bd.clientEmail || "")
        .trim()
        .toLowerCase() ||
      String(bd.clientId || "")
        .trim()
        .toLowerCase()
    return {
      finalized: true as const,
      notify: {
        kind: "group_series_paid" as const,
        bookingId: input.bookingId,
        clientName: String(bd.clientName || ""),
        clientEmail,
        dogName: String(bd.dogName || ""),
        groupSeriesId: String(bd.groupSeriesId || ""),
        summaryWhen: (bd.summary?.when || []).map(String),
        summaryWhere: (bd.summary?.where || []).map(String),
        summaryWhat: (bd.summary?.what || []).map(String),
      },
    }
  })

  if (outcome.finalized) {
    notifyStaffOfBooking(outcome.notify)
  }
}

/** Loads sessions for a series id, including synthetic `single:{sessionDocId}` cohorts when `seriesId` was omitted in Firestore. */
export async function fetchClassSessionsForSeriesId(
  db: Firestore,
  seriesId: string,
): Promise<Array<{ id: string } & Omit<ClassSessionRecord, "id">>> {
  const col = db.collection(CLASS_SESSIONS_COLLECTION)
  const bySeries = await col.where("seriesId", "==", seriesId).limit(80).get()
  if (!bySeries.empty) {
    return bySeries.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<ClassSessionRecord, "id">) }))
  }
  const orphanId = parseSingleSessionSeriesId(seriesId)
  if (!orphanId) return []
  const doc = await col.doc(orphanId).get()
  if (!doc.exists) return []
  return [{ id: doc.id, ...(doc.data() as Omit<ClassSessionRecord, "id">) }]
}

export function groupSessionsIntoSeriesList(
  raw: SessionForSeries[],
  allowedClassTypes: Set<string>,
  nowIso: string,
  groupProgramSlotOrder?: string[],
): GroupSeriesListItem[] {
  const upcoming = raw.filter((s) => {
    const classType = canonicalGroupClassTypeId(String(s.classType || "").trim())
    return (
      s.isActive !== false &&
      String(s.startsAtIso || "") > nowIso &&
      allowedClassTypes.has(classType)
    )
  })
  const bySeries = new Map<string, SessionForSeries[]>()
  for (const s of upcoming) {
    const key = effectiveSeriesIdForSession(s.id, s.seriesId)
    const arr = bySeries.get(key) || []
    arr.push(s)
    bySeries.set(key, arr)
  }
  const out: GroupSeriesListItem[] = []
  for (const [seriesId, list] of bySeries) {
    const sorted = [...list].sort((a, b) => a.startsAtIso.localeCompare(b.startsAtIso))
    const classTypes = new Set(sorted.map((s) => canonicalGroupClassTypeId(String(s.classType || "").trim())))
    if (classTypes.size !== 1) continue
    const classType = [...classTypes][0]
    if (!classType) continue
    const spots = spotsRemainingForSessions(sorted)
    if (spots <= 0) continue
    const coachKeys = sorted.map((s) => String(s.coachId || "").trim()).filter(Boolean)
    const uniqueCoaches = [...new Set(coachKeys)]
    const coachId = uniqueCoaches.length === 1 ? uniqueCoaches[0]! : null
    const coachNameKeys = sorted.map((s) => String(s.coachLabel || "").trim()).filter(Boolean)
    const uniqueCoachLabels = [...new Set(coachNameKeys)]
    const coachLabel = uniqueCoachLabels.length === 1 ? uniqueCoachLabels[0]! : null
    out.push({
      seriesId,
      classType,
      programLabel: programLabel(classType, groupProgramSlotOrder),
      coachId,
      coachLabel,
      sessionCount: sorted.length,
      spotsRemaining: spots,
      sessions: sorted.map((s) => ({
        id: s.id,
        title: s.title || "",
        startsAtIso: s.startsAtIso,
        endsAtIso: s.endsAtIso,
        locationLabel: s.locationLabel || "",
        priceAmountCents: s.priceAmountCents ?? null,
        priceCurrency: s.priceCurrency ?? null,
        spotsRemaining: spotsRemainingForSession(s),
      })),
    })
  }
  out.sort((a, b) => a.sessions[0].startsAtIso.localeCompare(b.sessions[0].startsAtIso))
  return out
}
