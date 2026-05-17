/** Lowercase + trim for email equality checks. Returns null if empty. */
export function normalizeEmailForMatch(email: string | null | undefined): string | null {
  if (!email) return null
  const trimmed = email.trim().toLowerCase()
  return trimmed || null
}

/**
 * Normalize phone to last 10 digits for equality checks.
 * Handles "+1 (514) 555-1234", "5145551234", "+15145551234" → "5145551234".
 * Returns null if we don't have at least 7 digits to work with.
 */
export function normalizePhoneForMatch(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D+/g, "")
  if (digits.length < 7) return null
  return digits.length > 10 ? digits.slice(-10) : digits
}

/**
 * Possible legacy `clientPhone` string shapes for the same NANP number.
 * Used when `clientPhoneNormalized` is missing on older consultation docs.
 */
export function phoneEqualityCandidates(phone: string | null | undefined): string[] {
  const raw = typeof phone === "string" ? phone.trim() : ""
  const digits = normalizePhoneForMatch(phone)
  const out = new Set<string>()
  if (raw) out.add(raw)
  if (digits) {
    out.add(digits)
    if (digits.length === 10) {
      out.add(`+1${digits}`)
      out.add(`+1 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`)
      out.add(`(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`)
      out.add(`${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`)
      out.add(`${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`)
    }
  }
  return [...out]
}
