import { FieldValue } from "firebase-admin/firestore"
import { NextResponse } from "next/server"
import { CLASS_SESSIONS_COLLECTION } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import {
  GROUP_SERIES_BOOKING_SOURCE,
  fetchClassSessionsForSeriesId,
  releaseHoldsForGroupBooking,
  releaseStaleGroupSeriesHolds,
} from "@/lib/group-class-series"
import { createSquarePaymentLinkForItems } from "@/lib/square"
import { programLabel } from "@/lib/programs"
import {
  PUPPY_SOCIALIZATION_CLASS_TYPE_ID,
  PUPPY_SOCIAL_DROP_IN_DEPOSIT_CENTS,
  parsePuppySocialDropInIntake,
} from "@/lib/puppy-social-drop-in"
import { canonicalGroupClassTypeId } from "@/lib/group-class-programs"
import { getPrivateServiceVariationIds } from "@/lib/square-service-config"
import { loadTrainingPortalContext } from "@/lib/training-portal"
import { clientBookingRef, clientBookingsCollection, upsertClientProfile } from "@/lib/client-records"
import { captureServerEvent } from "@/lib/posthog-server"

export const runtime = "nodejs"

const HOLD_MS = 30 * 60 * 1000

type Payload = {
  clientEmail?: string
  dogName?: string
  seriesId?: string
  intake?: unknown
  locale?: string
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
  const basePath = input.redirectPath?.trim() || "/group-classes"
  const safePath = basePath.startsWith("/") ? basePath : `/${basePath}`
  const params = new URLSearchParams({
    group: "success",
    booking: input.bookingId,
    email: input.clientEmail,
    dog: input.dogName,
    dropin: "puppy-social",
  })
  return `${origin}${safePath}?${params.toString()}`
}

export async function POST(request: Request) {
  let payload: Payload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const clientEmail = String(payload.clientEmail || "").trim().toLowerCase()
  const seriesId = String(payload.seriesId || "").trim()
  const locale = String(payload.locale || "").trim().toLowerCase()

  let intake: ReturnType<typeof parsePuppySocialDropInIntake>
  try {
    intake = parsePuppySocialDropInIntake(payload.intake)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid intake"
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const dogName = intake.dogName

  if (!clientEmail || !seriesId) {
    return NextResponse.json({ error: "clientEmail and seriesId are required." }, { status: 400 })
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

  const dogNorm = normalized(portal.dogName)

  const loaded = await fetchClassSessionsForSeriesId(db, seriesId)
  if (loaded.length === 0) {
    return NextResponse.json({ error: "Series not found.", code: "series_not_found" }, { status: 404 })
  }

  const nowIso = new Date().toISOString()
  const sessions = loaded
    .filter((row) => row.isActive !== false && String(row.startsAtIso || "") > nowIso)
    .sort((a, b) => String(a.startsAtIso).localeCompare(String(b.startsAtIso)))

  if (sessions.length === 0) {
    return NextResponse.json({ error: "This series has no upcoming sessions.", code: "series_not_available" }, { status: 400 })
  }

  const classTypes = new Set(sessions.map((s) => canonicalGroupClassTypeId(String(s.classType || "").trim())).filter(Boolean))
  if (classTypes.size !== 1) {
    return NextResponse.json({ error: "Series has mixed class types.", code: "series_invalid" }, { status: 500 })
  }
  const classType = [...classTypes][0]
  if (!classType || classType !== PUPPY_SOCIALIZATION_CLASS_TYPE_ID) {
    return NextResponse.json(
      { error: "This checkout is only for puppy socialization drop-in classes.", code: "program_not_allowed" },
      { status: 403 },
    )
  }

  const sessionIds = sessions.map((s) => s.id)

  const dupSnap = await clientBookingsCollection(db, portal.clientId).where("groupSeriesId", "==", seriesId).limit(30).get()
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

  const holdExpiresAtIso = new Date(Date.now() + HOLD_MS).toISOString()
  await upsertClientProfile(db, {
    clientEmail,
    clientName: intake.clientName,
    dogName: portal.dogName,
    source: GROUP_SERIES_BOOKING_SOURCE,
    preferredLocale: locale === "fr" ? "fr" : "en",
  })

  const bookingRef = clientBookingRef(db, clientEmail)
  const bookingId = bookingRef.id

  const displayName = programLabel(classType) || classType
  const when = sessions.map((s) => String(s.startsAtIso))
  const where = sessions.map((s) => String(s.locationLabel || "Group class"))
  const what = [
    `${displayName} · drop-in deposit (${sessions.length} session${sessions.length === 1 ? "" : "s"})`,
    `Registered owner: ${intake.clientName}`,
    `Dog: ${intake.dogName} · Age: ${intake.dogAge}`,
    "Vaccinations up to date: yes",
    "Agreements: proof of vaccination; skip if ill; skip if aggression — confirmed",
    "48-hour deposit refund policy and participation liability — acknowledged",
  ]

  try {
    await db.runTransaction(async (t) => {
      const sessionRefs = sessionIds.map((sid) => db.collection(CLASS_SESSIONS_COLLECTION).doc(sid))
      const sessionSnaps = sessionRefs.length > 0 ? await t.getAll(...sessionRefs) : []
      for (const sSnap of sessionSnaps) {
        if (!sSnap.exists) throw new Error("Session missing")
        const sd = sSnap.data() as {
          capacity?: number
          bookedCount?: number
          reservedCount?: number
          isActive?: boolean
          startsAtIso?: string
        }
        if (sd.isActive === false) throw new Error("Session inactive")
        if (String(sd.startsAtIso || "") <= nowIso) throw new Error("Session already started")
        const cap = Number(sd.capacity ?? 0)
        const booked = Number(sd.bookedCount ?? 0)
        const reserved = Number(sd.reservedCount ?? 0)
        if (booked + reserved >= cap) throw new Error("Series is full")
        t.update(sSnap.ref, {
          reservedCount: reserved + 1,
          updatedAt: FieldValue.serverTimestamp(),
        })
      }

      const bookingData = {
        id: bookingId,
        consultationId: "puppy-social-drop-in",
        clientId: portal.clientId,
        clientName: intake.clientName,
        clientEmail,
        dogName: portal.dogName,
        selectedSessionIds: sessionIds,
        selectedClassTypes: [classType],
        groupSeriesId: seriesId,
        summary: { when, where, what },
        puppyDropInIntake: intake,
        paymentIntentId: null,
        paymentStatus: "pending_payment",
        amountCents: PUPPY_SOCIAL_DROP_IN_DEPOSIT_CENTS,
        currency: "cad",
        paidAtIso: null,
        bookingStatus: "pending_payment",
        squareBookingId: null,
        squareBookingStatus: null,
        squareServiceVariationId: null,
        squareTeamMemberId: null,
        source: GROUP_SERIES_BOOKING_SOURCE,
        preferredLocale: locale === "en" || locale === "fr" ? locale : null,
        websiteLocale: locale === "en" || locale === "fr" ? locale : null,
        holdExpiresAtIso,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }
      t.set(bookingRef, { ...bookingData, clientCollectionPath: bookingRef.path })
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not reserve seats"
    const status = msg.includes("full") ? 409 : 500
    return NextResponse.json({ error: msg === "Series is full" ? "This series is full." : msg }, { status })
  }

  const redirectUrl = buildCheckoutRedirectUrl(request, {
    bookingId,
    clientEmail,
    dogName: portal.dogName,
    redirectPath: payload.redirectPath,
  })

  try {
    const link = await createSquarePaymentLinkForItems({
      items: [
        {
          name: `Puppy socialization deposit · ${displayName}`,
          amountCents: PUPPY_SOCIAL_DROP_IN_DEPOSIT_CENTS,
          currency: "CAD",
          quantity: "1",
        },
      ],
      buyerEmail: clientEmail,
      note: `Drop-in deposit · ${intake.clientName} · ${intake.dogName} · booking ${bookingId}`.slice(0, 480),
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
    captureServerEvent({
      distinctId: clientEmail,
      event: "puppy_social_drop_in_checkout_started",
      properties: {
        bookingId,
        seriesId,
        sessionCount: sessions.length,
        depositAmountCents: PUPPY_SOCIAL_DROP_IN_DEPOSIT_CENTS,
        clientEmail,
        clientName: intake.clientName,
        dogName: portal.dogName,
        dogAge: intake.dogAge,
        locale,
      },
    }).catch(() => {})
    return NextResponse.json({ ok: true, bookingId, checkoutUrl: url })
  } catch (e) {
    await releaseHoldsForGroupBooking(db, bookingId)
    const message = e instanceof Error ? e.message : "Payment link failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
