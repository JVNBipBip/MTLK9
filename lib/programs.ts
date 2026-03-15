export const PROGRAM_OPTIONS = [
  { id: "puppy-foundations", label: "Puppy Foundations" },
  { id: "city-manners", label: "City Manners" },
  { id: "reactivity-anxiety", label: "Reactivity & Anxiety" },
  { id: "high-risk", label: "High-Risk Behaviors" },
  { id: "day-training", label: "Day Training" },
] as const

export const PROGRAM_LABEL_BY_ID = Object.fromEntries(PROGRAM_OPTIONS.map((item) => [item.id, item.label]))

export type ProgramId = (typeof PROGRAM_OPTIONS)[number]["id"]
