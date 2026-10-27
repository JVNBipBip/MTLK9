import type { AppLocale } from "@/lib/i18n/config"
import type { DaycareStay, DaycareVisits } from "@/lib/daycare-pricing"

/** Nick's October 27, 2026 reply. These are display terms, not booking enforcement. */
export const DAYCARE_NOTICE_HOURS = 24

// Authorized for display for now; Nick will reconfirm these periods.
// Do not calculate an expiry date until purchase vs. first-visit start is confirmed.
export const DAYCARE_BUNDLE_WEEKS = { 5: 4, 10: 7, 20: 12 } as const

export function daycareStayDuration(stay: DaycareStay, locale: AppLocale): string {
  // Preserve the supplied wording. The exact six-hour pricing boundary is still unresolved.
  const labels = {
    half: { en: "Up to 6 hours", fr: "Jusqu’à 6 heures" },
    full: { en: "6–11 hours", fr: "6 à 11 heures" },
  }
  return labels[stay][locale]
}

export function daycareBundleWindow(visits: DaycareVisits, locale: AppLocale): string | null {
  if (visits === 1) return null
  const weeks = DAYCARE_BUNDLE_WEEKS[visits]
  return locale === "fr" ? `À utiliser en ${weeks} semaines` : `Complete within ${weeks} weeks`
}
