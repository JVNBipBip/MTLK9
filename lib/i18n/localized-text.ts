import type { AppLocale } from "@/lib/i18n/config"
import { frenchTextTranslations } from "@/lib/i18n/dom-translations"

export function getLocalizedText(locale: AppLocale, text: string) {
  if (locale !== "fr") return text
  return frenchTextTranslations[text] ?? text
}
