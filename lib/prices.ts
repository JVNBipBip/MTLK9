import publishedEdits from "@/content/site-edits.json"

/**
 * Every price the website shows, as whole Canadian dollars before tax, in one
 * place. Pages build their price text from these ("$360 + tax"), and French
 * follows automatically (getLocalizedText moves the figure: "360 $ + taxes").
 *
 * The owner changes them in the Website editor's Prices panel; his published
 * values live in content/site-edits.json (`prices`) and win over these
 * defaults. The registry (content/editable-fields.json `prices`) mirrors these
 * defaults with labels and limits; fields.test.ts checks they match.
 *
 * Who charges what (see `chargedBy` in the registry):
 * - "website": our own checkout charges this amount (the deposits), so an edit
 *   changes what customers pay.
 * - "square": Square charges its own catalog price; the page only shows it.
 * - "none": not paid online.
 *
 * Daycare prices are separate (lib/daycare-pricing.ts) for now.
 */
export const PRICE_DEFAULTS = {
  "consultation.young": 135,
  "consultation.adult": 145,
  "consultation.specialist": 165,
  "private.packA": 390,
  "private.packB": 620,
  "private.packC": 820,
  "private.puppyPackA": 360,
  "private.unit": 140,
  "private.unitYoung": 130,
  "group.puppySocial": 50,
  "group.teenPackage": 350,
  "group.teenClass": 90,
  "group.level1Package": 360,
  "group.level1Class": 95,
  "group.level2Package": 450,
  "group.level2Class": 95,
  "group.level2Rejoin": 25,
  "group.level3Package": 450,
  "group.reactivityPackage": 360,
  "group.reactivityClass": 95,
  "apprenticeship.program": 3000,
  "deposit.puppySocial": 30,
  "deposit.consultation": 30,
} as const

export type PriceId = keyof typeof PRICE_DEFAULTS

const published = ((publishedEdits as { prices?: Record<string, unknown> }).prices ?? {}) as Record<string, unknown>

/** His published price, else the default. Only whole, positive dollar amounts are ever used. */
export function priceOf(id: PriceId): number {
  const value = published[id]
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 100_000 ? value : PRICE_DEFAULTS[id]
}

/** "$1,234": the way the English copy writes a price (French is derived from it). */
export function usd(id: PriceId): string {
  return `$${priceOf(id).toLocaleString("en-US")}`
}

/** "1 234 $": for the few places whose French is written out rather than translated. */
export function frenchDollars(id: PriceId): string {
  return `${priceOf(id).toLocaleString("en-US").replace(/,/g, " ")} $`
}

export function centsOf(id: PriceId): number {
  return priceOf(id) * 100
}
