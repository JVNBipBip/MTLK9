import {
  CLIENT_EMAIL_ACCENT_MUTED,
  CLIENT_EMAIL_ACCENT_PRIMARY,
  CLIENT_EMAIL_BODY,
  CLIENT_EMAIL_HEADING,
  clientFacingContactEmail,
  clientFacingEmailShell,
  escapeHtmlForEmail,
} from "@/lib/client-email-layout"
import { sendClientFacingEmail, sendEmail } from "@/lib/email"
import { addLocaleToPathname, defaultLocale, type AppLocale } from "@/lib/i18n/config"

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
  {
    subject: string
    headline: string
    preheader: string
    lead: (name: string) => string
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
      consultationId: string
    }
  }
>

/** Submission locale drives template; only `fr` selects French — otherwise English ({@link defaultLocale}). */
function resolvedConsultationInquiryLocale(locale: AppLocale): AppLocale {
  return locale === "fr" ? "fr" : defaultLocale
}

function clientSiteOrigin(): string | null {
  const u = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!u) return null
  return u.replace(/\/$/, "")
}

function localizedTermsUrl(locale: AppLocale): string | null {
  const origin = clientSiteOrigin()
  if (!origin) return null
  return `${origin}${addLocaleToPathname("/terms", resolvedConsultationInquiryLocale(locale))}`
}

function formatDepositAmount(cents: number, locale: AppLocale): string {
  const amount = Math.round(cents / 100)
  return locale === "fr" ? `${amount} $` : `$${amount}`
}

const consultationBookedClientEmail = {
  en: {
    subject: "Thanks for booking your assessment — Montreal K9 Training",
    headline: "Thanks for booking",
    preheader: "Your appointment time and a few notes about your deposit.",
    body: (input: { name: string; when: string; dogName: string; deposit: string; termsUrl: string | null }) => {
      const terms = input.termsUrl
        ? `<a href="${escapeHtmlForEmail(input.termsUrl)}" style="color:${CLIENT_EMAIL_ACCENT_PRIMARY};">terms and conditions</a>`
        : "terms and conditions"
      return [
        `<p style="margin:0 0 16px;color:${CLIENT_EMAIL_BODY};">Hi ${escapeHtmlForEmail(input.name)},</p>`,
        `<p style="margin:0 0 16px;color:${CLIENT_EMAIL_BODY};">Thanks for booking an in-person assessment for <strong style="color:${CLIENT_EMAIL_HEADING};">${escapeHtmlForEmail(input.dogName)}</strong> on <strong style="color:${CLIENT_EMAIL_HEADING};">${escapeHtmlForEmail(input.when)}</strong>. This email is just a quick notice about what happens next.</p>`,
        `<p style="margin:0 0 16px;color:${CLIENT_EMAIL_BODY};">We will send you a Square invoice for a ${escapeHtmlForEmail(input.deposit)} deposit shortly. Payment must be received within 24 hours in order to secure your appointment.</p>`,
        `<p style="margin:0 0 16px;color:${CLIENT_EMAIL_BODY};">This deposit is held in accordance with our 48-hour cancellation, rescheduling, and no-show policy.</p>`,
        `<p style="margin:0 0 16px;color:${CLIENT_EMAIL_BODY};">Once your consultation has been completed, the full ${escapeHtmlForEmail(input.deposit)} deposit will be refunded to you.</p>`,
        `<p style="margin:0 0 16px;color:${CLIENT_EMAIL_BODY};">By paying this deposit, you agree to our ${terms}.</p>`,
        `<p style="margin:0;color:${CLIENT_EMAIL_BODY};">Thank you, and we look forward to meeting you and your dog!</p>`,
      ].join("")
    },
    footerNote: "Booking notice from Montreal Canine Training.",
    footer:
      `<p style="margin:20px 0 0;font-size:14px;color:${CLIENT_EMAIL_ACCENT_MUTED};">Questions? Call <a href="tel:+15148269558" style="color:${CLIENT_EMAIL_ACCENT_PRIMARY};">514 826 9558</a>.</p>`,
  },
  fr: {
    subject: "Merci pour votre réservation d'évaluation — Montreal K9 Training",
    headline: "Merci pour votre réservation",
    preheader: "Votre rendez-vous et quelques notes sur le dépôt.",
    body: (input: { name: string; when: string; dogName: string; deposit: string; termsUrl: string | null }) => {
      const terms = input.termsUrl
        ? `<a href="${escapeHtmlForEmail(input.termsUrl)}" style="color:${CLIENT_EMAIL_ACCENT_PRIMARY};">conditions générales</a>`
        : "conditions générales"
      return [
        `<p style="margin:0 0 16px;color:${CLIENT_EMAIL_BODY};">Bonjour ${escapeHtmlForEmail(input.name)},</p>`,
        `<p style="margin:0 0 16px;color:${CLIENT_EMAIL_BODY};">Merci d'avoir réservé une évaluation en personne pour <strong style="color:${CLIENT_EMAIL_HEADING};">${escapeHtmlForEmail(input.dogName)}</strong> le <strong style="color:${CLIENT_EMAIL_HEADING};">${escapeHtmlForEmail(input.when)}</strong>. Ce courriel est un simple avis sur la suite.</p>`,
        `<p style="margin:0 0 16px;color:${CLIENT_EMAIL_BODY};">Nous vous enverrons sous peu une facture Square pour un dépôt de ${escapeHtmlForEmail(input.deposit)}. Le paiement doit être reçu dans les 24 heures afin de confirmer votre rendez-vous.</p>`,
        `<p style="margin:0 0 16px;color:${CLIENT_EMAIL_BODY};">Ce dépôt est assujetti à notre politique d'annulation, de report et de non-présentation de 48 heures.</p>`,
        `<p style="margin:0 0 16px;color:${CLIENT_EMAIL_BODY};">Une fois votre consultation terminée, l'intégralité du dépôt de ${escapeHtmlForEmail(input.deposit)} vous sera remboursée.</p>`,
        `<p style="margin:0 0 16px;color:${CLIENT_EMAIL_BODY};">En payant ce dépôt, vous acceptez nos ${terms}.</p>`,
        `<p style="margin:0;color:${CLIENT_EMAIL_BODY};">Merci, et nous avons hâte de vous rencontrer, vous et votre chien!</p>`,
      ].join("")
    },
    footerNote: "Avis de réservation — Entraînement Canin Montréal.",
    footer:
      `<p style="margin:20px 0 0;font-size:14px;color:${CLIENT_EMAIL_ACCENT_MUTED};">Des questions? <a href="tel:+15148269558" style="color:${CLIENT_EMAIL_ACCENT_PRIMARY};">514 826 9558</a>.</p>`,
  },
} satisfies Record<
  AppLocale,
  {
    subject: string
    headline: string
    preheader: string
    body: (input: { name: string; when: string; dogName: string; deposit: string; termsUrl: string | null }) => string
    footerNote: string
    footer: string
  }
>

/** Website booking form only (`website-booking-form` or `website-booking-form/trainer/...`). */
export function isWebsiteConsultationBookingSource(bookingSource: string): boolean {
  const source = bookingSource.trim()
  return source === "website-booking-form" || source.startsWith("website-booking-form/")
}

/**
 * Client notice after a website consultation booking (in-person evaluation + slot).
 * Not used for inquiries, private sessions, group classes, training portal, or admin flows.
 */
export function notifyConsultationBookedClient(input: {
  clientName: string
  clientEmail: string
  dogName: string
  scheduledAtIso: string
  locale: AppLocale
  bookingSource: string
  depositAmountCents?: number
}): void {
  if (!isWebsiteConsultationBookingSource(input.bookingSource)) {
    console.info("[notifyConsultationBookedClient] skipped — not a website consultation booking", {
      bookingSource: input.bookingSource,
    })
    return
  }

  const mailLocale = resolvedConsultationInquiryLocale(input.locale)
  const copy = consultationBookedClientEmail[mailLocale]
  const when = formatTorontoDateTime(input.scheduledAtIso)
  const name = input.clientName.trim() || "there"
  const depositCents = input.depositAmountCents ?? 3000
  const depositLabel = formatDepositAmount(depositCents, mailLocale)
  const termsUrl = localizedTermsUrl(mailLocale)

  const clientInnerHtml = `${copy.body({ name, when, dogName: input.dogName, deposit: depositLabel, termsUrl })}${copy.footer}`
  const clientHtml = clientFacingEmailShell({
    preheader: copy.preheader,
    headline: copy.headline,
    accentRgb: CLIENT_EMAIL_ACCENT_PRIMARY,
    innerHtml: clientInnerHtml,
    htmlLang: mailLocale === "fr" ? "fr" : "en",
    footerNote: copy.footerNote,
  })

  const clientTo = input.clientEmail.trim()
  void sendClientFacingEmail({
    to: clientTo,
    subject: copy.subject,
    html: clientHtml,
    replyTo: clientFacingContactEmail(),
  }).then((r) => {
    if (!r.sent) console.error("[notifyConsultationBookedClient] client", r.reason)
    else console.info("[notifyConsultationBookedClient] client sent", { to: clientTo })
  })
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
  const clientInnerHtml = `${copy.lead(input.clientName)}${copy.footer}`
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
