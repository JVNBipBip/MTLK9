import crypto from "node:crypto"
import { FieldValue, type Firestore } from "firebase-admin/firestore"
import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase-admin"
import { triggerClassSync, shouldTriggerClassSync } from "@/lib/class-sync-trigger"
import { finalizeGroupSeriesPaymentFromWebhook } from "@/lib/group-class-series"
import { reconcileSquareBookingWebhook, type SquareWebhookPayload } from "@/lib/square-webhook-bookings"
import {
  createSquareBooking,
  getOrCreateSquareCustomer,
  retrieveSquareBooking,
  retrieveSquareCustomer,
  retrieveSquareOrder,
} from "@/lib/square"
import { logSquareWebhookEvent } from "@/lib/square-webhook-log"
import { findClientConsultationById } from "@/lib/client-records"
import { isFacilityRoomAvailable } from "@/lib/facility-room-capacity"

export const runtime = "nodejs"

type WebhookPayload = SquareWebhookPayload

const CONSULTATION_DEPOSIT_AMOUNT_CENTS = 3000

type ConsultationBookingClaim = {
  consultationId: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  dogName: string
  issueLabel?: string
  scheduledAtIso: string
  consultationServiceVariationId: string
  consultationTeamMemberId: string
  contactBestTime?: string
  contactNotes?: string
}

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

  const order = (obj as Record<string, unknown>).order as Record<string, unknown> | undefined
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

  const ou = (obj as Record<string, unknown>).order_updated as Record<string, unknown> | undefined
  if (ou && typeof ou.order_id === "string") {
    return {
      orderId: ou.order_id,
      state: typeof ou.state === "string" ? ou.state : undefined,
    }
  }

  const payment = (obj as Record<string, unknown>).payment as Record<string, unknown> | undefined
  if (payment && typeof payment.order_id === "string") {
    return {
      orderId: payment.order_id,
      state: typeof payment.status === "string" ? payment.status : undefined,
    }
  }

  return {}
}

function buildPaidConsultationSquareNote(claim: ConsultationBookingClaim) {
  const parts = [
    `Dog: ${claim.dogName}`,
    `Deposit paid: $30`,
    claim.issueLabel ? `Issue: ${claim.issueLabel}` : null,
    claim.contactBestTime ? `Contact pref: ${claim.contactBestTime}` : null,
    claim.contactNotes ? `Client notes: ${String(claim.contactNotes).slice(0, 180)}` : null,
  ].filter(Boolean)
  return parts.join(" | ").slice(0, 900)
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

async function maybeFinalizeConsultationDepositFromOrderWebhook(db: Firestore, payload: WebhookPayload) {
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

  const consultationId = referenceId.trim()
  if (!consultationId || consultationId.length > 40) return

  const consultationSnap = await findClientConsultationById(db, consultationId)
  if (!consultationSnap?.exists) return

  const paidAtIso = new Date().toISOString()
  const paymentPatch = {
    initialPaymentStatus: "paid",
    initialPaymentPaidAtIso: paidAtIso,
    ...(amountCents != null && Number.isFinite(amountCents) ? { initialPaymentPaidAmountCents: amountCents } : {}),
    squareOrderId: hints.orderId,
    squareWebhookLastEventId: payload.event_id ?? null,
    squareWebhookLastEventType: payload.type ?? null,
    updatedAt: FieldValue.serverTimestamp(),
  }
  const claimBox: { value?: ConsultationBookingClaim } = {}
  await db.runTransaction(async (t) => {
    const snap = await t.get(consultationSnap.ref)
    if (!snap.exists) return
    const data = snap.data() as {
      initialPaymentStatus?: string
      initialPaymentProvider?: string | null
      initialPaymentAmountCents?: number
      squareConsultationBookingId?: string | null
      clientName?: string
      clientEmail?: string
      clientPhone?: string
      dogName?: string
      issueLabel?: string
      scheduledAtIso?: string
      consultationServiceVariationId?: string
      consultationTeamMemberId?: string
      contactBestTime?: string
      contactNotes?: string
    }
    if (data.initialPaymentStatus === "paid") return
    if (data.initialPaymentProvider !== "square") return
    if (data.initialPaymentAmountCents !== CONSULTATION_DEPOSIT_AMOUNT_CENTS) return
    if (amountCents != null && Number.isFinite(amountCents) && amountCents < CONSULTATION_DEPOSIT_AMOUNT_CENTS) return

    if (data.squareConsultationBookingId) {
      t.set(
        consultationSnap.ref,
        {
          ...paymentPatch,
          status: "scheduled",
        },
        { merge: true },
      )
      return
    }

    if (data.initialPaymentStatus === "booking_creation_processing") return

    const required = {
      clientName: String(data.clientName || "").trim(),
      clientEmail: String(data.clientEmail || "").trim(),
      dogName: String(data.dogName || "").trim(),
      scheduledAtIso: String(data.scheduledAtIso || "").trim(),
      consultationServiceVariationId: String(data.consultationServiceVariationId || "").trim(),
      consultationTeamMemberId: String(data.consultationTeamMemberId || "").trim(),
    }
    if (
      !required.clientName ||
      !required.clientEmail ||
      !required.dogName ||
      !required.scheduledAtIso ||
      !required.consultationServiceVariationId ||
      !required.consultationTeamMemberId
    ) {
      t.set(
        consultationSnap.ref,
        {
          ...paymentPatch,
          initialPaymentStatus: "booking_creation_failed",
          status: "payment_received_booking_failed",
          squareBookingError: "Missing consultation details needed to create the Square appointment.",
        },
        { merge: true },
      )
      return
    }

    claimBox.value = {
      consultationId,
      ...required,
      clientPhone: data.clientPhone,
      issueLabel: data.issueLabel,
      contactBestTime: data.contactBestTime,
      contactNotes: data.contactNotes,
    }
    t.set(
      consultationSnap.ref,
      {
        ...paymentPatch,
        initialPaymentStatus: "booking_creation_processing",
        status: "payment_received_booking_pending",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  })

  const claim = claimBox.value
  if (!claim) return

  try {
    const roomAvailable = await isFacilityRoomAvailable({
      startAt: claim.scheduledAtIso,
      serviceVariationId: claim.consultationServiceVariationId,
    })
    if (!roomAvailable) {
      throw new Error("Facility room is no longer available for the paid consultation slot.")
    }

    const squareCustomerId = await getOrCreateSquareCustomer({
      name: claim.clientName,
      email: claim.clientEmail,
      phone: claim.clientPhone,
    })
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${claim.consultationId}:${hints.orderId}`)
      .digest("hex")
      .slice(0, 45)
    const squareBooking = await createSquareBooking({
      customerId: squareCustomerId,
      startAt: claim.scheduledAtIso,
      serviceVariationId: claim.consultationServiceVariationId,
      teamMemberId: claim.consultationTeamMemberId,
      idempotencyKey,
      note: buildPaidConsultationSquareNote(claim),
    })
    const squareConsultationBookingId = squareBooking.booking?.id || null
    if (!squareConsultationBookingId) {
      throw new Error("Square did not return a consultation booking id.")
    }
    await consultationSnap.ref.set(
      {
        ...paymentPatch,
        status: "scheduled",
        squareCustomerId,
        squareConsultationBookingId,
        squareConsultationStatus: squareBooking.booking?.status || null,
        squareBookingCreatedAfterPaymentAtIso: new Date().toISOString(),
      },
      { merge: true },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Square booking creation failed after payment."
    await consultationSnap.ref.set(
      {
        ...paymentPatch,
        initialPaymentStatus: "booking_creation_failed",
        status: "payment_received_booking_failed",
        squareBookingError: message,
      },
      { merge: true },
    )
    throw err
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-square-hmacsha256-signature") || ""
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
  const rawBody = await request.text()
  const db = getAdminDb()

  if (!signature || !signatureKey) {
    await logSquareWebhookEvent(db, {
      stage: "signature_failed",
      eventId: null,
      eventType: null,
      signatureValid: false,
      error: "Missing Square webhook signature configuration.",
      rawBody,
      requestUrl: request.url,
    })
    return NextResponse.json({ error: "Missing Square webhook signature configuration." }, { status: 400 })
  }
  const signatureValid = isValidSignature({ signature, body: rawBody, signatureKey, url: request.url })
  if (!signatureValid) {
    await logSquareWebhookEvent(db, {
      stage: "signature_failed",
      eventId: null,
      eventType: null,
      signatureValid: false,
      error: "Invalid webhook signature.",
      rawBody,
      requestUrl: request.url,
    })
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 })
  }

  let payload: WebhookPayload
  try {
    payload = JSON.parse(rawBody) as WebhookPayload
  } catch {
    await logSquareWebhookEvent(db, {
      stage: "payload_parse_failed",
      eventId: null,
      eventType: null,
      signatureValid: true,
      error: "Could not parse webhook body as JSON.",
      rawBody,
      requestUrl: request.url,
    })
    return NextResponse.json({ ok: true })
  }

  const eventId = payload.event_id ?? null
  const eventType = payload.type ?? null

  await logSquareWebhookEvent(db, {
    stage: "received",
    eventId,
    eventType,
    signatureValid: true,
    rawBody,
    requestUrl: request.url,
  })

  try {
    const reconcile = await reconcileSquareBookingWebhook(db, payload, {
      retrieveBooking: retrieveSquareBooking,
      retrieveCustomer: retrieveSquareCustomer,
    })
    await logSquareWebhookEvent(db, {
      stage: "reconcile_ok",
      eventId,
      eventType,
      signatureValid: true,
      reconcile,
      rawBody,
      requestUrl: request.url,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Booking reconcile failed."
    console.error("[square webhook] booking reconcile:", err)
    await logSquareWebhookEvent(db, {
      stage: "reconcile_error",
      eventId,
      eventType,
      signatureValid: true,
      error: message,
      rawBody,
      requestUrl: request.url,
    })
  }

  try {
    await maybeFinalizeConsultationDepositFromOrderWebhook(db, payload)
    await logSquareWebhookEvent(db, {
      stage: "consultation_deposit_finalize_ok",
      eventId,
      eventType,
      signatureValid: true,
      rawBody,
      requestUrl: request.url,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Consultation deposit finalize failed."
    console.error("[square webhook] consultation deposit finalize:", err)
    await logSquareWebhookEvent(db, {
      stage: "consultation_deposit_finalize_error",
      eventId,
      eventType,
      signatureValid: true,
      error: message,
      rawBody,
      requestUrl: request.url,
    })
  }

  try {
    await maybeFinalizeGroupSeriesFromOrderWebhook(db, payload)
    await logSquareWebhookEvent(db, {
      stage: "order_finalize_ok",
      eventId,
      eventType,
      signatureValid: true,
      rawBody,
      requestUrl: request.url,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Order finalize failed."
    console.error("[square webhook] group series finalize:", err)
    await logSquareWebhookEvent(db, {
      stage: "order_finalize_error",
      eventId,
      eventType,
      signatureValid: true,
      error: message,
      rawBody,
      requestUrl: request.url,
    })
  }

  // Automated class-sync trigger: whenever Square fires an event type that may have
  // changed the public class schedule (configurable via CLASS_SYNC_EVENT_TYPES), call
  // the admin app's class-sync endpoint so Firestore stays in sync without staff having
  // to click "Run sync now". The admin endpoint debounces bursts internally.
  if (shouldTriggerClassSync(eventType)) {
    const outcome = await triggerClassSync({ eventType, eventId })
    if (outcome.triggered) {
      await logSquareWebhookEvent(db, {
        stage: outcome.skipped ? "class_sync_skipped" : "class_sync_triggered",
        eventId,
        eventType,
        signatureValid: true,
        classSync: {
          triggered: true,
          skipped: outcome.skipped,
          reason: outcome.skipped ? "debounce" : null,
          lastRunAtIso: outcome.lastRunAtIso,
        },
        rawBody,
        requestUrl: request.url,
      })
    } else {
      const error = "error" in outcome ? outcome.error : undefined
      console.error("[square webhook] class sync trigger failed:", outcome.reason, error)
      await logSquareWebhookEvent(db, {
        stage: "class_sync_error",
        eventId,
        eventType,
        signatureValid: true,
        classSync: {
          triggered: false,
          reason: outcome.reason,
        },
        error: error ?? null,
        rawBody,
        requestUrl: request.url,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
