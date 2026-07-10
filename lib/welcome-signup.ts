import { isAppLocale, type AppLocale } from "@/lib/i18n/config"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_EMAIL_LENGTH = 254
const MAX_MESSAGE_LENGTH = 1000
const MAX_PATH_LENGTH = 300
const MAX_PHONE_LENGTH = 40

export type WelcomeSignupPayload = {
  email: string
  phone: string | null
  message: string | null
  variant: "a" | "b"
  locale: AppLocale
  path: string
}

export function normalizeWelcomePhone(value: string | null | undefined): string | null {
  const raw = value?.trim() || ""
  if (!raw || raw.length > MAX_PHONE_LENGTH) return null

  const digits = raw.replace(/\D+/g, "")
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`
  if (raw.startsWith("+") && digits.length >= 8 && digits.length <= 15) return `+${digits}`
  return null
}

export function parseWelcomeSignupPayload(body: unknown): WelcomeSignupPayload | null {
  if (!body || typeof body !== "object") return null
  const obj = body as Record<string, unknown>

  const email = typeof obj.email === "string" ? obj.email.trim().toLowerCase() : ""
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) return null

  const variant = obj.variant === "a" || obj.variant === "b" ? obj.variant : null
  if (!variant) return null

  const locale = typeof obj.locale === "string" && isAppLocale(obj.locale) ? obj.locale : null
  if (!locale) return null

  const phoneRaw = typeof obj.phone === "string" ? obj.phone.trim() : ""
  const phone = phoneRaw ? normalizeWelcomePhone(phoneRaw) : null
  if (phoneRaw && !phone) return null

  const messageRaw = typeof obj.message === "string" ? obj.message.trim() : ""
  if (messageRaw.length > MAX_MESSAGE_LENGTH) return null

  const pathRaw = typeof obj.path === "string" ? obj.path.trim() : ""

  return {
    email,
    phone,
    message: messageRaw || null,
    variant,
    locale,
    path: pathRaw.slice(0, MAX_PATH_LENGTH),
  }
}
