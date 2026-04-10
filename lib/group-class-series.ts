import { FieldValue, type Firestore } from "firebase-admin/firestore"
import type { ClassSessionRecord } from "@/lib/domain"
import { BOOKINGS_COLLECTION, CLASS_SESSIONS_COLLECTION } from "@/lib/domain"
import { programLabel } from "@/lib/programs"

export const GROUP_SERIES_BOOKING_SOURCE = "training-portal-group-series"

const HOLD_MS = 30 * 60 * 1000

function createdAtMs(data: { createdAt?: { toDate?: () => Date } }): number {
  const ts = data.createdAt?.toDate?.()
  if (!ts) return 0
  return ts.getTime()
}

/** Release reserved seats for abandoned group checkouts (no composite index). */
export async function releaseStaleGroupSeriesHolds(db: Firestore) {
  const snap = await db.collection(BOOKINGS_COLLECTION).where("source", "==", GROUP_SERIES_BOOKING_SOURCE).limit(100).get()
  const cutoff = Date.now() - HOLD_MS
  for (const doc of snap.docs) {
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
  const bookingRef = db.collection(BOOKINGS_COLLECTION).doc(bookingId)
  await db.runTransaction(async (t) => {
    const bSnap = await t.get(bookingRef)
    if (!bSnap.exists) return
    const bd = bSnap.data() as { paymentStatus?: string; selectedSessionIds?: string[] }
    if (bd.paymentStatus !== "pending_payment") return
    const sessionIds = bd.selectedSessionIds || []
    for (const sid of sessionIds) {
      const sRef = db.collection(CLASS_SESSIONS_COLLECTION).doc(sid)
      const sSnap = await t.get(sRef)
      if (!sSnap.exists) continue
      const sd = sSnap.data() as { reservedCount?: number }
      const reserved = Math.max(0, Number(sd.reservedCount ?? 0) - 1)
      t.update(sRef, { reservedCount: reserved, updatedAt: FieldValue.serverTimestamp() })
    }
    t.update(bookingRef, {
      bookingStatus: "cancelled",
      paymentStatus: "cancelled",
      updatedAt: FieldValue.serverTimestamp(),
    })
  })
}

export type SessionForSeries = Pick<
  ClassSessionRecord,
  "id" | "classType" | "title" | "startsAtIso" | "endsAtIso" | "locationLabel" | "capacity" | "bookedCount" | "reservedCount" | "isActive" | "seriesId"
>

export type GroupSeriesListItem = {
  seriesId: string
  classType: string
  programLabel: string
  sessionCount: number
  spotsRemaining: number
  sessions: Array<{
    id: string
    title: string
    startsAtIso: string
    endsAtIso: string
    locationLabel: string
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

export async function finalizeGroupSeriesPaymentFromWebhook(
  db: Firestore,
  input: { bookingId: string; squareOrderId: string; amountCents?: number; eventId?: string | null; eventType?: string | null },
) {
  const bookingRef = db.collection(BOOKINGS_COLLECTION).doc(input.bookingId)
  const paidAtIso = new Date().toISOString()
  await db.runTransaction(async (t) => {
    const bSnap = await t.get(bookingRef)
    if (!bSnap.exists) return
    const bd = bSnap.data() as {
      paymentStatus?: string
      source?: string
      selectedSessionIds?: string[]
    }
    if (bd.source !== GROUP_SERIES_BOOKING_SOURCE) return
    if (bd.paymentStatus === "paid") return
    if (bd.paymentStatus !== "pending_payment" && bd.paymentStatus !== "processing") return
    const sessionIds = bd.selectedSessionIds || []
    for (const sid of sessionIds) {
      const sRef = db.collection(CLASS_SESSIONS_COLLECTION).doc(sid)
      const sSnap = await t.get(sRef)
      if (!sSnap.exists) continue
      const sd = sSnap.data() as { bookedCount?: number; reservedCount?: number }
      const booked = Number(sd.bookedCount ?? 0)
      const reserved = Math.max(0, Number(sd.reservedCount ?? 0) - 1)
      t.update(sRef, {
        bookedCount: booked + 1,
        reservedCount: reserved,
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
    t.update(bookingRef, {
      paymentStatus: "paid",
      bookingStatus: "confirmed",
      paidAtIso,
      squareOrderId: input.squareOrderId,
      ...(input.amountCents != null && Number.isFinite(input.amountCents) ? { amountCents: input.amountCents } : {}),
      squareWebhookLastEventId: input.eventId ?? null,
      squareWebhookLastEventType: input.eventType ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    })
  })
}

export function groupSessionsIntoSeriesList(
  raw: SessionForSeries[],
  allowedClassTypes: Set<string>,
  nowIso: string,
  groupProgramSlotOrder?: string[],
): GroupSeriesListItem[] {
  const upcoming = raw.filter(
    (s) =>
      s.isActive !== false &&
      s.seriesId &&
      typeof s.seriesId === "string" &&
      s.startsAtIso > nowIso &&
      allowedClassTypes.has(String(s.classType || "").trim()),
  )
  const bySeries = new Map<string, SessionForSeries[]>()
  for (const s of upcoming) {
    const key = String(s.seriesId)
    const arr = bySeries.get(key) || []
    arr.push(s)
    bySeries.set(key, arr)
  }
  const out: GroupSeriesListItem[] = []
  for (const [seriesId, list] of bySeries) {
    const sorted = [...list].sort((a, b) => a.startsAtIso.localeCompare(b.startsAtIso))
    const classTypes = new Set(sorted.map((s) => String(s.classType || "").trim()))
    if (classTypes.size !== 1) continue
    const classType = [...classTypes][0]
    if (!classType) continue
    const spots = spotsRemainingForSessions(sorted)
    if (spots <= 0) continue
    out.push({
      seriesId,
      classType,
      programLabel: programLabel(classType, groupProgramSlotOrder),
      sessionCount: sorted.length,
      spotsRemaining: spots,
      sessions: sorted.map((s) => ({
        id: s.id,
        title: s.title || "",
        startsAtIso: s.startsAtIso,
        endsAtIso: s.endsAtIso,
        locationLabel: s.locationLabel || "",
      })),
    })
  }
  out.sort((a, b) => a.sessions[0].startsAtIso.localeCompare(b.sessions[0].startsAtIso))
  return out
}
