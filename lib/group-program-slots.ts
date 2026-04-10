import type { SquareServiceConfig } from "@/lib/square-service-config"

export const LEGACY_GROUP_PROGRAM_ORDER = [
  "puppy-foundations",
  "city-manners",
  "reactivity-anxiety",
  "high-risk",
  "day-training",
] as const

type ConfigSlice = Pick<
  SquareServiceConfig,
  "groupProgramSlotOrder" | "groupProgramLabels" | "groupProgramSquareUrls" | "programs" | "groupClassSeriesVariations"
>

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
  const legacy = LEGACY_GROUP_PROGRAM_ORDER.filter((id) => keys.has(id))
  const rest = [...keys].filter(
    (k) => !LEGACY_GROUP_PROGRAM_ORDER.includes(k as (typeof LEGACY_GROUP_PROGRAM_ORDER)[number]),
  )
  rest.sort()
  return [...legacy, ...rest]
}

export function groupProgramSlotLabel(programId: string, slotOrder: string[]): string {
  const i = slotOrder.indexOf(programId)
  if (i >= 0) return `Group class #${i + 1}`
  return programId
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
