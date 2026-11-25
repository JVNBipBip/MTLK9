import { centsOf, PUBLISHED_PRICES, type PriceBook, type PriceId } from "@/lib/prices"

/**
 * CAD cents, before tax. The amounts are owner-editable (Website editor →
 * Prices → Daycare; defaults in lib/prices.ts): the page and the checkout both
 * read them here, so what he sets is exactly what customers are charged.
 */
export function daycareRates(book: PriceBook = PUBLISHED_PRICES) {
  const compare = (id: PriceId) => {
    const amount = book.compareAt(id)
    return amount === null ? null : amount * 100
  }
  return {
    base: { half: centsOf("daycare.halfDay", book.price), full: centsOf("daycare.fullDay", book.price) },
    addOns: {
      training: centsOf("daycare.addOnTraining", book.price),
      treadmill: centsOf("daycare.addOnTreadmill", book.price),
      individual: centsOf("daycare.addOnIndividual", book.price),
    },
    /** Sale "was" prices in cents (display only), or null. */
    compareAt: {
      half: compare("daycare.halfDay"),
      full: compare("daycare.fullDay"),
      training: compare("daycare.addOnTraining"),
      treadmill: compare("daycare.addOnTreadmill"),
      individual: compare("daycare.addOnIndividual"),
    },
  }
}
export type DaycareRates = ReturnType<typeof daycareRates>

export const PUBLISHED_RATES = daycareRates()
export const DAYCARE_BASE_CENTS = PUBLISHED_RATES.base
export const DAYCARE_ADD_ON_CENTS = PUBLISHED_RATES.addOns
export const DAYCARE_DISCOUNT_PERCENT = { 1: 0, 5: 5, 10: 7, 20: 12 } as const

export type DaycareStay = keyof typeof DAYCARE_BASE_CENTS
export type DaycareAddOn = keyof typeof DAYCARE_ADD_ON_CENTS
export type DaycareVisits = keyof typeof DAYCARE_DISCOUNT_PERCENT

/**
 * Time-boxed sale that replaces the bundle discounts. Applied automatically (no promo code)
 * by quoteDaycare, which the server re-runs at checkout, so the browser can't extend it.
 * Window is Montreal time: Thursday Nov 26, 2026 00:00 up to (not including) Monday Nov 30 00:00.
 */
export const DAYCARE_PROMO = {
  id: "black-friday-2026",
  en: "Black Friday",
  fr: "Vendredi fou",
  startsAtMs: Date.parse("2026-11-26T00:00:00-05:00"),
  endsAtMs: Date.parse("2026-11-30T00:00:00-05:00"),
  discountPercent: { 1: 0, 5: 12, 10: 18, 20: 25 } as const satisfies Record<DaycareVisits, number>,
} as const

export function daycarePromoActive(now = Date.now()) {
  return now >= DAYCARE_PROMO.startsAtMs && now < DAYCARE_PROMO.endsAtMs
}

/** Bundle discount in effect at `now`: the sale percent during the promo, otherwise the regular one. */
export function daycareDiscountPercent(visits: DaycareVisits, now = Date.now()): number {
  return daycarePromoActive(now) ? DAYCARE_PROMO.discountPercent[visits] : DAYCARE_DISCOUNT_PERCENT[visits]
}

/** Also validates callers at runtime; never accept a price or discount from a browser. */
/** `rates`: only the editor's live preview passes its own; the checkout always uses the published ones. */
export function quoteDaycare(stay: DaycareStay, addOns: readonly DaycareAddOn[], visits: DaycareVisits, secondDog = false, now = Date.now(), rates: DaycareRates = PUBLISHED_RATES) {
  if (!Object.hasOwn(DAYCARE_BASE_CENTS, stay) || !Object.hasOwn(DAYCARE_DISCOUNT_PERCENT, visits)) {
    throw new Error("Invalid daycare selection")
  }
  if (!Array.isArray(addOns) || addOns.length > 3 || addOns.some((key) => !Object.hasOwn(DAYCARE_ADD_ON_CENTS, key))) {
    throw new Error("Invalid daycare add-on")
  }
  const regularPerVisitCents = rates.base[stay] + [...new Set<DaycareAddOn>(addOns)].reduce((sum, key) => sum + rates.addOns[key], 0)
  const regularTotalCents = regularPerVisitCents * visits
  const totalAt = (percent: number) => {
    const bundleSavingsCents = Math.round(regularTotalCents * percent / 100)
    const secondDogSavingsCents = secondDog ? Math.round((regularTotalCents - bundleSavingsCents) * 30 / 100) : 0
    return { bundleSavingsCents, secondDogSavingsCents, totalCents: regularTotalCents - bundleSavingsCents - secondDogSavingsCents }
  }
  const standardDiscountPercent = DAYCARE_DISCOUNT_PERCENT[visits]
  const discountPercent = daycareDiscountPercent(visits, now)
  const { bundleSavingsCents, secondDogSavingsCents, totalCents } = totalAt(discountPercent)
  const savingsCents = bundleSavingsCents + secondDogSavingsCents
  // Compare-at price: what the same selection costs outside the sale (regular bundle discount).
  const standardTotalCents = totalAt(standardDiscountPercent).totalCents
  const promo = discountPercent !== standardDiscountPercent ? DAYCARE_PROMO.id : null
  return { regularPerVisitCents, regularTotalCents, discountPercent, standardDiscountPercent, standardTotalCents, promo, bundleSavingsCents, secondDogSavingsCents, savingsCents, totalCents, perVisitCents: totalCents / visits, visits }
}

export function daycareMoney(cents: number, locale: "en" | "fr") {
  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 2 }).format(cents / 100)
}
