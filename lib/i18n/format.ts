import type { AppLocale } from "./config"
import { getIntlLocale } from "./config"

export const TORONTO_TIME_ZONE = "America/Toronto"

export function formatLocalizedDateTime(
  value: string | number | Date,
  locale: AppLocale,
  options: Intl.DateTimeFormatOptions,
) {
  return new Date(value).toLocaleString(getIntlLocale(locale), {
    timeZone: TORONTO_TIME_ZONE,
    ...options,
  })
}
