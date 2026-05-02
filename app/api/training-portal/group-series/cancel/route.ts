import { NextResponse } from "next/server"
import { BOOKINGS_COLLECTION } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import { GROUP_SERIES_BOOKING_SOURCE, releaseHoldsForGroupBooking } from "@/lib/group-class-series"

export const runtime = "nodejs"

type Payload = {
  bookingId?: string
  clientEmail?: string
  dogName?: string
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

  const bookingId = String(payload.bookingId || "").trim()
  const clientEmail = normalized(String(payload.clientEmail || ""))
  const dogName = normalized(String(payload.dogName || ""))
  if (!bookingId || !clientEmail || !dogName) {
    return NextResponse.json({ error: "bookingId, clientEmail and dogName are required." }, { status: 400 })
  }

  const db = getAdminDb()
  const bookingRef = db.collection(BOOKINGS_COLLECTION).doc(bookingId)
  const snap = await bookingRef.get()
  if (!snap.exists) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 })
  }

  const data = snap.data() as {
    clientId?: string
    clientEmail?: string
    dogName?: string
    source?: string
    paymentStatus?: string
    bookingStatus?: string
  }
  const matchesClient =
    normalized(String(data.clientId || "")) === clientEmail ||
    normalized(String(data.clientEmail || "")) === clientEmail
  const matchesDog = normalized(String(data.dogName || "")) === dogName
  if (!matchesClient || !matchesDog) {
    return NextResponse.json({ error: "Booking does not match this client." }, { status: 403 })
  }
  if (data.source !== GROUP_SERIES_BOOKING_SOURCE) {
    return NextResponse.json({ error: "Only group-series checkouts can be cancelled here." }, { status: 400 })
  }
  if (data.paymentStatus !== "pending_payment" || data.bookingStatus !== "pending_payment") {
    return NextResponse.json({ error: "Only pending checkouts can be deleted." }, { status: 409 })
  }

  await releaseHoldsForGroupBooking(db, bookingId)
  return NextResponse.json({ ok: true })
}
