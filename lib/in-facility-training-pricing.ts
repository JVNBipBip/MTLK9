/** MTL Canine Training — in-facility price list (CAD, + tax). Amounts come from lib/prices.ts (owner-editable). */

import { PUBLISHED_PRICES, usd as usdOf, usdCompareAt, type PriceBook, type PriceId } from "@/lib/prices"

export const IN_FACILITY_BRAND = "MTL Canine Training"

export const IN_FACILITY_HEADER = "In-Facility Training"

export type InFacilityPriceRow = {
  label: string
  price: string
  /** "$400" when on sale: shown crossed out before the price, with a Sale badge. */
  compareAt?: string
  note?: string
}

export type InFacilityPriceSection = {
  title: string
  rows: InFacilityPriceRow[]
}

/** The price list, built from a price source (his drafts while he edits; published prices otherwise). */
export function buildInFacilityPricingSections(book: PriceBook = PUBLISHED_PRICES): InFacilityPriceSection[] {
  const usd = (id: PriceId) => usdOf(id, book.price)
  const sale = (id: PriceId) => {
    const compareAt = usdCompareAt(id, book)
    return compareAt ? { compareAt } : {}
  }
  return [
  {
    title: "Consultation",
    rows: [
      { label: "In-Facility Consultation (2–5 months)", price: `${usd("consultation.young")} + tax`, ...sale("consultation.young") },
      { label: "In-Facility Consultation (5 months +)", price: `${usd("consultation.adult")} + tax`, ...sale("consultation.adult") },
    ],
  },
  {
    title: "Private Classes",
    rows: [
      { label: "Option A — 3 classes", price: `${usd("private.packA")} + tax`, ...sale("private.packA") },
      { label: "Option B — 5 classes", price: `${usd("private.packB")} + tax`, ...sale("private.packB") },
      { label: "Option C — 7 classes", price: `${usd("private.packC")} + tax`, ...sale("private.packC") },
      { label: "Option A — Puppy — 3 classes", price: `${usd("private.puppyPackA")} + tax`, ...sale("private.puppyPackA"), note: "Option B & C not available for puppies." },
      { label: "Private class / unit", price: `${usd("private.unit")} + tax`, ...sale("private.unit") },
      { label: "Private class / unit (2–5 months)", price: `${usd("private.unitYoung")} + tax`, ...sale("private.unitYoung") },
    ],
  },
  {
    title: "Group Classes — Package Rates",
    rows: [
      { label: "Puppy socialization (10–20 weeks)", price: `${usd("group.puppySocial")} + tax`, ...sale("group.puppySocial") },
      { label: "Teen puppy group — 4 classes", price: `${usd("group.teenPackage")} + tax`, ...sale("group.teenPackage") },
      { label: "Level 1 Obedience — 4 classes", price: `${usd("group.level1Package")} + tax`, ...sale("group.level1Package") },
      { label: "Level 2 Obedience — 5 classes", price: `${usd("group.level2Package")} + tax`, ...sale("group.level2Package") },
      { label: "Level 3 Obedience — 5 classes", price: `${usd("group.level3Package")} + tax`, ...sale("group.level3Package") },
      { label: "Reactivity group class — 4 classes", price: `${usd("group.reactivityPackage")} + tax`, ...sale("group.reactivityPackage") },
    ],
  },
  {
    title: "Group Classes — Individual Rates",
    rows: [
      { label: "Teen puppy group — 1 class", price: `${usd("group.teenClass")} + tax`, ...sale("group.teenClass") },
      { label: "Level 1 Obedience — 1 class", price: `${usd("group.level1Class")} + tax`, ...sale("group.level1Class") },
      { label: "Level 2 Obedience — 1 class", price: `${usd("group.level2Class")} + tax`, ...sale("group.level2Class") },
      { label: "Reactivity group class — 1 class", price: `${usd("group.reactivityClass")} + tax`, ...sale("group.reactivityClass") },
    ],
  },
  ]
}

export const IN_FACILITY_PRICING_SECTIONS: InFacilityPriceSection[] = buildInFacilityPricingSections()

/** Sections shown on the group-classes page (packages + drop-ins). */
export const GROUP_CLASS_PRICING_SECTIONS: InFacilityPriceSection[] =
  IN_FACILITY_PRICING_SECTIONS.filter((s) => s.title.startsWith("Group Classes"))
