/** Approved daycare brief, training add-on updated October 30, 2026. CAD cents, before tax. */
export const DAYCARE_BASE_CENTS = { half: 4000, full: 5500 } as const
export const DAYCARE_ADD_ON_CENTS = { training: 4000, treadmill: 1500, individual: 2000 } as const
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
export function quoteDaycare(stay: DaycareStay, addOns: readonly DaycareAddOn[], visits: DaycareVisits, secondDog = false, now = Date.now()) {
  if (!Object.hasOwn(DAYCARE_BASE_CENTS, stay) || !Object.hasOwn(DAYCARE_DISCOUNT_PERCENT, visits)) {
    throw new Error("Invalid daycare selection")
  }
  if (!Array.isArray(addOns) || addOns.length > 3 || addOns.some((key) => !Object.hasOwn(DAYCARE_ADD_ON_CENTS, key))) {
    throw new Error("Invalid daycare add-on")
  }
  const regularPerVisitCents = DAYCARE_BASE_CENTS[stay] + [...new Set<DaycareAddOn>(addOns)].reduce((sum, key) => sum + DAYCARE_ADD_ON_CENTS[key], 0)
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
