import { groupProgramSlotLabel, KNOWN_GROUP_PROGRAM_LABELS } from "@/lib/group-program-slots"

export const PROGRAM_OPTIONS = [
  { id: "reactivity", label: "Reactivity Training" },
  { id: "private-classes", label: "Private Classes" },
  { id: "obedience", label: "Obedience Training" },
  { id: "puppy-training", label: "Puppy Training" },
  { id: "in-home", label: "In-Home Training" },
] as const

export const PROGRAM_LABEL_BY_ID: Record<string, string> = {
  ...Object.fromEntries(PROGRAM_OPTIONS.map((item) => [item.id, item.label])),
  ...KNOWN_GROUP_PROGRAM_LABELS,
}

export type ProgramId = (typeof PROGRAM_OPTIONS)[number]["id"]

function titleCaseProgramId(programId: string): string {
  return programId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function programLabel(programId: string, slotOrder: string[] = []): string {
  const programIdTrimmed = programId.trim()
  if (!programIdTrimmed) return ""

  if (slotOrder.includes(programIdTrimmed)) {
    return groupProgramSlotLabel(programIdTrimmed, slotOrder)
  }

  return PROGRAM_LABEL_BY_ID[programIdTrimmed] || titleCaseProgramId(programIdTrimmed)
}
