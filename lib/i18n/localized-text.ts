import type { AppLocale } from "@/lib/i18n/config"
import { frenchTextTranslations } from "@/lib/i18n/dom-translations"

/** A dollar figure as the English copy writes it: `$50`, `$1,234`. */
const PRICE_PATTERN = /\$\d[\d,]*/g

/** Stands in for a price inside a translation key and its French template. */
const PRICE_TOKEN = "{price}"

const PRICE_TOKEN_PATTERN = /\{price\}/g

/**
 * English copy writes `$50` and `$1,234`; Quebec French writes `50 $` and
 * `1 234 $` (a space between thousands). Prices are owner-editable
 * (lib/prices.ts), so a four-figure price can appear in any sentence.
 */
function toFrenchPrice(englishPrice: string) {
  return `${englishPrice.slice(1).replace(/,/g, " ")} $`
}

/**
 * Translates a literal English string to French via `frenchTextTranslations`.
 *
 * Price-bearing strings are looked up by a **price-free** template: the figures
 * in the English string are replaced with `{price}` to build the key, then
 * substituted back into the French. That way a price lives in exactly one place
 * — the English copy — and editing it can never leave a stale figure in the
 * French, which would otherwise quote visitors the old price with no build
 * error. It also means one template serves every price that sentence can carry.
 */
export function getLocalizedText(locale: AppLocale, text: string) {
  if (locale !== "fr") return text

  const direct = frenchTextTranslations[text]
  if (direct) return direct

  const prices: string[] = []
  const key = text.replace(PRICE_PATTERN, (price) => {
    prices.push(price)
    return PRICE_TOKEN
  })
  if (!prices.length) return text

  const template = frenchTextTranslations[key]
  if (!template) return text

  let index = 0
  const translated = template.replace(PRICE_TOKEN_PATTERN, () => {
    const price = prices[index++]
    return price === undefined ? PRICE_TOKEN : toFrenchPrice(price)
  })

  // A template that takes a different number of prices than the string carries
  // would render a half-filled sentence; English is the safer fallback.
  if (index !== prices.length || translated.includes(PRICE_TOKEN)) return text
  return translated
}
