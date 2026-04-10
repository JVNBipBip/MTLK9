import { groupProgramSlotLabel } from "@/lib/group-program-slots"

export const LEGACY_GROUP_PROGRAM_LABELS: Record<string, string> = {
  "puppy-foundations": "Puppy Foundations",
  "city-manners": "City Manners",
  "reactivity-anxiety": "Reactivity & Anxiety",
  "high-risk": "High-Risk Behaviors",
  "day-training": "Day Training",
}

/** @deprecated Prefer `programLabel(id, slotOrder)` with service config slot order. */
export const PROGRAM_LABEL_BY_ID = LEGACY_GROUP_PROGRAM_LABELS

export function programLabel(programId?: string, slotOrder?: string[]) {
  if (!programId) return "-"
  if (slotOrder?.length) {
    const i = slotOrder.indexOf(programId)
    if (i >= 0) return groupProgramSlotLabel(programId, slotOrder)
  }
  return LEGACY_GROUP_PROGRAM_LABELS[programId] || programId
}
