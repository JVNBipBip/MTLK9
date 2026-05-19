import { defaultLocale, isAppLocale, type AppLocale } from "@/lib/i18n/config"

export const CONSULTATION_DEPOSIT_AMOUNT_CENTS = 3000
export const TEST_CONSULTATION_DEPOSIT_AMOUNT_CENTS = 100
export const CONSULTATION_DEPOSIT_CURRENCY = "CAD"
export const TEST_CONSULTATION_DEPOSIT_EMAIL = "sam.diquinz@gmail.com"

export function consultationDepositAmountCentsForEmail(email: string) {
  return email.trim().toLowerCase() === TEST_CONSULTATION_DEPOSIT_EMAIL
    ? TEST_CONSULTATION_DEPOSIT_AMOUNT_CENTS
    : CONSULTATION_DEPOSIT_AMOUNT_CENTS
}

export function scheduledAtIsoFromConsultationSlotKey(slotKey: string | null | undefined): string | null {
  const key = String(slotKey || "").trim()
  if (!key) return null
  const [startAt] = key.split("|")
  if (!startAt) return null
  const date = new Date(startAt)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

type ConsultationScheduleFields = {
  status?: string | null
  initialPaymentStatus?: string | null
  squareConsultationBookingId?: string | null
  scheduledAtIso?: string | null
  requestedScheduledAtIso?: string | null
  consultationDateTime?: string | null
  consultationSlotKey?: string | null
}

/** Deposit checkout started but Square appointment not confirmed yet. */
export function isConsultationDepositUnpaid(data: ConsultationScheduleFields): boolean {
  if (data.squareConsultationBookingId) return false
  if (String(data.status || "").trim().toLowerCase() === "scheduled") return false
  const pay = String(data.initialPaymentStatus || "").trim().toLowerCase()
  return pay === "pending_payment" || pay === "processing" || pay === "booking_creation_processing"
}

/** True once deposit is paid and/or a Square consultation booking exists. */
export function isConsultationAppointmentConfirmed(data: ConsultationScheduleFields): boolean {
  if (data.squareConsultationBookingId) return true
  if (String(data.status || "").trim().toLowerCase() === "scheduled") return true
  return String(data.initialPaymentStatus || "").trim().toLowerCase() === "paid"
}

/** ISO time for admin schedule / past-due — only after payment, not while checkout is open. */
export function consultationConfirmedScheduledIso(data: ConsultationScheduleFields): string {
  if (!isConsultationAppointmentConfirmed(data)) return ""
  return String(data.scheduledAtIso || data.consultationDateTime || "").trim()
}

/** Slot the client chose before paying (for staff review only). */
export function consultationRequestedScheduledIso(data: ConsultationScheduleFields): string {
  return String(
    data.requestedScheduledAtIso ||
      scheduledAtIsoFromConsultationSlotKey(data.consultationSlotKey) ||
      "",
  ).trim()
}

/** True when deposit is paid and/or a Square consultation appointment exists. */
export function hasConsultationBooking(data: ConsultationScheduleFields): boolean {
  return Boolean(consultationConfirmedScheduledIso(data))
}

export function resolveConsultationScheduledAtIsoForBooking(data: ConsultationScheduleFields): string {
  return (
    consultationConfirmedScheduledIso(data) ||
    consultationRequestedScheduledIso(data) ||
    scheduledAtIsoFromConsultationSlotKey(data.consultationSlotKey) ||
    ""
  )
}

function siteOrigin(request: Request): string {
  return (
    request.headers.get("origin") ||
    (process.env.NEXT_PUBLIC_SITE_URL?.trim() ? process.env.NEXT_PUBLIC_SITE_URL.trim() : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
  )
}

export function buildConsultationCheckoutRedirectUrl(request: Request, consultationId: string): string | undefined {
  const origin = siteOrigin(request)
  if (!origin) return undefined
  const params = new URLSearchParams({ consultation: consultationId, deposit: "success" })
  return `${origin}/booking?${params.toString()}`
}

export function buildConsultationDepositResumeUrl(
  request: Request,
  locale: AppLocale,
  plainToken: string,
): string | null {
  const origin = siteOrigin(request)
  if (!origin || !plainToken.trim()) return null
  const loc = isAppLocale(locale) ? locale : defaultLocale
  const prefix = loc === defaultLocale ? "" : `/${loc}`
  return `${origin}${prefix}/booking/resume/${encodeURIComponent(plainToken.trim())}`
}

export function consultationDepositResumeExpiryIso(nowMs = Date.now()): string {
  const days = 90
  return new Date(nowMs + days * 24 * 60 * 60 * 1000).toISOString()
}
