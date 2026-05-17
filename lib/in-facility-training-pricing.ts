/** MTL Canine Training — in-facility price list (CAD, + tax). */

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

export const IN_FACILITY_PRICING_SECTIONS: InFacilityPriceSection[] = [
  {
    title: "Consultation",
    rows: [
      { label: "In-Facility Consultation (2–5 months)", price: "$135 + tax" },
      { label: "In-Facility Consultation (5 months +)", price: "$145 + tax" },
    ],
  },
  {
    title: "Private Classes",
    rows: [
      { label: "Option A — 3 classes", price: "$390 + tax" },
      { label: "Option B — 5 classes", price: "$620 + tax" },
      { label: "Option C — 7 classes", price: "$820 + tax" },
      { label: "Option A — Puppy — 3 classes", price: "$360 + tax", note: "Option B & C not available for puppies." },
      { label: "Private class / unit", price: "$140 + tax" },
      { label: "Private class / unit (2–5 months)", price: "$130 + tax" },
    ],
  },
  {
    title: "Group Classes — Package Rates",
    rows: [
      { label: "Puppy socialization (2–5 months)", price: "$50 + tax" },
      { label: "Teen puppy group — 4 classes", price: "$350 + tax" },
      { label: "Level 1 Obedience — 4 classes", price: "$360 + tax" },
      { label: "Level 2 Obedience — 5 classes", price: "$450 + tax" },
      { label: "Reactivity group class — 4 classes", price: "$360 + tax" },
    ],
  },
  {
    title: "Group Classes — Individual Rates",
    rows: [
      { label: "Teen puppy group — 1 class", price: "$90 + tax" },
      { label: "Level 1 Obedience — 1 class", price: "$95 + tax" },
      { label: "Level 2 Obedience — 1 class", price: "$95 + tax" },
      { label: "Reactivity group class — 1 class", price: "$95 + tax" },
    ],
  },
]

/** Sections shown on the group-classes page (packages + drop-ins). */
export const GROUP_CLASS_PRICING_SECTIONS: InFacilityPriceSection[] =
  IN_FACILITY_PRICING_SECTIONS.filter((s) => s.title.startsWith("Group Classes"))

/**
 * Summary on `/services` group card only — full breakdown lives on `/group-classes`.
 * Span = lowest package (puppy drop-in) through highest multi-class package (Level 2).
 */
export const GROUP_CLASSES_SERVICES_CARD_RANGE = "$50–$450 + tax"

/** `/services` consultation card — detail on `/services/consultation`. */
export const CONSULTATION_SERVICES_CARD_RANGE = "$135–$145 + tax"

/**
 * `/services` private training card — detail on `/services/private-classes`.
 * Span = lowest single-session rate through highest multi-session package.
 */
export const PRIVATE_TRAINING_SERVICES_CARD_RANGE = "$130–$820 + tax"
