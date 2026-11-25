/** MTL Canine Training — in-facility price list (CAD, + tax). Amounts come from lib/prices.ts (owner-editable). */

import { priceOf, usd as usdOf, type PriceId, type PriceSource } from "@/lib/prices"

export const IN_FACILITY_BRAND = "MTL Canine Training"

export const IN_FACILITY_HEADER = "In-Facility Training"

export type InFacilityPriceRow = {
  label: string
  price: string
  note?: string
}

export type InFacilityPriceSection = {
  title: string
  rows: InFacilityPriceRow[]
}

/** The price list, built from a price source (his drafts while he edits; published prices otherwise). */
export function buildInFacilityPricingSections(price: PriceSource = priceOf): InFacilityPriceSection[] {
  const usd = (id: PriceId) => usdOf(id, price)
  return [
  {
    title: "Consultation",
    rows: [
      { label: "In-Facility Consultation (2–5 months)", price: `${usd("consultation.young")} + tax` },
      { label: "In-Facility Consultation (5 months +)", price: `${usd("consultation.adult")} + tax` },
    ],
  },
  {
    title: "Private Classes",
    rows: [
      { label: "Option A — 3 classes", price: `${usd("private.packA")} + tax` },
      { label: "Option B — 5 classes", price: `${usd("private.packB")} + tax` },
      { label: "Option C — 7 classes", price: `${usd("private.packC")} + tax` },
      { label: "Option A — Puppy — 3 classes", price: `${usd("private.puppyPackA")} + tax`, note: "Option B & C not available for puppies." },
      { label: "Private class / unit", price: `${usd("private.unit")} + tax` },
      { label: "Private class / unit (2–5 months)", price: `${usd("private.unitYoung")} + tax` },
    ],
  },
  {
    title: "Group Classes — Package Rates",
    rows: [
      { label: "Puppy socialization (10–20 weeks)", price: `${usd("group.puppySocial")} + tax` },
      { label: "Teen puppy group — 4 classes", price: `${usd("group.teenPackage")} + tax` },
      { label: "Level 1 Obedience — 4 classes", price: `${usd("group.level1Package")} + tax` },
      { label: "Level 2 Obedience — 5 classes", price: `${usd("group.level2Package")} + tax` },
      { label: "Level 3 Obedience — 5 classes", price: `${usd("group.level3Package")} + tax` },
      { label: "Reactivity group class — 4 classes", price: `${usd("group.reactivityPackage")} + tax` },
    ],
  },
  {
    title: "Group Classes — Individual Rates",
    rows: [
      { label: "Teen puppy group — 1 class", price: `${usd("group.teenClass")} + tax` },
      { label: "Level 1 Obedience — 1 class", price: `${usd("group.level1Class")} + tax` },
      { label: "Level 2 Obedience — 1 class", price: `${usd("group.level2Class")} + tax` },
      { label: "Reactivity group class — 1 class", price: `${usd("group.reactivityClass")} + tax` },
    ],
  },
  ]
}

export const IN_FACILITY_PRICING_SECTIONS: InFacilityPriceSection[] = buildInFacilityPricingSections()

/** Sections shown on the group-classes page (packages + drop-ins). */
export const GROUP_CLASS_PRICING_SECTIONS: InFacilityPriceSection[] =
  IN_FACILITY_PRICING_SECTIONS.filter((s) => s.title.startsWith("Group Classes"))
