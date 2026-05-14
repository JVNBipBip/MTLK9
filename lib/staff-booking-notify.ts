import {
  CLIENT_EMAIL_ACCENT_MUTED,
  CLIENT_EMAIL_ACCENT_PRIMARY,
  CLIENT_EMAIL_BODY,
  clientFacingContactEmail,
  clientFacingEmailShell,
  escapeHtmlForEmail,
} from "@/lib/client-email-layout"
import { sendClientFacingEmail, sendEmail } from "@/lib/email"
import type { AppLocale } from "@/lib/i18n/config"

export const STAFF_BOOKING_NOTIFY_EMAIL = "mtlcaninetraining@gmail.com"

/** Comma-separated overrides for consultation inquiry alerts (defaults to STAFF_BOOKING_NOTIFY_EMAIL). */
function consultationInquiryStaffRecipients(): string[] {
  const raw = process.env.CONSULTATION_INQUIRY_NOTIFY_EMAIL?.trim()
  if (!raw) return [STAFF_BOOKING_NOTIFY_EMAIL]
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean)
  return parts.length > 0 ? parts : [STAFF_BOOKING_NOTIFY_EMAIL]
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
    rows.push(`<p><strong>${escapeHtmlForEmail(label)}</strong> ${escapeHtmlForEmail(value)}</p>`)
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
        rows.push(`<p><strong>Program</strong> ${escapeHtmlForEmail(payload.summaryWhat.join(", "))}</p>`)
      }
      if (payload.summaryWhen.length) {
        const lines = payload.summaryWhen.map((w) => formatTorontoDateTime(w)).join(", ")
        rows.push(`<p><strong>Sessions</strong> ${escapeHtmlForEmail(lines)}</p>`)
      }
      if (payload.summaryWhere.length) {
        rows.push(`<p><strong>Where</strong> ${escapeHtmlForEmail(payload.summaryWhere.join("; "))}</p>`)
      }
      break
    default:
      rows.push("<p>New booking notification.</p>")
  }

  return rows.join("\n")
}

const inquiryClientEmail = {
  en: {
    subject: "We received your consultation inquiry — Montreal K9 Training",
    headline: "We received your inquiry",
    preheader: "Our team will follow up shortly about your assessment.",
    lead: (name: string) =>
      `<p style="margin:0 0 16px;color:${CLIENT_EMAIL_BODY};">Hi ${escapeHtmlForEmail(name)},</p><p style="margin:0;color:${CLIENT_EMAIL_BODY};">Thanks for contacting us about an in-person assessment. Our team has your details and will follow up shortly.</p>`,
    footer: `<p style="margin:20px 0 0;font-size:14px;color:${CLIENT_EMAIL_ACCENT_MUTED};">If anything urgent comes up, call <a href="tel:+15148269558" style="color:${CLIENT_EMAIL_ACCENT_PRIMARY};">514 826 9558</a>.</p>`,
  },
  fr: {
    subject: "Nous avons bien reçu votre demande de consultation — Montreal K9 Training",
    headline: "Nous avons bien reçu votre demande",
    preheader: "Notre équipe vous répondra sous peu.",
    lead: (name: string) =>
      `<p style="margin:0 0 16px;color:${CLIENT_EMAIL_BODY};">Bonjour ${escapeHtmlForEmail(name)},</p><p style="margin:0;color:${CLIENT_EMAIL_BODY};">Merci de nous avoir écrit au sujet d'une évaluation en personne. Notre équipe a bien reçu vos informations et vous répondra sous peu.</p>`,
    footer: `<p style="margin:20px 0 0;font-size:14px;color:${CLIENT_EMAIL_ACCENT_MUTED};">Pour toute urgence : <a href="tel:+15148269558" style="color:${CLIENT_EMAIL_ACCENT_PRIMARY};">514 826 9558</a>.</p>`,
  },
} satisfies Record<
  AppLocale,
  { subject: string; headline: string; preheader: string; lead: (name: string) => string; footer: string }
>

function buildConsultationInquiryAdminHtml(input: {
  consultationId: string
  clientName: string
  clientEmail: string
  clientPhone?: string | null
  dogName: string
  issueLabel?: string | null
  inquiryNotes?: string | null
  preferredTrainerLabel?: string | null
  intakeSummary?: string | null
}): string {
  const rows: string[] = []
  const add = (label: string, value: string) => {
    rows.push(`<p><strong>${escapeHtmlForEmail(label)}</strong> ${escapeHtmlForEmail(value)}</p>`)
  }
  rows.push("<p>A visitor submitted a <strong>consultation inquiry</strong> from the website (no deposit).</p>")
  add("Client", input.clientName || input.clientEmail)
  add("Email", input.clientEmail)
  if (input.clientPhone) add("Phone", input.clientPhone)
  add("Dog", input.dogName)
  if (input.issueLabel) add("Issue", input.issueLabel)
  if (input.preferredTrainerLabel) add("Preferred trainer", input.preferredTrainerLabel)
  if (input.inquiryNotes?.trim()) add("Notes", input.inquiryNotes.trim())
  if (input.intakeSummary?.trim()) {
    rows.push(`<p><strong>Intake summary</strong></p><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtmlForEmail(input.intakeSummary.trim())}</pre>`)
  }
  add("Consultation id", input.consultationId)
  return rows.join("\n")
}

/** Staff heads-up + client acknowledgement for inquiry-only consultation submissions (non-blocking). */
export function notifyConsultationInquiryStaffAndClient(input: {
  consultationId: string
  clientName: string
  clientEmail: string
  clientPhone?: string | null
  dogName: string
  issueLabel?: string | null
  inquiryNotes?: string | null
  preferredTrainerLabel?: string | null
  intakeSummary?: string | null
  locale: AppLocale
}): void {
  const adminHtml = buildConsultationInquiryAdminHtml(input)
  const subject = `Consultation inquiry: ${input.dogName}`
  for (const toStaff of consultationInquiryStaffRecipients()) {
    void sendEmail({
      to: toStaff,
      subject,
      html: adminHtml,
    }).then((r) => {
      if (!r.sent) console.error("[notifyConsultationInquiryStaffAndClient] staff", toStaff, r.reason)
      else console.info("[notifyConsultationInquiryStaffAndClient] staff sent", { to: toStaff })
    })
  }

  const copy = inquiryClientEmail[input.locale] ?? inquiryClientEmail.en
  const clientTo = input.clientEmail.trim()
  const clientInnerHtml = `${copy.lead(input.clientName)}${copy.footer}`
  const clientHtml = clientFacingEmailShell({
    preheader: copy.preheader,
    headline: copy.headline,
    accentRgb: CLIENT_EMAIL_ACCENT_PRIMARY,
    innerHtml: clientInnerHtml,
    footerNote:
      input.locale === "fr"
        ? "Vous avez envoyé ce message depuis le formulaire de consultation sur notre site."
        : "You sent this from our consultation form online.",
  })
  void sendClientFacingEmail({
    to: clientTo,
    subject: copy.subject,
    html: clientHtml,
    replyTo: clientFacingContactEmail(),
  }).then((r) => {
    if (!r.sent) console.error("[notifyConsultationInquiryStaffAndClient] client", r.reason)
    else console.info("[notifyConsultationInquiryStaffAndClient] client sent", { to: clientTo })
  })
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
