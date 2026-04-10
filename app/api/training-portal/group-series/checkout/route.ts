import { FieldValue } from "firebase-admin/firestore"
import { NextResponse } from "next/server"
import { BOOKINGS_COLLECTION, CLASS_SESSIONS_COLLECTION, type ClassSessionRecord } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import { GROUP_SERIES_BOOKING_SOURCE, releaseStaleGroupSeriesHolds, releaseHoldsForGroupBooking } from "@/lib/group-class-series"
import { createSquarePaymentLinkForVariation, getCatalogVariationDisplayName } from "@/lib/square"
import { migratedGroupProgramSlotOrder } from "@/lib/group-program-slots"
import { programLabel } from "@/lib/programs"
import { getGroupClassSeriesVariationId, getPrivateServiceVariationIds, getSquareServiceConfig } from "@/lib/square-service-config"
import { loadTrainingPortalContext } from "@/lib/training-portal"

export const runtime = "nodejs"

const HOLD_MS = 30 * 60 * 1000

type Payload = {
  clientEmail?: string
  dogName?: string
  seriesId?: string
}

function normalized(value: string) {
  return value.trim().toLowerCase()
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
  const seriesId = String(payload.seriesId || "").trim()
  if (!clientEmail || !dogName || !seriesId) {
    return NextResponse.json({ error: "clientEmail, dogName and seriesId are required." }, { status: 400 })
  }

  const oneOnOneServiceVariationIds = await getPrivateServiceVariationIds()
  if (oneOnOneServiceVariationIds.length === 0) {
    return NextResponse.json({ error: "Missing one-on-one Square mapping configuration." }, { status: 500 })
  }

  const db = getAdminDb()
  await releaseStaleGroupSeriesHolds(db)

  const portal = await loadTrainingPortalContext({
    clientEmail,
    dogName,
    oneOnOneServiceVariationIds,
  })

  if (!portal.assessmentCompleted) {
    return NextResponse.json({ error: "Assessment must be completed before booking group classes.", code: "assessment_required" }, { status: 403 })
  }

  const dogNorm = normalized(portal.dogName)
  const allowedClassTypes = new Set(portal.allowedGroupClassTypeIds)

  if (allowedClassTypes.size === 0) {
    return NextResponse.json({ error: "No group program access for this dog.", code: "no_group_program_access" }, { status: 403 })
  }

  const sessionsSnap = await db.collection(CLASS_SESSIONS_COLLECTION).where("seriesId", "==", seriesId).limit(80).get()
  if (sessionsSnap.empty) {
    return NextResponse.json({ error: "Series not found.", code: "series_not_found" }, { status: 404 })
  }

  const nowIso = new Date().toISOString()
  const sessions = sessionsSnap.docs.map((doc) => {
    const d = doc.data() as Omit<ClassSessionRecord, "id">
    return { id: doc.id, ...d }
  })
    .filter((row) => {
      const active = row.isActive !== false
      const starts = String(row.startsAtIso || "")
      return active && starts > nowIso
    })
    .sort((a, b) => String(a.startsAtIso).localeCompare(String(b.startsAtIso)))

  if (sessions.length === 0) {
    return NextResponse.json({ error: "This series has no upcoming sessions.", code: "series_not_available" }, { status: 400 })
  }

  const classTypes = new Set(sessions.map((s) => String(s.classType || "").trim()))
  if (classTypes.size !== 1) {
    return NextResponse.json({ error: "Series has mixed class types; fix sessions in admin.", code: "series_invalid" }, { status: 500 })
  }
  const classType = [...classTypes][0]
  if (!allowedClassTypes.has(classType)) {
    return NextResponse.json({ error: "You do not have access to this program.", code: "program_not_allowed" }, { status: 403 })
  }

  const sessionIds = sessions.map((s) => s.id)

  const dupSnap = await db.collection(BOOKINGS_COLLECTION).where("clientId", "==", portal.clientId).where("groupSeriesId", "==", seriesId).limit(30).get()
  for (const d of dupSnap.docs) {
    const row = d.data() as { dogName?: string; bookingStatus?: string; paymentStatus?: string }
    if (normalized(String(row.dogName || "")) !== dogNorm) continue
    if (String(row.bookingStatus || "").toLowerCase() === "cancelled") continue
    const ps = String(row.paymentStatus || "")
    if (ps === "paid" || ps === "pending_payment" || ps === "processing") {
      return NextResponse.json(
        { error: "You already have a booking or checkout in progress for this series.", code: "duplicate_series" },
        { status: 409 },
      )
    }
  }

  const courseVariationId = await getGroupClassSeriesVariationId(classType, null)
  if (!courseVariationId) {
    return NextResponse.json(
      {
        error:
          "This program needs a full-series Square catalog item (one price for the whole cohort). Map it in Admin → Service config → Group programs → Full series checkout, or set the matching SQUARE_GROUP_CLASS_SERIES_* env var.",
        code: "group_series_course_catalog_missing",
      },
      { status: 500 },
    )
  }

  const holdExpiresAtIso = new Date(Date.now() + HOLD_MS).toISOString()
  const bookingRef = db.collection(BOOKINGS_COLLECTION).doc()
  const bookingId = bookingRef.id

  const when = sessions.map((s) => String(s.startsAtIso))
  const where = sessions.map((s) => String(s.locationLabel || "Group class"))
  const squareCfg = await getSquareServiceConfig(null)
  const groupSlotOrder = migratedGroupProgramSlotOrder(squareCfg)
  const catalogDisplayName =
    (await getCatalogVariationDisplayName(courseVariationId)) || programLabel(classType, groupSlotOrder) || classType
  const what = [`${catalogDisplayName} · series (${sessions.length} sessions)`]

  try {
    await db.runTransaction(async (t) => {
      for (const sid of sessionIds) {
        const sRef = db.collection(CLASS_SESSIONS_COLLECTION).doc(sid)
        const sSnap = await t.get(sRef)
        if (!sSnap.exists) throw new Error("Session missing")
        const sd = sSnap.data() as { capacity?: number; bookedCount?: number; reservedCount?: number; isActive?: boolean; startsAtIso?: string }
        if (sd.isActive === false) throw new Error("Session inactive")
        if (String(sd.startsAtIso || "") <= nowIso) throw new Error("Session already started")
        const cap = Number(sd.capacity ?? 0)
        const booked = Number(sd.bookedCount ?? 0)
        const reserved = Number(sd.reservedCount ?? 0)
        if (booked + reserved >= cap) throw new Error("Series is full")
        t.update(sRef, {
          reservedCount: reserved + 1,
          updatedAt: FieldValue.serverTimestamp(),
        })
      }

      t.set(bookingRef, {
        consultationId: portal.latestConsultation?.id || "training-portal-group-series",
        clientId: portal.clientId,
        clientName: portal.latestConsultation?.clientName || "",
        clientEmail,
        dogName: portal.dogName,
        selectedSessionIds: sessionIds,
        selectedClassTypes: [classType],
        groupSeriesId: seriesId,
        summary: { when, where, what },
        paymentIntentId: null,
        paymentStatus: "pending_payment",
        amountCents: 0,
        currency: "cad",
        paidAtIso: null,
        bookingStatus: "pending_payment",
        squareBookingId: null,
        squareBookingStatus: null,
        squareServiceVariationId: courseVariationId,
        squareTeamMemberId: null,
        source: GROUP_SERIES_BOOKING_SOURCE,
        holdExpiresAtIso,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not reserve seats"
    const status = msg.includes("full") ? 409 : 500
    return NextResponse.json({ error: msg === "Series is full" ? "This series is full." : msg }, { status })
  }

  const origin =
    request.headers.get("origin") ||
    (process.env.NEXT_PUBLIC_SITE_URL?.trim() ? process.env.NEXT_PUBLIC_SITE_URL.trim() : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
  const redirectUrl = origin
    ? `${origin}/training-portal?group=success&booking=${encodeURIComponent(bookingId)}&email=${encodeURIComponent(clientEmail)}&dog=${encodeURIComponent(portal.dogName)}`
    : undefined

  try {
    const link = await createSquarePaymentLinkForVariation({
      variationId: courseVariationId,
      quantity: "1",
      buyerEmail: clientEmail,
      note: `Group class full series · ${catalogDisplayName} · ${sessions.length} sessions · ${portal.dogName}`,
      redirectUrl,
      orderReferenceId: bookingId,
    })
    const url = link.payment_link?.url || null
    const linkId = link.payment_link?.id || null
    if (!url) {
      await releaseHoldsForGroupBooking(db, bookingId)
      return NextResponse.json({ error: "Square did not return a checkout URL." }, { status: 502 })
    }
    await bookingRef.set(
      {
        squarePaymentLinkId: linkId,
        squarePaymentLinkUrl: url,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
    return NextResponse.json({ ok: true, bookingId, checkoutUrl: url })
  } catch (e) {
    await releaseHoldsForGroupBooking(db, bookingId)
    const message = e instanceof Error ? e.message : "Payment link failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
