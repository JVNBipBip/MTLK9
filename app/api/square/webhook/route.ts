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
import { notifyStaffOfBooking } from "@/lib/staff-booking-notify"
import { captureServerEvent } from "@/lib/posthog-server"
import { resolveConsultationScheduledAtIsoForBooking } from "@/lib/consultation-deposit"

export const runtime = "nodejs"

const WEBHOOK_LOG_PREFIX = "[square webhook]"

function squareWebhookLog(
  level: "info" | "warn" | "error",
  stage: string,
  ctx: { eventId?: string | null; eventType?: string | null },
  extra?: Record<string, unknown>,
) {
  const payload = {
    stage,
    eventId: ctx.eventId ?? null,
    eventType: ctx.eventType ?? null,
    ...extra,
  }
  const line = `${WEBHOOK_LOG_PREFIX} ${stage}`
  if (level === "error") console.error(line, payload)
  else if (level === "warn") console.warn(line, payload)
  else console.info(line, payload)
}

type WebhookPayload = SquareWebhookPayload

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
  depositAmountCents: number
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
  paid?: boolean
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
      paid: order.state === "COMPLETED",
      amountCents: amt != null ? Number(amt) : undefined,
    }
  }

  const ou = (obj as Record<string, unknown>).order_updated as Record<string, unknown> | undefined
  if (ou && typeof ou.order_id === "string") {
    return {
      orderId: ou.order_id,
      state: typeof ou.state === "string" ? ou.state : undefined,
      paid: ou.state === "COMPLETED",
    }
  }

  const payment = (obj as Record<string, unknown>).payment as Record<string, unknown> | undefined
  if (payment && typeof payment.order_id === "string") {
    return {
      orderId: payment.order_id,
      state: typeof payment.status === "string" ? payment.status : undefined,
      paid: payment.status === "COMPLETED",
    }
  }

  return {}
}

function buildPaidConsultationSquareNote(claim: ConsultationBookingClaim) {
  const parts = [
    `Dog: ${claim.dogName}`,
    `Deposit paid: $${(claim.depositAmountCents / 100).toFixed(2)}`,
    claim.issueLabel ? `Issue: ${claim.issueLabel}` : null,
    claim.contactBestTime ? `Contact pref: ${claim.contactBestTime}` : null,
    claim.contactNotes ? `Client notes: ${String(claim.contactNotes).slice(0, 180)}` : null,
  ].filter(Boolean)
  return parts.join(" | ").slice(0, 900)
}

async function logConsultationDepositStep(
  db: Firestore,
  payload: WebhookPayload,
  details: Record<string, unknown>,
  error?: string | null,
) {
  console.info("[square webhook] consultation deposit:", {
    eventId: payload.event_id ?? null,
    eventType: payload.type ?? null,
    ...details,
    ...(error ? { error } : {}),
  })
  await logSquareWebhookEvent(db, {
    stage: error ? "consultation_deposit_finalize_error" : "consultation_deposit_finalize_ok",
    eventId: payload.event_id ?? null,
    eventType: payload.type ?? null,
    signatureValid: true,
    details,
    error: error ?? null,
  })
}

async function maybeFinalizeGroupSeriesFromOrderWebhook(db: Firestore, payload: WebhookPayload) {
  const ctx = { eventId: payload.event_id ?? null, eventType: payload.type ?? null }
  const hints = tryGetOrderCheckoutHints(payload)
  if (!hints.orderId) return

  squareWebhookLog("info", "group_series:payment_event", ctx, {
    squareOrderId: hints.orderId,
    hintedReferenceId: hints.referenceId ?? null,
    hintedState: hints.state ?? null,
    hintedPaid: hints.paid === true,
    hintedAmountCents: hints.amountCents ?? null,
  })

  let referenceId = hints.referenceId
  let state = hints.state
  let amountCents = hints.amountCents
  let isPaid = hints.paid === true

  const hasInlinePaidOrder = Boolean(referenceId && isPaid)
  if (!hasInlinePaidOrder) {
    try {
      const full = await retrieveSquareOrder(hints.orderId)
      const ord = full.order
      if (!ord) {
        squareWebhookLog("info", "group_series:order_lookup_empty", ctx, { squareOrderId: hints.orderId })
        return
      }
      referenceId = referenceId || ord.reference_id || undefined
      state = state || ord.state
      isPaid = isPaid || ord.state === "COMPLETED"
      if (ord.total_money?.amount != null) {
        amountCents = Number(ord.total_money.amount)
      }
      squareWebhookLog("info", "group_series:order_loaded", ctx, {
        squareOrderId: hints.orderId,
        referenceId: referenceId ?? null,
        state: state ?? null,
        paid: isPaid,
        amountCents: amountCents ?? null,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      squareWebhookLog("warn", "group_series:order_lookup_failed", ctx, {
        squareOrderId: hints.orderId,
        error: message,
      })
      return
    }
  }

  if (!referenceId || !isPaid) {
    squareWebhookLog("info", "group_series:ignored_unpaid_or_unreferenced", ctx, {
      squareOrderId: hints.orderId,
      referenceId: referenceId ?? null,
      state: state ?? null,
      paid: isPaid,
      amountCents: amountCents ?? null,
    })
    return
  }

  const bookingId = referenceId.trim()
  if (!bookingId || bookingId.length > 40) {
    squareWebhookLog("info", "group_series:invalid_reference_id", ctx, {
      squareOrderId: hints.orderId,
      referenceId,
      bookingIdLen: bookingId.length,
    })
    return
  }

  squareWebhookLog("info", "group_series:finalize_start", ctx, {
    bookingId,
    squareOrderId: hints.orderId,
    amountCents: amountCents ?? null,
  })

  await finalizeGroupSeriesPaymentFromWebhook(db, {
    bookingId,
    squareOrderId: hints.orderId,
    amountCents,
    eventId: payload.event_id ?? null,
    eventType: payload.type ?? null,
  })

  squareWebhookLog("info", "group_series:finalize_done", ctx, {
    bookingId,
    squareOrderId: hints.orderId,
  })

  captureServerEvent({
    distinctId: bookingId,
    event: "group_series_payment_completed",
    properties: {
      bookingId,
      squareOrderId: hints.orderId,
      amountCents: amountCents ?? null,
    },
  }).catch(() => {})
}

async function maybeFinalizeConsultationDepositFromOrderWebhook(db: Firestore, payload: WebhookPayload) {
  const hints = tryGetOrderCheckoutHints(payload)
  if (!hints.orderId) return

  await logConsultationDepositStep(db, payload, {
    step: "payment_event_detected",
    squareOrderId: hints.orderId,
    hintedReferenceId: hints.referenceId ?? null,
    hintedState: hints.state ?? null,
    hintedPaid: hints.paid === true,
    hintedAmountCents: hints.amountCents ?? null,
  })

  let referenceId = hints.referenceId
  let state = hints.state
  let amountCents = hints.amountCents
  let isPaid = hints.paid === true

  const hasInlinePaidOrder = Boolean(referenceId && isPaid)
  if (!hasInlinePaidOrder) {
    try {
      const full = await retrieveSquareOrder(hints.orderId)
      const ord = full.order
      if (!ord) {
        await logConsultationDepositStep(db, payload, {
          step: "order_lookup_empty",
          squareOrderId: hints.orderId,
        })
        return
      }
      referenceId = referenceId || ord.reference_id || undefined
      state = state || ord.state
      isPaid = isPaid || ord.state === "COMPLETED"
      if (ord.total_money?.amount != null) {
        amountCents = Number(ord.total_money.amount)
      }
      await logConsultationDepositStep(db, payload, {
        step: "order_loaded",
        squareOrderId: hints.orderId,
        referenceId: referenceId ?? null,
        state: state ?? null,
        paid: isPaid,
        amountCents: amountCents ?? null,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not retrieve Square order."
      await logConsultationDepositStep(
        db,
        payload,
        {
          step: "order_lookup_failed",
          squareOrderId: hints.orderId,
        },
        message,
      )
      return
    }
  }

  if (!referenceId || !isPaid) {
    await logConsultationDepositStep(db, payload, {
      step: "ignored_unpaid_or_unreferenced_order",
      squareOrderId: hints.orderId,
      referenceId: referenceId ?? null,
      state: state ?? null,
      paid: isPaid,
      amountCents: amountCents ?? null,
    })
    return
  }

  const consultationId = referenceId.trim()
  if (!consultationId || consultationId.length > 40) {
    await logConsultationDepositStep(db, payload, {
      step: "invalid_reference_id",
      squareOrderId: hints.orderId,
      referenceId,
    })
    return
  }

  const consultationSnap = await findClientConsultationById(db, consultationId)
  if (!consultationSnap?.exists) {
    await logConsultationDepositStep(db, payload, {
      step: "consultation_not_found",
      squareOrderId: hints.orderId,
      consultationId,
    })
    return
  }

  await logConsultationDepositStep(db, payload, {
    step: "consultation_matched",
    squareOrderId: hints.orderId,
    consultationId,
    consultationPath: consultationSnap.ref.path,
    amountCents: amountCents ?? null,
  })

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
  let transactionOutcome: Record<string, unknown> | null = null
  await db.runTransaction(async (t) => {
    const snap = await t.get(consultationSnap.ref)
    if (!snap.exists) {
      transactionOutcome = { step: "consultation_missing_in_transaction" }
      return
    }
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
    if (data.initialPaymentStatus === "paid" && data.squareConsultationBookingId) {
      transactionOutcome = {
        step: "already_finalized",
        consultationId,
        squareOrderId: hints.orderId,
        squareConsultationBookingId: data.squareConsultationBookingId,
      }
      return
    }
    if (data.initialPaymentProvider !== "square") {
      transactionOutcome = {
        step: "ignored_non_square_payment",
        consultationId,
        squareOrderId: hints.orderId,
        initialPaymentProvider: data.initialPaymentProvider ?? null,
      }
      return
    }
    const expectedDepositAmountCents = Number(data.initialPaymentAmountCents ?? NaN)
    if (!Number.isFinite(expectedDepositAmountCents) || expectedDepositAmountCents <= 0) {
      transactionOutcome = {
        step: "invalid_expected_deposit_amount",
        consultationId,
        squareOrderId: hints.orderId,
        expectedDepositAmountCents: data.initialPaymentAmountCents ?? null,
      }
      return
    }
    if (amountCents != null && Number.isFinite(amountCents) && amountCents < expectedDepositAmountCents) {
      transactionOutcome = {
        step: "paid_amount_too_low",
        consultationId,
        squareOrderId: hints.orderId,
        amountCents,
        expectedDepositAmountCents,
      }
      return
    }

    if (data.squareConsultationBookingId) {
      t.set(
        consultationSnap.ref,
        {
          ...paymentPatch,
          status: "scheduled",
        },
        { merge: true },
      )
      transactionOutcome = {
        step: "payment_marked_paid_existing_square_booking",
        consultationId,
        squareOrderId: hints.orderId,
        squareConsultationBookingId: data.squareConsultationBookingId,
      }
      return
    }

    if (data.initialPaymentStatus === "booking_creation_processing") {
      transactionOutcome = {
        step: "booking_creation_already_processing",
        consultationId,
        squareOrderId: hints.orderId,
      }
      return
    }

    const scheduledAtIso = resolveConsultationScheduledAtIsoForBooking({
      scheduledAtIso: data.scheduledAtIso,
      requestedScheduledAtIso: (data as { requestedScheduledAtIso?: string }).requestedScheduledAtIso,
      consultationSlotKey: (data as { consultationSlotKey?: string }).consultationSlotKey,
      consultationDateTime: (data as { consultationDateTime?: string }).consultationDateTime,
      initialPaymentStatus: data.initialPaymentStatus,
      squareConsultationBookingId: data.squareConsultationBookingId,
      status: (data as { status?: string }).status,
    })
    const required = {
      clientName: String(data.clientName || "").trim(),
      clientEmail: String(data.clientEmail || "").trim(),
      dogName: String(data.dogName || "").trim(),
      scheduledAtIso,
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
      transactionOutcome = {
        step: "missing_required_consultation_details",
        consultationId,
        squareOrderId: hints.orderId,
        hasClientName: Boolean(required.clientName),
        hasClientEmail: Boolean(required.clientEmail),
        hasDogName: Boolean(required.dogName),
        hasScheduledAtIso: Boolean(required.scheduledAtIso),
        hasServiceVariationId: Boolean(required.consultationServiceVariationId),
        hasTeamMemberId: Boolean(required.consultationTeamMemberId),
      }
      return
    }

    claimBox.value = {
      consultationId,
      ...required,
      clientPhone: data.clientPhone,
      issueLabel: data.issueLabel,
      contactBestTime: data.contactBestTime,
      contactNotes: data.contactNotes,
      depositAmountCents: expectedDepositAmountCents,
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
    transactionOutcome = {
      step: "booking_claim_prepared",
      consultationId,
      squareOrderId: hints.orderId,
      scheduledAtIso: required.scheduledAtIso,
      consultationServiceVariationId: required.consultationServiceVariationId,
      consultationTeamMemberId: required.consultationTeamMemberId,
      expectedDepositAmountCents,
      amountCents: amountCents ?? null,
    }
  })

  const claim = claimBox.value
  if (!claim) {
    await logConsultationDepositStep(db, payload, {
      consultationId,
      squareOrderId: hints.orderId,
      ...(transactionOutcome || { step: "no_booking_claim_created" }),
    })
    return
  }

  await logConsultationDepositStep(db, payload, {
    step: "creating_square_booking",
    consultationId: claim.consultationId,
    squareOrderId: hints.orderId,
    scheduledAtIso: claim.scheduledAtIso,
    consultationServiceVariationId: claim.consultationServiceVariationId,
    consultationTeamMemberId: claim.consultationTeamMemberId,
    depositAmountCents: claim.depositAmountCents,
  })

  try {
    const roomAvailable = await isFacilityRoomAvailable({
      startAt: claim.scheduledAtIso,
      serviceVariationId: claim.consultationServiceVariationId,
      teamMemberId: claim.consultationTeamMemberId,
    })
    if (!roomAvailable) {
      throw new Error("Facility room is no longer available for the paid consultation slot.")
    }
    await logConsultationDepositStep(db, payload, {
      step: "facility_room_available",
      consultationId: claim.consultationId,
      squareOrderId: hints.orderId,
      scheduledAtIso: claim.scheduledAtIso,
      consultationServiceVariationId: claim.consultationServiceVariationId,
    })

    const squareCustomerId = await getOrCreateSquareCustomer({
      name: claim.clientName,
      email: claim.clientEmail,
    })
    await logConsultationDepositStep(db, payload, {
      step: "square_customer_ready",
      consultationId: claim.consultationId,
      squareOrderId: hints.orderId,
      squareCustomerId,
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
    await logConsultationDepositStep(db, payload, {
      step: "square_booking_created",
      consultationId: claim.consultationId,
      squareOrderId: hints.orderId,
      squareCustomerId,
      squareConsultationBookingId,
      squareConsultationStatus: squareBooking.booking?.status || null,
    })
    await consultationSnap.ref.set(
      {
        ...paymentPatch,
        status: "scheduled",
        scheduledAtIso: claim.scheduledAtIso,
        consultationDateTime: claim.scheduledAtIso,
        squareCustomerId,
        squareConsultationBookingId,
        squareConsultationStatus: squareBooking.booking?.status || null,
        squareBookingCreatedAfterPaymentAtIso: new Date().toISOString(),
      },
      { merge: true },
    )
    await notifyStaffOfBooking({
      kind: "consultation",
      consultationId: claim.consultationId,
      clientName: claim.clientName,
      clientEmail: claim.clientEmail,
      clientPhone: claim.clientPhone,
      dogName: claim.dogName,
      scheduledAtIso: claim.scheduledAtIso,
      squareBookingId: squareConsultationBookingId,
      issueLabel: claim.issueLabel,
    }).catch((err) => {
      console.error("[square webhook] Consultation staff notification failed:", err)
    })
    captureServerEvent({
      distinctId: claim.clientEmail.toLowerCase(),
      event: "consultation_deposit_paid",
      properties: {
        consultationId: claim.consultationId,
        squareOrderId: hints.orderId,
        squareConsultationBookingId,
        scheduledAtIso: claim.scheduledAtIso,
        depositAmountCents: claim.depositAmountCents,
        clientEmail: claim.clientEmail,
        clientName: claim.clientName,
        dogName: claim.dogName,
        issueLabel: claim.issueLabel,
      },
    }).catch(() => {})
  } catch (err) {
    const message = err instanceof Error ? err.message : "Square booking creation failed after payment."
    await logConsultationDepositStep(
      db,
      payload,
      {
        step: "square_booking_creation_failed",
        consultationId: claim.consultationId,
        squareOrderId: hints.orderId,
        scheduledAtIso: claim.scheduledAtIso,
        consultationServiceVariationId: claim.consultationServiceVariationId,
        consultationTeamMemberId: claim.consultationTeamMemberId,
      },
      message,
    )
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
  const emptyCtx = { eventId: null as string | null, eventType: null as string | null }

  if (!signature || !signatureKey) {
    squareWebhookLog("warn", "signature_config_missing", emptyCtx, {
      hasSignatureHeader: Boolean(signature),
      hasSignatureKeyEnv: Boolean(signatureKey),
      requestUrl: request.url,
      bodyChars: rawBody.length,
    })
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
    squareWebhookLog("warn", "signature_invalid", emptyCtx, {
      requestUrl: request.url,
      bodyChars: rawBody.length,
    })
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
    squareWebhookLog("warn", "payload_json_parse_failed", emptyCtx, {
      requestUrl: request.url,
      bodyChars: rawBody.length,
    })
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
  const ctx = { eventId, eventType }
  const merchantId =
    typeof (payload as Record<string, unknown>).merchant_id === "string"
      ? ((payload as Record<string, unknown>).merchant_id as string)
      : null

  squareWebhookLog("info", "event_received", ctx, {
    merchantId,
    bodyChars: rawBody.length,
  })

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
    squareWebhookLog("info", "booking_reconcile_ok", ctx, { reconcile })
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
    squareWebhookLog("error", "booking_reconcile_error", ctx, {
      error: message,
      stack: err instanceof Error ? err.stack : undefined,
    })
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
    squareWebhookLog("info", "consultation_deposit_pipeline_start", ctx, {})
    await maybeFinalizeConsultationDepositFromOrderWebhook(db, payload)
    squareWebhookLog("info", "consultation_deposit_pipeline_done", ctx, {})
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
    squareWebhookLog("error", "consultation_deposit_pipeline_error", ctx, {
      error: message,
      stack: err instanceof Error ? err.stack : undefined,
    })
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
    squareWebhookLog("info", "group_series_pipeline_start", ctx, {})
    await maybeFinalizeGroupSeriesFromOrderWebhook(db, payload)
    squareWebhookLog("info", "group_series_pipeline_done", ctx, {})
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
    squareWebhookLog("error", "group_series_pipeline_error", ctx, {
      error: message,
      stack: err instanceof Error ? err.stack : undefined,
    })
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
    squareWebhookLog("info", "class_sync:eligible_event", ctx, { eventType })
    const outcome = await triggerClassSync({ eventType, eventId })
    if (outcome.triggered) {
      squareWebhookLog("info", outcome.skipped ? "class_sync:skipped_debounce" : "class_sync:triggered", ctx, {
        lastRunAtIso: outcome.lastRunAtIso,
      })
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
      squareWebhookLog("error", "class_sync:trigger_failed", ctx, {
        reason: outcome.reason,
        error: error ?? null,
      })
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

  squareWebhookLog("info", "response_ok", ctx, {})
  return NextResponse.json({ ok: true })
}
