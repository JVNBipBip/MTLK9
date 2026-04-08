export const PROGRAM_OPTIONS = [
  { id: "reactivity", label: "Reactivity Training" },
  { id: "private-classes", label: "Private Classes" },
  { id: "obedience", label: "Obedience Training" },
  { id: "puppy-training", label: "Puppy Training" },
  { id: "in-home", label: "In-Home Training" },
] as const

export const PROGRAM_LABEL_BY_ID = Object.fromEntries(PROGRAM_OPTIONS.map((item) => [item.id, item.label]))

export type ProgramId = (typeof PROGRAM_OPTIONS)[number]["id"]
