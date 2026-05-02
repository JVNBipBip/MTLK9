import { FieldValue } from "firebase-admin/firestore"
import { NextResponse } from "next/server"
import { BOOKINGS_COLLECTION, CLASS_SESSIONS_COLLECTION, type ClassSessionRecord } from "@/lib/domain"
import { sendEmail } from "@/lib/email"
import { getAdminDb } from "@/lib/firebase-admin"
import { GROUP_CLASS_REQUEST_SOURCE } from "@/lib/group-class-series"
import { programLabel } from "@/lib/programs"
import { getPrivateServiceVariationIds } from "@/lib/square-service-config"
import { loadTrainingPortalContext } from "@/lib/training-portal"

export const runtime = "nodejs"

const ADMIN_GROUP_CLASS_EMAIL = "mtlcaninetraining@gmail.com"

type Payload = {
  clientEmail?: string
  dogName?: string
  seriesId?: string
}

function normalized(value: string) {
  return value.trim().toLowerCase()
}

function formatTorontoClassDate(isoDateTime: string) {
  return new Date(isoDateTime).toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildSessionSummary(sessions: Array<Pick<ClassSessionRecord, "startsAtIso" | "locationLabel">>) {
  return sessions
    .map((session) => {
      const where = String(session.locationLabel || "").trim()
      return `${escapeHtml(formatTorontoClassDate(session.startsAtIso))}${where ? ` - ${escapeHtml(where)}` : ""}`
    })
    .join("<br>")
}

async function notifyAdmin(input: {
  bookingId: string
  clientName: string
  clientEmail: string
  dogName: string
  programLabel: string
  seriesId: string
  sessions: Array<Pick<ClassSessionRecord, "startsAtIso" | "locationLabel">>
}) {
  const html = `
    <p>A client requested a group class spot and needs to be manually added in Square.</p>
    <p><strong>Client:</strong> ${escapeHtml(input.clientName || input.clientEmail)}</p>
    <p><strong>Email:</strong> ${escapeHtml(input.clientEmail)}</p>
    <p><strong>Dog:</strong> ${escapeHtml(input.dogName)}</p>
    <p><strong>Program:</strong> ${escapeHtml(input.programLabel)}</p>
    <p><strong>Series:</strong> ${escapeHtml(input.seriesId)}</p>
    <p><strong>Sessions:</strong><br>${buildSessionSummary(input.sessions)}</p>
    <p><strong>Request id:</strong> ${escapeHtml(input.bookingId)}</p>
    <p>After adding the client to the Square class roster, mark the request as added to Square in the admin Group Scheduler.</p>
  `

  return sendEmail({
    to: ADMIN_GROUP_CLASS_EMAIL,
    subject: `Group class request: ${input.programLabel} for ${input.dogName}`,
    html,
  })
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
  const portal = await loadTrainingPortalContext({
    clientEmail,
    dogName,
    oneOnOneServiceVariationIds,
  })

  if (!portal.assessmentCompleted) {
    return NextResponse.json({ error: "Assessment must be completed before requesting group classes.", code: "assessment_required" }, { status: 403 })
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
  const sessions = sessionsSnap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<ClassSessionRecord, "id">) }))
    .filter((row) => row.isActive !== false && String(row.startsAtIso || "") > nowIso)
    .sort((a, b) => String(a.startsAtIso).localeCompare(String(b.startsAtIso)))

  if (sessions.length === 0) {
    return NextResponse.json({ error: "This series has no upcoming sessions.", code: "series_not_available" }, { status: 400 })
  }

  const classTypes = new Set(sessions.map((s) => String(s.classType || "").trim()).filter(Boolean))
  if (classTypes.size !== 1) {
    return NextResponse.json({ error: "Series has mixed class types; fix sessions in admin.", code: "series_invalid" }, { status: 500 })
  }
  const classType = [...classTypes][0]
  if (!allowedClassTypes.has(classType)) {
    return NextResponse.json({ error: "You do not have access to this program.", code: "program_not_allowed" }, { status: 403 })
  }

  const dupSnap = await db.collection(BOOKINGS_COLLECTION).where("clientId", "==", portal.clientId).where("groupSeriesId", "==", seriesId).limit(30).get()
  for (const d of dupSnap.docs) {
    const row = d.data() as { dogName?: string; bookingStatus?: string; paymentStatus?: string }
    if (normalized(String(row.dogName || "")) !== dogNorm) continue
    if (String(row.bookingStatus || "").toLowerCase() === "cancelled") continue
    if (String(row.paymentStatus || "").toLowerCase() === "cancelled") continue
    return NextResponse.json(
      {
        error: "You already have a group class request or booking for this series.",
        code: "duplicate_series",
      },
      { status: 409 },
    )
  }

  const displayName = programLabel(classType) || classType
  const sessionIds = sessions.map((s) => s.id)
  const bookingRef = db.collection(BOOKINGS_COLLECTION).doc()
  const bookingId = bookingRef.id
  const requestCreatedAtIso = new Date().toISOString()

  try {
    await db.runTransaction(async (t) => {
      const sessionRefs = sessionIds.map((sid) => db.collection(CLASS_SESSIONS_COLLECTION).doc(sid))
      const sessionSnaps = sessionRefs.length > 0 ? await t.getAll(...sessionRefs) : []
      for (const sSnap of sessionSnaps) {
        if (!sSnap.exists) throw new Error("Session missing")
        const sd = sSnap.data() as { capacity?: number; bookedCount?: number; reservedCount?: number; isActive?: boolean; startsAtIso?: string }
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

      t.set(bookingRef, {
        consultationId: portal.latestConsultation?.id || "training-portal-group-request",
        clientId: portal.clientId,
        clientName: portal.latestConsultation?.clientName || "",
        clientEmail,
        dogName: portal.dogName,
        selectedSessionIds: sessionIds,
        selectedClassTypes: [classType],
        groupSeriesId: seriesId,
        summary: {
          when: sessions.map((s) => String(s.startsAtIso)),
          where: sessions.map((s) => String(s.locationLabel || "Group class")),
          what: [`${displayName} - group class request (${sessions.length} sessions)`],
        },
        paymentIntentId: null,
        paymentStatus: "not_required",
        amountCents: 0,
        currency: "cad",
        paidAtIso: null,
        bookingStatus: "requested",
        requestStatus: "requested",
        adminActionRequired: true,
        squareBookingId: null,
        squareBookingStatus: null,
        squareServiceVariationId: null,
        squareTeamMemberId: null,
        source: GROUP_CLASS_REQUEST_SOURCE,
        requestedAtIso: requestCreatedAtIso,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not reserve seats"
    const status = msg.includes("full") ? 409 : 500
    return NextResponse.json({ error: msg === "Series is full" ? "This series is full." : msg }, { status })
  }

  const notification = await notifyAdmin({
    bookingId,
    clientName: portal.latestConsultation?.clientName || "",
    clientEmail,
    dogName: portal.dogName,
    programLabel: displayName,
    seriesId,
    sessions,
  })

  await bookingRef.set(
    {
      notificationEmailSent: notification.sent,
      notificationEmailError: notification.sent ? null : notification.reason || "Email not sent",
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  return NextResponse.json({
    ok: true,
    bookingId,
    notificationEmailSent: notification.sent,
    notificationEmailError: notification.sent ? null : notification.reason || "Email not sent",
  })
}
