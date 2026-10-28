import type { AppLocale } from "@/lib/i18n/config"
import type { DaycareStay, DaycareVisits } from "@/lib/daycare-pricing"
import { DAYCARE_BUNDLE_WEEKS, DAYCARE_HALF_DAY_MAX_HOURS, DAYCARE_FULL_DAY_MAX_HOURS } from "@/lib/daycare-rules"

/** Nick's October 27–28, 2026 replies. Display terms, not booking enforcement. */
export const DAYCARE_NOTICE_HOURS = 24
export { DAYCARE_BUNDLE_WEEKS } from "@/lib/daycare-rules"

export function daycareStayDuration(stay: DaycareStay, locale: AppLocale): string {
  const labels = {
    half: { en: `Up to ${DAYCARE_HALF_DAY_MAX_HOURS} hours (inclusive)`, fr: `Jusqu’à ${DAYCARE_HALF_DAY_MAX_HOURS} heures inclusivement` },
    full: { en: `More than ${DAYCARE_HALF_DAY_MAX_HOURS}, up to ${DAYCARE_FULL_DAY_MAX_HOURS} hours`, fr: `Plus de ${DAYCARE_HALF_DAY_MAX_HOURS}, jusqu’à ${DAYCARE_FULL_DAY_MAX_HOURS} heures` },
  }
  return labels[stay][locale]
}

export function daycareBundleWindow(visits: DaycareVisits, locale: AppLocale): string | null {
  if (visits === 1) return null
  const weeks = DAYCARE_BUNDLE_WEEKS[visits]
  return locale === "fr" ? `À utiliser en ${weeks} semaines à partir de la première visite` : `Complete within ${weeks} weeks from the first visit`
}
