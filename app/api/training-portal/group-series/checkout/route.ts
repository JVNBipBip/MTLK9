import { FieldValue } from "firebase-admin/firestore"
import { NextResponse } from "next/server"
import { BOOKINGS_COLLECTION, CLASS_SESSIONS_COLLECTION, type ClassSessionRecord } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import { GROUP_SERIES_BOOKING_SOURCE, releaseStaleGroupSeriesHolds, releaseHoldsForGroupBooking } from "@/lib/group-class-series"
import {
  buildSquarePublicClassDetailsUrl,
  createSquarePaymentLinkForItems,
  createSquarePaymentLinkForVariation,
  getCatalogVariationDisplayName,
  getSquareBookingSiteUrlForLocation,
  type SquarePaymentLinkLineItem,
} from "@/lib/square"
import { migratedGroupProgramSlotOrder } from "@/lib/group-program-slots"
import { programLabel } from "@/lib/programs"
import {
  getGroupClassSeriesVariationId,
  getPrivateServiceVariationIds,
  getSquarePublicClassesBaseUrl,
  getSquareServiceConfig,
} from "@/lib/square-service-config"
import { loadTrainingPortalContext } from "@/lib/training-portal"

export const runtime = "nodejs"

const HOLD_MS = 30 * 60 * 1000
const TEMP_PUBLIC_CLASSES_BASE_URL_BY_LOCATION: Record<string, string> = {
  LD1KBAJ8G70HZ: "https://book.squareup.com/classes/zl4jhtxmud9p3z/location/LD1KBAJ8G70HZ",
}

type Payload = {
  clientEmail?: string
  dogName?: string
  seriesId?: string
  sessionId?: string
  items?: Array<{ sessionId?: string }>
  redirectPath?: string
}

function normalized(value: string) {
  return value.trim().toLowerCase()
}

function buildCheckoutRedirectUrl(
  request: Request,
  input: { bookingId: string; clientEmail: string; dogName: string; redirectPath?: string },
): string | undefined {
  const origin =
    request.headers.get("origin") ||
    (process.env.NEXT_PUBLIC_SITE_URL?.trim() ? process.env.NEXT_PUBLIC_SITE_URL.trim() : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
  if (!origin) return undefined
  const basePath = input.redirectPath?.trim() || "/training-portal"
  const safePath = basePath.startsWith("/") ? basePath : `/${basePath}`
  const params = new URLSearchParams({
    group: "success",
    booking: input.bookingId,
    email: input.clientEmail,
    dog: input.dogName,
  })
  return `${origin}${safePath}?${params.toString()}`
}

function publicSquareSessionForCheckout(
  sessions: Array<ClassSessionRecord & { id: string }>,
  sessionId?: string,
): ({ id: string; scheduleId: string; startsAtIso: string; locationId: string; locationLabel?: string } & ClassSessionRecord) | null {
  const ordered = sessionId
    ? [
        ...sessions.filter((session) => session.id === sessionId),
        ...sessions.filter((session) => session.id !== sessionId),
      ]
    : sessions
  for (const session of ordered) {
    const scheduleId = String(session.squarePublicClassScheduleId || "").trim()
    const startsAtIso = String(session.startsAtIso || "").trim()
    const locationId = String(session.locationId || "").trim()
    if (scheduleId && startsAtIso && locationId) {
      return { ...session, scheduleId, startsAtIso, locationId }
    }
  }
  return null
}

async function handleItemsCheckout(
  request: Request,
  input: {
    clientEmail: string
    dogName: string
    sessionIds: string[]
    redirectPath?: string
  },
) {
  const { clientEmail, dogName, sessionIds, redirectPath } = input

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
    return NextResponse.json(
      { error: "Assessment must be completed before booking group classes.", code: "assessment_required" },
      { status: 403 },
    )
  }

  const dogNorm = normalized(portal.dogName)
  const allowedClassTypes = new Set(portal.allowedGroupClassTypeIds)
  if (allowedClassTypes.size === 0) {
    return NextResponse.json({ error: "No group program access for this dog.", code: "no_group_program_access" }, { status: 403 })
  }

  const refs = sessionIds.map((id) => db.collection(CLASS_SESSIONS_COLLECTION).doc(id))
  const snaps = await db.getAll(...refs)
  const nowIso = new Date().toISOString()
  type LoadedSession = ClassSessionRecord & { id: string }
  const sessions: LoadedSession[] = []
  for (const snap of snaps) {
    if (!snap.exists) {
      return NextResponse.json(
        { error: "One of the selected sessions is no longer available.", code: "session_not_found" },
        { status: 404 },
      )
    }
    const d = snap.data() as Omit<ClassSessionRecord, "id">
    const session: LoadedSession = { id: snap.id, ...d }
    if (session.isActive === false) {
      return NextResponse.json({ error: "Selected session is inactive.", code: "session_inactive" }, { status: 400 })
    }
    if (String(session.startsAtIso || "") <= nowIso) {
      return NextResponse.json({ error: "Selected session has already started.", code: "session_started" }, { status: 400 })
    }
    if (!allowedClassTypes.has(String(session.classType || "").trim())) {
      return NextResponse.json({ error: "You do not have access to one of the selected programs.", code: "program_not_allowed" }, { status: 403 })
    }
    sessions.push(session)
  }

  sessions.sort((a, b) => String(a.startsAtIso).localeCompare(String(b.startsAtIso)))

  for (const session of sessions) {
    const amount = Number(session.priceAmountCents ?? NaN)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          error:
            "One of the selected sessions is missing a Square price. Run the admin class sync so price fields are populated, then try again.",
          code: "session_price_missing",
        },
        { status: 500 },
      )
    }
  }

  // All MTLK9 pricing is CAD today. If a session's currency is missing (e.g. it was
  // synced before priceCurrency existed) we fall back to CAD instead of failing checkout.
  const DEFAULT_CURRENCY = "CAD"
  const normalizedCurrencies = new Set(
    sessions.map((s) => {
      const c = String(s.priceCurrency || "").trim().toUpperCase()
      return c || DEFAULT_CURRENCY
    }),
  )
  if (normalizedCurrencies.size > 1) {
    return NextResponse.json(
      { error: "Selected sessions have different currencies; cannot combine in one Square checkout.", code: "mixed_currency" },
      { status: 400 },
    )
  }
  const currency = [...normalizedCurrencies][0]

  const dupSnap = await db.collection(BOOKINGS_COLLECTION).where("clientId", "==", portal.clientId).limit(100).get()
  for (const doc of dupSnap.docs) {
    const row = doc.data() as { dogName?: string; bookingStatus?: string; paymentStatus?: string; selectedSessionIds?: string[] }
    if (normalized(String(row.dogName || "")) !== dogNorm) continue
    if (String(row.bookingStatus || "").toLowerCase() === "cancelled") continue
    const existingSessionIds = new Set((row.selectedSessionIds || []).map((id) => String(id || "").trim()).filter(Boolean))
    const overlap = sessionIds.some((id) => existingSessionIds.has(id))
    const ps = String(row.paymentStatus || "")
    if (overlap && (ps === "paid" || ps === "pending_payment" || ps === "processing")) {
      return NextResponse.json(
        { error: "You already have a booking or checkout in progress for one of these classes.", code: "duplicate_session" },
        { status: 409 },
      )
    }
  }

  const holdExpiresAtIso = new Date(Date.now() + HOLD_MS).toISOString()
  const bookingRef = db.collection(BOOKINGS_COLLECTION).doc()
  const bookingId = bookingRef.id

  const selectedClassTypes = [...new Set(sessions.map((s) => String(s.classType || "").trim()).filter(Boolean))]
  const squareCfg = await getSquareServiceConfig(null)
  const groupSlotOrder = migratedGroupProgramSlotOrder(squareCfg)
  const when = sessions.map((s) => String(s.startsAtIso))
  const where = sessions.map((s) => String(s.locationLabel || "Group class"))
  const what = sessions.map((s) => {
    const label = programLabel(String(s.classType || ""), groupSlotOrder) || String(s.classType || "") || s.title
    const dateLabel = String(s.startsAtIso || "").slice(0, 16).replace("T", " ")
    return `${label} · ${dateLabel}`
  })

  const totalAmountCents = sessions.reduce((sum, s) => sum + Number(s.priceAmountCents ?? 0), 0)
  const seriesIdsInOrder = sessions.map((s) => String(s.seriesId || "").trim()).filter(Boolean)
  const firstSeriesId = seriesIdsInOrder[0] || null

  try {
    await db.runTransaction(async (t) => {
      const reads = await Promise.all(
        sessions.map((s) => t.get(db.collection(CLASS_SESSIONS_COLLECTION).doc(s.id))),
      )
      for (let i = 0; i < reads.length; i++) {
        const snap = reads[i]
        if (!snap.exists) throw new Error("Session missing")
        const sd = snap.data() as { capacity?: number; bookedCount?: number; reservedCount?: number; isActive?: boolean; startsAtIso?: string }
        if (sd.isActive === false) throw new Error("Session inactive")
        if (String(sd.startsAtIso || "") <= nowIso) throw new Error("Session already started")
        const cap = Number(sd.capacity ?? 0)
        const booked = Number(sd.bookedCount ?? 0)
        const reserved = Number(sd.reservedCount ?? 0)
        if (booked + reserved >= cap) throw new Error("Session is full")
        t.update(snap.ref, {
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
        selectedSessionIds: sessions.map((s) => s.id),
        selectedClassTypes,
        groupSeriesId: firstSeriesId,
        summary: { when, where, what },
        paymentIntentId: null,
        paymentStatus: "pending_payment",
        amountCents: totalAmountCents,
        currency: currency.toLowerCase(),
        paidAtIso: null,
        bookingStatus: "pending_payment",
        squareBookingId: null,
        squareBookingStatus: null,
        squareServiceVariationId: null,
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
    return NextResponse.json({ error: msg === "Session is full" ? "One of these classes just filled up." : msg }, { status })
  }

  const lineItems: SquarePaymentLinkLineItem[] = sessions.map((s) => {
    const label = programLabel(String(s.classType || ""), groupSlotOrder) || String(s.classType || "") || s.title
    const dateLabel = new Date(s.startsAtIso).toLocaleString("en-CA", {
      timeZone: "America/Toronto",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
    return {
      name: `${label} · ${dateLabel}`.slice(0, 500),
      amountCents: Number(s.priceAmountCents ?? 0),
      currency,
      quantity: "1",
    }
  })

  const redirectUrl = buildCheckoutRedirectUrl(request, { bookingId, clientEmail, dogName: portal.dogName, redirectPath })

  try {
    const link = await createSquarePaymentLinkForItems({
      items: lineItems,
      buyerEmail: clientEmail,
      note: `Group classes · ${sessions.length} session${sessions.length !== 1 ? "s" : ""} · ${portal.dogName}`,
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
    return NextResponse.json({ ok: true, bookingId, checkoutUrl: url, mode: "payment_link_items" })
  } catch (e) {
    await releaseHoldsForGroupBooking(db, bookingId)
    const message = e instanceof Error ? e.message : "Payment link failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
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
  const sessionId = String(payload.sessionId || "").trim()

  const rawItems = Array.isArray(payload.items) ? payload.items : []
  const itemSessionIds = [
    ...new Set(
      rawItems
        .map((item) => String(item?.sessionId || "").trim())
        .filter((id) => id.length > 0),
    ),
  ]

  if (itemSessionIds.length > 0) {
    if (!clientEmail || !dogName) {
      return NextResponse.json({ error: "clientEmail and dogName are required." }, { status: 400 })
    }
    return handleItemsCheckout(request, {
      clientEmail,
      dogName,
      sessionIds: itemSessionIds,
      redirectPath: payload.redirectPath,
    })
  }

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

  const selectedSession = sessionId ? sessions.find((session) => session.id === sessionId) || null : null
  if (sessionId && !selectedSession) {
    return NextResponse.json({ error: "Selected session not found for this series.", code: "session_not_found" }, { status: 404 })
  }

  const publicSquareSession = publicSquareSessionForCheckout(sessions, sessionId)
  const shouldUseDirectSquareClassUrl =
    Boolean(publicSquareSession) && (Boolean(sessionId) || sessions.length === 1)
  const sessionIds = shouldUseDirectSquareClassUrl && publicSquareSession ? [publicSquareSession.id] : sessions.map((s) => s.id)

  const dupSnap = await db.collection(BOOKINGS_COLLECTION).where("clientId", "==", portal.clientId).where("groupSeriesId", "==", seriesId).limit(30).get()
  for (const d of dupSnap.docs) {
    const row = d.data() as { dogName?: string; bookingStatus?: string; paymentStatus?: string; selectedSessionIds?: string[] }
    if (normalized(String(row.dogName || "")) !== dogNorm) continue
    if (String(row.bookingStatus || "").toLowerCase() === "cancelled") continue
    const ps = String(row.paymentStatus || "")
    const existingSessionIds = new Set((row.selectedSessionIds || []).map((id) => String(id || "").trim()).filter(Boolean))
    const overlapsSelectedSession =
      sessionIds.length === 0 || sessionIds.some((id) => existingSessionIds.has(id))
    if ((ps === "paid" || ps === "pending_payment" || ps === "processing") && overlapsSelectedSession) {
      return NextResponse.json(
        {
          error: shouldUseDirectSquareClassUrl
            ? "You already have a booking or checkout in progress for this class."
            : "You already have a booking or checkout in progress for this series.",
          code: "duplicate_series",
        },
        { status: 409 },
      )
    }
  }

  const courseVariationId = await getGroupClassSeriesVariationId(classType, null)
  if (shouldUseDirectSquareClassUrl && publicSquareSession) {
    const configuredBaseUrl = await getSquarePublicClassesBaseUrl(publicSquareSession.locationId).catch(() => null)
    const hardcodedBaseUrl = TEMP_PUBLIC_CLASSES_BASE_URL_BY_LOCATION[publicSquareSession.locationId] || null
    const bookingSiteUrl =
      configuredBaseUrl ||
      hardcodedBaseUrl ||
      (await getSquareBookingSiteUrlForLocation().catch(() => null))
    const directUrl = bookingSiteUrl
      ? buildSquarePublicClassDetailsUrl({
          bookingSiteUrl,
          locationId: publicSquareSession.locationId,
          scheduleId: publicSquareSession.scheduleId,
          startsAtIso: publicSquareSession.startsAtIso,
        })
      : null
    console.log("[group-series-checkout] public Square URL fallback", {
      seriesId,
      classType,
      sessionId,
      configuredBaseUrl,
      hardcodedBaseUrl,
      bookingSiteUrl,
      publicSquareSession,
      directUrl,
    })
    if (directUrl) {
      return NextResponse.json({ ok: true, checkoutUrl: directUrl, mode: "public_class" })
    }
  }

  if (!courseVariationId) {
    if (publicSquareSession) {
      const configuredBaseUrl = await getSquarePublicClassesBaseUrl(publicSquareSession.locationId).catch(() => null)
      const hardcodedBaseUrl = TEMP_PUBLIC_CLASSES_BASE_URL_BY_LOCATION[publicSquareSession.locationId] || null
      const bookingSiteUrl =
        configuredBaseUrl ||
        hardcodedBaseUrl ||
        (await getSquareBookingSiteUrlForLocation().catch(() => null))
      const directUrl = bookingSiteUrl
        ? buildSquarePublicClassDetailsUrl({
            bookingSiteUrl,
            locationId: publicSquareSession.locationId,
            scheduleId: publicSquareSession.scheduleId,
            startsAtIso: publicSquareSession.startsAtIso,
          })
        : null
      console.log("[group-series-checkout] public Square URL fallback", {
        seriesId,
        classType,
        sessionId,
        configuredBaseUrl,
        hardcodedBaseUrl,
        bookingSiteUrl,
        publicSquareSession,
        directUrl,
      })
      if (directUrl) {
        return NextResponse.json({ ok: true, checkoutUrl: directUrl, mode: "public_class" })
      }
    }
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

  const targetSessions = sessions.filter((session) => sessionIds.includes(session.id))
  const when = targetSessions.map((s) => String(s.startsAtIso))
  const where = targetSessions.map((s) => String(s.locationLabel || "Group class"))
  const squareCfg = await getSquareServiceConfig(null)
  const groupSlotOrder = migratedGroupProgramSlotOrder(squareCfg)
  const catalogDisplayName =
    (await getCatalogVariationDisplayName(courseVariationId)) || programLabel(classType, groupSlotOrder) || classType
  const what = [
    shouldUseDirectSquareClassUrl
      ? `${catalogDisplayName} · single class`
      : `${catalogDisplayName} · series (${sessions.length} sessions)`,
  ]

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
