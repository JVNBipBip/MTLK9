import { sendEmail } from "@/lib/email"

export const STAFF_BOOKING_NOTIFY_EMAIL = "mtlcaninetraining@gmail.com"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatTorontoDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export type StaffBookingNotifyPayload =
  | {
      kind: "consultation"
      consultationId: string
      clientName: string
      clientEmail: string
      clientPhone?: string | null
      dogName: string
      scheduledAtIso: string
      squareBookingId: string | null
      issueLabel?: string | null
    }
  | {
      kind: "group_class_post_assessment"
      bookingId: string
      clientName: string
      clientEmail: string
      dogName: string
      programLabel: string
      slotStartAtIso: string
      squareBookingId: string | null
    }
  | {
      kind: "private_session"
      bookingId: string
      clientName: string
      clientEmail: string
      dogName: string
      sessionLabel: string
      slotStartAtIso: string
      privateServiceType?: string | null
      sessionNumber?: number | null
      squareBookingId: string | null
    }
  | {
      kind: "group_series_paid"
      bookingId: string
      clientName: string
      clientEmail: string
      dogName: string
      groupSeriesId: string
      summaryWhen: string[]
      summaryWhere: string[]
      summaryWhat: string[]
    }

function buildSubject(payload: StaffBookingNotifyPayload): string {
  switch (payload.kind) {
    case "consultation":
      return `New consultation booked: ${payload.dogName} (${formatTorontoDateTime(payload.scheduledAtIso)})`
    case "group_class_post_assessment":
      return `New group class booking: ${payload.programLabel} — ${payload.dogName}`
    case "private_session":
      return `New private session booked: ${payload.dogName}`
    case "group_series_paid":
      return `New group series booked (paid): ${payload.dogName}`
    default:
      return "New booking (MTLK9)"
  }
}

function buildHtml(payload: StaffBookingNotifyPayload): string {
  const rows: string[] = []
  const add = (label: string, value: string) => {
    rows.push(`<p><strong>${escapeHtml(label)}</strong> ${escapeHtml(value)}</p>`)
  }

  switch (payload.kind) {
    case "consultation":
      rows.push("<p>Someone completed a consultation deposit and the in-person evaluation is scheduled in Square.</p>")
      add("Client", payload.clientName || payload.clientEmail)
      add("Email", payload.clientEmail)
      if (payload.clientPhone) add("Phone", payload.clientPhone)
      add("Dog", payload.dogName)
      if (payload.issueLabel) add("Issue", payload.issueLabel)
      add("When", formatTorontoDateTime(payload.scheduledAtIso))
      add("Consultation id", payload.consultationId)
      if (payload.squareBookingId) add("Square booking id", payload.squareBookingId)
      break
    case "group_class_post_assessment":
      rows.push("<p>A client booked a group class from their post-assessment booking link (Square appointment created).</p>")
      add("Client", payload.clientName || payload.clientEmail)
      add("Email", payload.clientEmail)
      add("Dog", payload.dogName)
      add("Program", payload.programLabel)
      add("When", formatTorontoDateTime(payload.slotStartAtIso))
      add("Booking id", payload.bookingId)
      if (payload.squareBookingId) add("Square booking id", payload.squareBookingId)
      break
    case "private_session":
      rows.push("<p>A client booked a private / 1-on-1 session from the training portal.</p>")
      add("Client", payload.clientName || payload.clientEmail)
      add("Email", payload.clientEmail)
      add("Dog", payload.dogName)
      add("Service", payload.sessionLabel)
      if (payload.privateServiceType) add("Location type", String(payload.privateServiceType))
      if (payload.sessionNumber != null) add("Session #", String(payload.sessionNumber))
      add("When", formatTorontoDateTime(payload.slotStartAtIso))
      add("Booking id", payload.bookingId)
      if (payload.squareBookingId) add("Square booking id", payload.squareBookingId)
      break
    case "group_series_paid":
      rows.push("<p>A client paid for a full group class series (training portal).</p>")
      add("Client", payload.clientName || payload.clientEmail)
      add("Email", payload.clientEmail)
      add("Dog", payload.dogName)
      add("Series id", payload.groupSeriesId)
      add("Booking id", payload.bookingId)
      if (payload.summaryWhat.length) {
        rows.push(`<p><strong>Program</strong> ${escapeHtml(payload.summaryWhat.join(", "))}</p>`)
      }
      if (payload.summaryWhen.length) {
        const lines = payload.summaryWhen.map((w) => formatTorontoDateTime(w)).join(", ")
        rows.push(`<p><strong>Sessions</strong> ${escapeHtml(lines)}</p>`)
      }
      if (payload.summaryWhere.length) {
        rows.push(`<p><strong>Where</strong> ${escapeHtml(payload.summaryWhere.join("; "))}</p>`)
      }
      break
    default:
      rows.push("<p>New booking notification.</p>")
  }

  return rows.join("\n")
}

/** Fire-and-forget internal heads-up email to staff (non-blocking). */
export function notifyStaffOfBooking(payload: StaffBookingNotifyPayload): void {
  const to = STAFF_BOOKING_NOTIFY_EMAIL
  void sendEmail({
    to,
    subject: buildSubject(payload),
    html: buildHtml(payload),
  }).then((r) => {
    if (!r.sent) {
      console.error("[notifyStaffOfBooking]", payload.kind, r.reason)
    } else {
      console.info("[notifyStaffOfBooking] sent", payload.kind, { to })
    }
  })
}
