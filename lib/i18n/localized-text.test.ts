import { GROUP_CLASS_OFFERINGS } from "@/lib/group-class-offerings"
import {
  GROUP_CLASS_PRICING_SECTIONS,
  IN_FACILITY_PRICING_SECTIONS,
} from "@/lib/in-facility-training-pricing"
import { getLocalizedText } from "@/lib/i18n/localized-text"

const PRICE = /\$\d[\d,]*/

describe("getLocalizedText", () => {
  it("leaves English untouched", () => {
    expect(getLocalizedText("en", "Cost: $30 + tax per class")).toBe(
      "Cost: $30 + tax per class",
    )
  })

  it("translates a string that carries no price", () => {
    expect(getLocalizedText("fr", "Drop-in class")).toBe("Cours à la carte")
  })

  it("writes the price the Quebec French way", () => {
    expect(getLocalizedText("fr", "Cost: $30 + tax per class")).toBe(
      "Coût : 30 $ + taxes par cours",
    )
  })

  it("serves different prices from one template", () => {
    expect(getLocalizedText("fr", "$135+tx | 75 minutes")).toBe(
      "135 $ + taxes | 75 minutes",
    )
    expect(getLocalizedText("fr", "$145+tx | 75 minutes")).toBe(
      "145 $ + taxes | 75 minutes",
    )
  })

  /**
   * The bug this design exists to prevent: before, the French copy held its own
   * copy of the figure, so changing the English price quoted French visitors the
   * old one with no build error.
   */
  it("follows a price change into French with no edit to the table", () => {
    expect(getLocalizedText("fr", "Cost: $45 + tax per class")).toBe(
      "Coût : 45 $ + taxes par cours",
    )
    expect(getLocalizedText("fr", "Package: 4 classes · $375 + tax")).toBe(
      "Forfait : 4 cours · 375 $ + taxes",
    )
  })

  it("falls back to English when no template matches", () => {
    expect(getLocalizedText("fr", "Cost: $30 per fortnight")).toBe(
      "Cost: $30 per fortnight",
    )
    expect(getLocalizedText("fr", "Nobody translated this")).toBe(
      "Nobody translated this",
    )
  })
})

/**
 * Keeps the price templates in step with the copy that uses them. A new price
 * string with no matching template renders in English on the French site, and
 * nothing else would catch it.
 */
describe("price strings in the published copy", () => {
  function strings(value: unknown, out: string[] = []): string[] {
    if (typeof value === "string") out.push(value)
    else if (Array.isArray(value)) for (const item of value) strings(item, out)
    else if (value && typeof value === "object")
      for (const item of Object.values(value)) strings(item, out)
    return out
  }

  const priceStrings = [
    ...new Set(
      [
        ...strings(GROUP_CLASS_OFFERINGS),
        ...strings(IN_FACILITY_PRICING_SECTIONS),
        ...strings(GROUP_CLASS_PRICING_SECTIONS),
      ].filter((text) => PRICE.test(text)),
    ),
  ]

  it("has price strings to check", () => {
    expect(priceStrings.length).toBeGreaterThan(10)
  })

  it("translates every one of them", () => {
    const untranslated = priceStrings.filter(
      (text) => getLocalizedText("fr", text) === text,
    )
    expect(untranslated).toEqual([])
  })
})
