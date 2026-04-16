import crypto from "node:crypto"
import type { Firestore } from "firebase-admin/firestore"
import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase-admin"
import { finalizeGroupSeriesPaymentFromWebhook } from "@/lib/group-class-series"
import { reconcileSquareBookingWebhook, type SquareWebhookPayload } from "@/lib/square-webhook-bookings"
import { retrieveSquareBooking, retrieveSquareOrder } from "@/lib/square"

export const runtime = "nodejs"

function isValidSignature(input: { signature: string; body: string; url: string; signatureKey: string }) {
  const hmac = crypto.createHmac("sha256", input.signatureKey)
  hmac.update(input.url + input.body)
  const digest = hmac.digest("base64")
  return digest === input.signature
}

function tryGetOrderCheckoutHints(payload: WebhookPayload): {
  orderId?: string
  referenceId?: string
  state?: string
  amountCents?: number
} {
  const obj = payload.data?.object
  if (!obj || typeof obj !== "object") return {}

  const order = obj.order as Record<string, unknown> | undefined
  if (order && typeof order.id === "string") {
    const tm = order.total_money as { amount?: number | bigint } | undefined
    const amt = tm?.amount
    return {
      orderId: order.id,
      referenceId: typeof order.reference_id === "string" ? order.reference_id : undefined,
      state: typeof order.state === "string" ? order.state : undefined,
      amountCents: amt != null ? Number(amt) : undefined,
    }
  }

  const ou = obj.order_updated as Record<string, unknown> | undefined
  if (ou && typeof ou.order_id === "string") {
    return {
      orderId: ou.order_id,
      state: typeof ou.state === "string" ? ou.state : undefined,
    }
  }

  const payment = obj.payment as Record<string, unknown> | undefined
  if (payment && typeof payment.order_id === "string") {
    return {
      orderId: payment.order_id,
      state: typeof payment.status === "string" ? payment.status : undefined,
    }
  }

  return {}
}

async function maybeFinalizeGroupSeriesFromOrderWebhook(db: Firestore, payload: WebhookPayload) {
  const hints = tryGetOrderCheckoutHints(payload)
  if (!hints.orderId) return

  let referenceId = hints.referenceId
  let state = hints.state
  let amountCents = hints.amountCents

  const hasInlinePaidOrder = Boolean(referenceId && state === "COMPLETED")
  if (!hasInlinePaidOrder) {
    try {
      const full = await retrieveSquareOrder(hints.orderId)
      const ord = full.order
      if (!ord) return
      referenceId = referenceId || ord.reference_id || undefined
      state = ord.state || state
      if (ord.total_money?.amount != null) {
        amountCents = Number(ord.total_money.amount)
      }
    } catch {
      return
    }
  }

  if (!referenceId || state !== "COMPLETED") return

  const bookingId = referenceId.trim()
  if (!bookingId || bookingId.length > 40) return

  await finalizeGroupSeriesPaymentFromWebhook(db, {
    bookingId,
    squareOrderId: hints.orderId,
    amountCents,
    eventId: payload.event_id ?? null,
    eventType: payload.type ?? null,
  })
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

  let payload: WebhookPayload
  try {
    payload = JSON.parse(rawBody) as WebhookPayload
  } catch {
    return NextResponse.json({ ok: true })
  }

  const db = getAdminDb()
  try {
    await reconcileSquareBookingWebhook(db, payload, { retrieveBooking: retrieveSquareBooking })
  } catch (err) {
    console.error("[square webhook] booking reconcile:", err)
  }

  try {
    await maybeFinalizeGroupSeriesFromOrderWebhook(db, payload)
  } catch (err) {
    console.error("[square webhook] group series finalize:", err)
  }

  return NextResponse.json({ ok: true })
}
