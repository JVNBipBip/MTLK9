import fs from "node:fs"
import path from "node:path"
import registry from "@/content/editable-fields.json"
import publishedEdits from "@/content/site-edits.json"
import { PRICE_DEFAULTS, type PriceId } from "@/lib/prices"
import { frenchTextTranslations } from "@/lib/i18n/dom-translations"
import { IN_FACILITY_PRICING_SECTIONS } from "@/lib/in-facility-training-pricing"
import { GROUP_CLASS_OFFERINGS } from "@/lib/group-class-offerings"

type PriceField = { pages: string[]; section: string; label: string; default: number; min: number; max: number; chargedBy: string; below?: string }
const fields = (registry as unknown as { prices: Record<string, PriceField> }).prices
const ROOT = path.resolve(__dirname, "..")

function routeExists(page: string) {
  const dir = page === "/" ? path.join(ROOT, "app") : path.join(ROOT, "app", page)
  if (fs.existsSync(path.join(dir, "page.tsx"))) return true
  const parent = path.dirname(dir)
  return fs.existsSync(parent) && fs.readdirSync(parent).some((name) => /^\[.+\]$/.test(name) && fs.existsSync(path.join(parent, name, "page.tsx")))
}

describe("owner-editable prices", () => {
  it("registers exactly the prices the site uses, with the same defaults", () => {
    expect(Object.keys(fields).sort()).toEqual(Object.keys(PRICE_DEFAULTS).sort())
    for (const id of Object.keys(PRICE_DEFAULTS) as PriceId[]) expect(fields[id].default).toBe(PRICE_DEFAULTS[id])
  })

  it.each(Object.keys(fields))("%s is labelled, on real pages, and within its own limits", (id) => {
    const field = fields[id]
    expect(field.label.trim()).not.toBe("")
    expect(field.section.trim()).not.toBe("")
    for (const page of field.pages) expect(routeExists(page)).toBe(true)
    expect(Number.isInteger(field.min) && Number.isInteger(field.max)).toBe(true)
    expect(field.min).toBeGreaterThan(0)
    expect(field.min).toBeLessThanOrEqual(field.default)
    expect(field.max).toBeGreaterThanOrEqual(field.default)
    expect(["website", "square", "none"]).toContain(field.chargedBy)
    if (field.below) {
      expect(fields[field.below]).toBeDefined()
      expect(field.default).toBeLessThan(fields[field.below].default)
    }
  })

  it("published prices are whole dollars within their limits", () => {
    const prices = (publishedEdits as { prices?: Record<string, unknown> }).prices ?? {}
    for (const [id, value] of Object.entries(prices)) {
      const field = fields[id]
      expect(field).toBeDefined()
      expect(Number.isInteger(value)).toBe(true)
      expect(value as number).toBeGreaterThanOrEqual(field.min)
      expect(value as number).toBeLessThanOrEqual(field.max)
    }
  })

  it("every sentence carrying a price has a French template, so a new price still translates", () => {
    const sentences = [
      ...IN_FACILITY_PRICING_SECTIONS.flatMap((section) => section.rows.map((row) => row.price)),
      ...GROUP_CLASS_OFFERINGS.flatMap((offering) => [offering.packagePrice, offering.note, ...offering.bullets, ...(offering.classInfo ?? [])]),
      "$135+tx | 75 minutes",
    ].filter((text): text is string => Boolean(text) && /\$\d/.test(text!))
    const missing = [...new Set(sentences.map((text) => text.replace(/\$\d[\d,]*/g, "{price}")))].filter((key) => !frenchTextTranslations[key])
    expect(missing).toEqual([])
  })
})

describe("with prices he changed", () => {
  it("every sentence, the French and the deposit charge follow the new amounts", () => {
    jest.isolateModules(() => {
      jest.doMock("@/content/site-edits.json", () => ({ text: {}, images: {}, prices: { "group.level1Package": 1380, "deposit.puppySocial": 45, "consultation.young": 2.5, "daycare.halfDay": 42 } }))
      const { IN_FACILITY_PRICING_SECTIONS: rows } = jest.requireActual("@/lib/in-facility-training-pricing") as typeof import("@/lib/in-facility-training-pricing")
      const { getGroupClassOffering } = jest.requireActual("@/lib/group-class-offerings") as typeof import("@/lib/group-class-offerings")
      const { getLocalizedText } = jest.requireActual("@/lib/i18n/localized-text") as typeof import("@/lib/i18n/localized-text")
      const { PUPPY_SOCIAL_DROP_IN_DEPOSIT_CENTS } = jest.requireActual("@/lib/puppy-social-drop-in") as typeof import("@/lib/puppy-social-drop-in")

      const row = rows.flatMap((section) => section.rows).find((candidate) => candidate.label === "Level 1 Obedience — 4 classes")!
      expect(row.price).toBe("$1,380 + tax")
      const info = getGroupClassOffering("level-1-obedience-class")!.classInfo!.find((line) => line.startsWith("Package"))!
      expect(info).toBe("Package: 4 classes · $1,380 + tax")
      expect(getLocalizedText("fr", info)).toBe("Forfait : 4 cours · 1 380 $ + taxes")
      expect(PUPPY_SOCIAL_DROP_IN_DEPOSIT_CENTS).toBe(4500)
      // Daycare: the quote the checkout charges uses his amounts.
      const { quoteDaycare } = jest.requireActual("@/lib/daycare-pricing") as typeof import("@/lib/daycare-pricing")
      const quote = quoteDaycare("half", ["treadmill"], 1, false, Date.parse("2026-12-15T12:00:00-05:00"))
      expect(quote.totalCents).toBe(4200 + 1500)
      // Not a whole dollar amount: ignored, the default stays.
      const consult = rows.flatMap((section) => section.rows).find((candidate) => candidate.label.startsWith("In-Facility Consultation (2"))!
      expect(consult.price).toBe("$135 + tax")
    })
  })
})
