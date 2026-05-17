import {
  CLIENT_EMAIL_ACCENT_MUTED,
  CLIENT_EMAIL_ACCENT_PRIMARY,
  CLIENT_EMAIL_BODY,
  clientFacingContactEmail,
  clientFacingEmailShell,
  escapeHtmlForEmail,
} from "@/lib/client-email-layout"
import { sendClientFacingEmail, sendEmail } from "@/lib/email"
import { defaultLocale, type AppLocale } from "@/lib/i18n/config"

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
    resumeIntro:
      "When you're ready to pick a time and pay the deposit, use your personalized link below — your intake answers are already saved:",
    resumeCta: "Continue to scheduling & deposit",
    footer: `<p style="margin:20px 0 0;font-size:14px;color:${CLIENT_EMAIL_ACCENT_MUTED};">If anything urgent comes up, call <a href="tel:+15148269558" style="color:${CLIENT_EMAIL_ACCENT_PRIMARY};">514 826 9558</a>.</p>`,
  },
  fr: {
    subject: "Nous avons bien reçu votre demande de consultation — Montreal K9 Training",
    headline: "Nous avons bien reçu votre demande",
    preheader: "Notre équipe vous répondra sous peu.",
    lead: (name: string) =>
      `<p style="margin:0 0 16px;color:${CLIENT_EMAIL_BODY};">Bonjour ${escapeHtmlForEmail(name)},</p><p style="margin:0;color:${CLIENT_EMAIL_BODY};">Merci de nous avoir écrit au sujet d'une évaluation en personne. Notre équipe a bien reçu vos informations et vous répondra sous peu.</p>`,
    resumeIntro:
      "Lorsque vous êtes prêt à choisir une heure et à payer le dépôt, utilisez votre lien personnalisé ci-dessous — vos réponses au formulaire sont déjà enregistrées :",
    resumeCta: "Continuer vers les créneaux et le dépôt",
    footer: `<p style="margin:20px 0 0;font-size:14px;color:${CLIENT_EMAIL_ACCENT_MUTED};">Pour toute urgence : <a href="tel:+15148269558" style="color:${CLIENT_EMAIL_ACCENT_PRIMARY};">514 826 9558</a>.</p>`,
  },
} satisfies Record<
  AppLocale,
  {
    subject: string
    headline: string
    preheader: string
    lead: (name: string) => string
    resumeIntro: string
    resumeCta: string
    footer: string
  }
>

/** Staff-facing inquiry alert: parallel EN/FR templates (follows submission locale; English otherwise). */
const inquiryStaffEmail = {
  en: {
    subject: (dogName: string) => `Consultation inquiry: ${dogName}`,
    introHtml:
      "<p>A visitor submitted a <strong>consultation inquiry</strong> from the website (no deposit).</p>",
    labels: {
      client: "Client",
      email: "Email",
      phone: "Phone",
      dog: "Dog",
      issue: "Issue",
      preferredTrainer: "Preferred trainer",
      notes: "Notes",
      intakeSummary: "Intake summary",
      depositResumeLink: "Client deposit resume link",
      consultationId: "Consultation id",
    },
  },
  fr: {
    subject: (dogName: string) => `Demande de consultation : ${dogName}`,
    introHtml:
      "<p>Un visiteur a envoyé une <strong>demande de consultation</strong> depuis le site (sans dépôt).</p>",
    labels: {
      client: "Client",
      email: "Courriel",
      phone: "Téléphone",
      dog: "Chien",
      issue: "Problématique",
      preferredTrainer: "Entraîneur préféré",
      notes: "Notes",
      intakeSummary: "Résumé du formulaire",
      depositResumeLink: "Lien client (reprise du dépôt)",
      consultationId: "ID consultation",
    },
  },
} satisfies Record<
  AppLocale,
  {
    subject: (dogName: string) => string
    introHtml: string
    labels: {
      client: string
      email: string
      phone: string
      dog: string
      issue: string
      preferredTrainer: string
      notes: string
      intakeSummary: string
      depositResumeLink: string
      consultationId: string
    }
  }
>

/** Submission locale drives template; only `fr` selects French — otherwise English ({@link defaultLocale}). */
function resolvedConsultationInquiryLocale(locale: AppLocale): AppLocale {
  return locale === "fr" ? "fr" : defaultLocale
}

function buildConsultationInquiryAdminHtml(
  locale: AppLocale,
  input: {
    consultationId: string
    clientName: string
    clientEmail: string
    clientPhone?: string | null
    dogName: string
    issueLabel?: string | null
    inquiryNotes?: string | null
    preferredTrainerLabel?: string | null
    intakeSummary?: string | null
    depositResumeUrl?: string | null
  },
): string {
  const t = inquiryStaffEmail[resolvedConsultationInquiryLocale(locale)]
  const rows: string[] = []
  const add = (label: string, value: string) => {
    rows.push(`<p><strong>${escapeHtmlForEmail(label)}</strong> ${escapeHtmlForEmail(value)}</p>`)
  }
  rows.push(t.introHtml)
  add(t.labels.client, input.clientName || input.clientEmail)
  add(t.labels.email, input.clientEmail)
  if (input.clientPhone) add(t.labels.phone, input.clientPhone)
  add(t.labels.dog, input.dogName)
  if (input.issueLabel) add(t.labels.issue, input.issueLabel)
  if (input.preferredTrainerLabel) add(t.labels.preferredTrainer, input.preferredTrainerLabel)
  if (input.inquiryNotes?.trim()) add(t.labels.notes, input.inquiryNotes.trim())
  if (input.intakeSummary?.trim()) {
    rows.push(
      `<p><strong>${escapeHtmlForEmail(t.labels.intakeSummary)}</strong></p><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtmlForEmail(input.intakeSummary.trim())}</pre>`,
    )
  }
  if (input.depositResumeUrl?.trim()) {
    const url = input.depositResumeUrl.trim()
    rows.push(
      `<p><strong>${escapeHtmlForEmail(t.labels.depositResumeLink)}</strong> <a href="${escapeHtmlForEmail(url)}">${escapeHtmlForEmail(url)}</a></p>`,
    )
  }
  add(t.labels.consultationId, input.consultationId)
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
  depositResumeUrl?: string | null
}): void {
  const inquiryLocale = resolvedConsultationInquiryLocale(input.locale)
  const staffCopy = inquiryStaffEmail[inquiryLocale]
  const adminHtml = buildConsultationInquiryAdminHtml(input.locale, input)
  const subject = staffCopy.subject(input.dogName)
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

  const copy = inquiryClientEmail[inquiryLocale]
  const clientTo = input.clientEmail.trim()
  const resumeUrl = input.depositResumeUrl?.trim() || ""
  const resumeBlock =
    resumeUrl &&
    `<p style="margin:20px 0 0;color:${CLIENT_EMAIL_BODY};">${escapeHtmlForEmail(copy.resumeIntro)}</p><p style="margin:16px 0 0;"><a href="${escapeHtmlForEmail(resumeUrl)}" style="display:inline-block;padding:12px 18px;background:${CLIENT_EMAIL_ACCENT_PRIMARY};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;">${escapeHtmlForEmail(copy.resumeCta)}</a></p>`
  const clientInnerHtml = `${copy.lead(input.clientName)}${resumeBlock || ""}${copy.footer}`
  const clientHtml = clientFacingEmailShell({
    preheader: copy.preheader,
    headline: copy.headline,
    accentRgb: CLIENT_EMAIL_ACCENT_PRIMARY,
    innerHtml: clientInnerHtml,
    htmlLang: inquiryLocale === "fr" ? "fr" : "en",
    footerNote:
      inquiryLocale === "fr"
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
