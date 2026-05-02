import type { SquareServiceConfig } from "@/lib/square-service-config"

type ConfigSlice = Pick<
  SquareServiceConfig,
  "groupProgramSlotOrder" | "groupProgramLabels" | "groupProgramSquareUrls" | "programs" | "groupClassSeriesVariations"
>

export const KNOWN_GROUP_PROGRAM_LABELS: Record<string, string> = {
  "puppy-socialization-class": "Puppy Socialization Class",
  "teen-puppy-class": "Teen Puppy Class",
  "reactivity-group-class": "Reactivity Group Class",
  "level-1-obedience-class": "Level 1 Obedience Class",
  "level-2-obedience-class": "Level 2 Obedience Class",
  "level-3-obedience-class": "Level 3 Obedience Class",
  "puppy-training": "Puppy Socialization Class",
  reactivity: "Reactivity Group Class",
  obedience: "Level 1 Obedience Class",
}

export function migratedGroupProgramSlotOrder(config: ConfigSlice): string[] {
  const stored = (config.groupProgramSlotOrder || [])
    .filter((id) => typeof id === "string" && id.trim())
    .map((id) => id.trim())
  if (stored.length > 0) return stored

  const keys = new Set([
    ...Object.keys(config.groupProgramLabels || {}),
    ...Object.keys(config.groupProgramSquareUrls || {}),
    ...Object.keys(config.programs || {}),
    ...Object.keys(config.groupClassSeriesVariations || {}),
  ])
  return [...keys].sort()
}

export function groupProgramSlotLabel(programId: string, slotOrder: string[]): string {
  const id = programId.trim()
  if (KNOWN_GROUP_PROGRAM_LABELS[id]) return KNOWN_GROUP_PROGRAM_LABELS[id]
  const i = slotOrder.indexOf(id)
  if (i >= 0) return `Group class #${i + 1}`
  return id
}

export function allowedGroupProgramIdsFromConfig(config: ConfigSlice): Set<string> {
  const set = new Set(migratedGroupProgramSlotOrder(config))
  for (const k of Object.keys(config.programs || {})) {
    const t = k.trim()
    if (t) set.add(t)
  }
  for (const k of Object.keys(config.groupClassSeriesVariations || {})) {
    const t = k.trim()
    if (t) set.add(t)
  }
  for (const k of Object.keys(config.groupProgramLabels || {})) {
    const t = k.trim()
    if (t) set.add(t)
  }
  for (const k of Object.keys(config.groupProgramSquareUrls || {})) {
    const t = k.trim()
    if (t) set.add(t)
  }
  return set
}
