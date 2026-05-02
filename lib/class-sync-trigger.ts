/**
 * Bridge from the Square webhook (MTLK9) to the class-sync endpoint on the admin app
 * (MTLK9-Admin). The webhook handler calls `triggerClassSync` whenever Square sends an
 * event type that indicates classes may have changed; the admin endpoint owns the actual
 * Firestore mirroring and handles debouncing internally.
 *
 * Configuration:
 * - `CLASS_SYNC_EVENT_TYPES`: comma-separated Square webhook event types that should fire
 *   a sync. Defaults to catalog updates; booking events are consultations/private classes.
 * - `ADMIN_BASE_URL`: base URL of the admin app (e.g. https://mltk-9-admin.vercel.app).
 * - `CLASS_SYNC_WEBHOOK_SECRET`: shared secret between this app and the admin app; sent
 *   as `Authorization: Bearer <secret>`.
 */

const DEFAULT_EVENT_TYPES = [
  "catalog.version.updated",
]

export type ClassSyncTriggerOutcome =
  | {
      triggered: true
      /** admin app returned skipped=true (debounced within its min-interval window) */
      skipped: boolean
      lastRunAtIso: string | null
    }
  | {
      triggered: false
      reason: "event_not_relevant" | "config_missing" | "request_failed"
      error?: string
    }

function parseEventTypes(): Set<string> {
  const raw = (process.env.CLASS_SYNC_EVENT_TYPES || "").trim()
  const list = raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : DEFAULT_EVENT_TYPES
  return new Set(list)
}

export function shouldTriggerClassSync(eventType: string | null): boolean {
  if (!eventType) return false
  return parseEventTypes().has(eventType)
}

type AdminSyncResponse = {
  ok?: boolean
  error?: string
  skipped?: boolean
  status?: { lastRunAtIso?: string } | null
}

export async function triggerClassSync(opts: {
  eventType: string | null
  eventId: string | null
  timeoutMs?: number
}): Promise<ClassSyncTriggerOutcome> {
  if (!shouldTriggerClassSync(opts.eventType)) {
    return { triggered: false, reason: "event_not_relevant" }
  }

  const baseUrl = (process.env.ADMIN_BASE_URL || "").trim().replace(/\/$/, "")
  const secret = (process.env.CLASS_SYNC_WEBHOOK_SECRET || "").trim()
  if (!baseUrl || !secret) {
    return {
      triggered: false,
      reason: "config_missing",
      error: "Missing ADMIN_BASE_URL or CLASS_SYNC_WEBHOOK_SECRET.",
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000)
  try {
    const res = await fetch(`${baseUrl}/api/admin/class-sync/run`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "square-webhook",
        eventType: opts.eventType,
        eventId: opts.eventId,
      }),
      signal: controller.signal,
    })
    const data = (await res.json().catch(() => null)) as AdminSyncResponse | null
    if (!res.ok || !data?.ok) {
      return {
        triggered: false,
        reason: "request_failed",
        error: data?.error || `HTTP ${res.status}`,
      }
    }
    return {
      triggered: true,
      skipped: Boolean(data.skipped),
      lastRunAtIso: data.status?.lastRunAtIso ?? null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown trigger error."
    return { triggered: false, reason: "request_failed", error: message }
  } finally {
    clearTimeout(timer)
  }
}
