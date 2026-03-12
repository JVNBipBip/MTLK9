import crypto from "node:crypto"
import { FieldValue } from "firebase-admin/firestore"
import { NextResponse } from "next/server"
import { BOOKINGS_COLLECTION, CONSULTATIONS_COLLECTION } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"

export const runtime = "nodejs"

function isValidSignature(input: { signature: string; body: string; url: string; signatureKey: string }) {
  const hmac = crypto.createHmac("sha256", input.signatureKey)
  hmac.update(input.url + input.body)
  const digest = hmac.digest("base64")
  return digest === input.signature
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-square-hmacsha256-signature") || ""
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
  const rawBody = await request.text()

  if (!signature || !signatureKey) {
    return NextResponse.json({ error: "Missing Square webhook signature configuration." }, { status: 400 })
  }
  if (!isValidSignature({ signature, body: rawBody, signatureKey, url: request.url })) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 })
  }

  const payload = JSON.parse(rawBody) as {
    type?: string
    event_id?: string
    data?: {
      object?: {
        booking?: {
          id?: string
          status?: string
          customer_id?: string
          appointment_segments?: Array<{ service_variation_id?: string }>
        }
      }
    }
  }

  const booking = payload.data?.object?.booking
  if (!booking?.id) return NextResponse.json({ ok: true })

  const db = getAdminDb()
  const bookingSnap = await db.collection(BOOKINGS_COLLECTION).where("squareBookingId", "==", booking.id).limit(1).get()
  if (!bookingSnap.empty) {
    await bookingSnap.docs[0].ref.set(
      {
        squareBookingStatus: booking.status || null,
        squareWebhookLastEventId: payload.event_id || null,
        squareWebhookLastEventType: payload.type || null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  }

  const consultationSnap = await db.collection(CONSULTATIONS_COLLECTION).where("squareConsultationBookingId", "==", booking.id).limit(1).get()
  if (!consultationSnap.empty) {
    await consultationSnap.docs[0].ref.set(
      {
        squareConsultationStatus: booking.status || null,
        squareWebhookLastEventId: payload.event_id || null,
        squareWebhookLastEventType: payload.type || null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  }

  return NextResponse.json({ ok: true })
}

