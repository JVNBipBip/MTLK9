/** Approved October 21, 2026 daycare brief. All amounts are CAD cents, before tax. */
export const DAYCARE_BASE_CENTS = { half: 4000, full: 5500 } as const
export const DAYCARE_ADD_ON_CENTS = { training: 3500, treadmill: 1500, individual: 2000 } as const
export const DAYCARE_DISCOUNT_PERCENT = { 1: 0, 5: 5, 10: 7, 20: 12 } as const

export type DaycareStay = keyof typeof DAYCARE_BASE_CENTS
export type DaycareAddOn = keyof typeof DAYCARE_ADD_ON_CENTS
export type DaycareVisits = keyof typeof DAYCARE_DISCOUNT_PERCENT

/** Also validates callers at runtime; never accept a price or discount from a browser. */
export function quoteDaycare(stay: DaycareStay, addOns: readonly DaycareAddOn[], visits: DaycareVisits) {
  if (!Object.hasOwn(DAYCARE_BASE_CENTS, stay) || !Object.hasOwn(DAYCARE_DISCOUNT_PERCENT, visits)) {
    throw new Error("Invalid daycare selection")
  }
  if (!Array.isArray(addOns) || addOns.length > 3 || addOns.some((key) => !Object.hasOwn(DAYCARE_ADD_ON_CENTS, key))) {
    throw new Error("Invalid daycare add-on")
  }
  const regularPerVisitCents = DAYCARE_BASE_CENTS[stay] + [...new Set<DaycareAddOn>(addOns)].reduce((sum, key) => sum + DAYCARE_ADD_ON_CENTS[key], 0)
  const regularTotalCents = regularPerVisitCents * visits
  const discountPercent = DAYCARE_DISCOUNT_PERCENT[visits]
  const savingsCents = Math.round(regularTotalCents * discountPercent / 100)
  const totalCents = regularTotalCents - savingsCents
  return { regularPerVisitCents, regularTotalCents, discountPercent, savingsCents, totalCents, perVisitCents: totalCents / visits, visits }
}

export function daycareMoney(cents: number, locale: "en" | "fr") {
  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 2 }).format(cents / 100)
}
