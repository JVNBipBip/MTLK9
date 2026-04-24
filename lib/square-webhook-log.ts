import { FieldValue, type Firestore } from "firebase-admin/firestore"
import { SQUARE_WEBHOOK_EVENTS_COLLECTION } from "@/lib/domain"
import type { ReconcileOutcome } from "@/lib/square-webhook-bookings"

export type WebhookLogStage =
  | "received"
  | "signature_failed"
  | "payload_parse_failed"
  | "reconcile_ok"
  | "reconcile_error"
  | "order_finalize_ok"
  | "order_finalize_error"
  | "class_sync_triggered"
  | "class_sync_skipped"
  | "class_sync_error"

export type WebhookLogClassSyncInfo = {
  /** Whether the admin app ran (or was asked to run) a class sync. */
  triggered: boolean
  /** Structured reason when we didn't call the admin endpoint. */
  reason?: "event_not_relevant" | "config_missing" | "request_failed" | "debounce" | null
  /** True when the admin app returned skipped=true (debounced). */
  skipped?: boolean
  /** Final lastRunAtIso the admin app reported, if we got a response. */
  lastRunAtIso?: string | null
}

export type WebhookLogEntry = {
  /** Which processing stage produced this entry. */
  stage: WebhookLogStage
  /** Square event id, if we could parse it from the body. */
  eventId: string | null
  /** Square event type, e.g. "booking.created". */
  eventType: string | null
  /** Whether the HMAC signature matched. */
  signatureValid: boolean
  /** Structured outcome of the booking reconciler, if it ran. */
  reconcile?: ReconcileOutcome | null
  /** Structured outcome of the class-sync trigger, if it ran. */
  classSync?: WebhookLogClassSyncInfo | null
  /** Error message if a stage threw. */
  error?: string | null
  /** Truncated raw body for debugging — capped to keep doc size reasonable. */
  rawBodyPreview?: string
  /** Request URL used for HMAC verification (helpful for debugging mismatches). */
  requestUrl?: string
  /** Wall-clock ISO time when we logged this entry. */
  receivedAtIso: string
}

const MAX_RAW_BODY_PREVIEW = 4000

function trimBody(body: string | null | undefined): string | undefined {
  if (!body) return undefined
  if (body.length <= MAX_RAW_BODY_PREVIEW) return body
  return `${body.slice(0, MAX_RAW_BODY_PREVIEW)}…`
}

/**
 * Write a single webhook event log to Firestore. Never throws — logging failures are
 * swallowed and console.error'd so they can't break the webhook response.
 */
export async function logSquareWebhookEvent(
  db: Firestore,
  entry: Omit<WebhookLogEntry, "receivedAtIso" | "rawBodyPreview"> & { rawBody?: string | null },
) {
  const doc = {
    stage: entry.stage,
    eventId: entry.eventId,
    eventType: entry.eventType,
    signatureValid: entry.signatureValid,
    reconcile: entry.reconcile ?? null,
    classSync: entry.classSync ?? null,
    error: entry.error ?? null,
    requestUrl: entry.requestUrl,
    rawBodyPreview: trimBody(entry.rawBody),
    receivedAtIso: new Date().toISOString(),
    createdAt: FieldValue.serverTimestamp(),
  }
  try {
    await db.collection(SQUARE_WEBHOOK_EVENTS_COLLECTION).add(doc)
  } catch (err) {
    console.error("[square webhook] failed to persist webhook log entry:", err)
  }
}
