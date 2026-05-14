import { CLASS_SESSIONS_COLLECTION } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import { programLabel } from "@/lib/programs"

export type GroupClassProgramOption = {
  id: string
  label: string
}

export const CURRENT_GROUP_CLASS_PROGRAM_OPTIONS: GroupClassProgramOption[] = [
  { id: "puppy-socialization-class", label: "Puppy Socialization Class" },
  { id: "teen-puppy-class", label: "Teen Puppy Class" },
  { id: "reactivity-group-class", label: "Reactivity Group Class" },
  { id: "level-1-obedience-class", label: "Level 1 Obedience Class" },
  { id: "level-2-obedience-class", label: "Level 2 Obedience Class" },
  { id: "level-3-obedience-class", label: "Level 3 Obedience Class" },
]

const DEPRECATED_GROUP_CLASS_TYPE_IDS = new Set(["puppy-foundations"])

/** Legacy Firestore `classType` values map to the current program id used for access checks and Square. */
export function canonicalGroupClassTypeId(classType: string): string {
  const t = String(classType || "").trim()
  if (t === "puppy-foundations") return "puppy-socialization-class"
  return t
}

/**
 * When admin omits `seriesId`, the portal still lists the session using this synthetic id.
 * Checkout resolves it by loading `class_sessions/{docId}` directly.
 */
export const SINGLE_SESSION_SERIES_PREFIX = "single:" as const

export function effectiveSeriesIdForSession(sessionDocId: string, seriesId?: string | null): string {
  const sid = String(seriesId ?? "").trim()
  if (sid) return sid
  return `${SINGLE_SESSION_SERIES_PREFIX}${sessionDocId}`
}

export function parseSingleSessionSeriesId(seriesId: string): string | null {
  if (!seriesId.startsWith(SINGLE_SESSION_SERIES_PREFIX)) return null
  const id = seriesId.slice(SINGLE_SESSION_SERIES_PREFIX.length).trim()
  return id || null
}

/** Whether the dog's allowed group program ids cover this session `classType` (legacy ids included). */
export function dogHasAccessToGroupClassType(allowed: Set<string>, sessionClassTypeRaw: string): boolean {
  const raw = String(sessionClassTypeRaw || "").trim()
  if (!raw) return false
  const canonical = canonicalGroupClassTypeId(raw)
  if (allowed.has(raw) || allowed.has(canonical)) return true
  if (canonical === "puppy-socialization-class" && allowed.has("puppy-foundations")) return true
  return false
}

function clean(value: unknown) {
  return String(value || "").trim()
}

export async function groupClassProgramOptionsFromSessions(extraIds: string[] = []): Promise<GroupClassProgramOption[]> {
  const db = getAdminDb()
  const snap = await db.collection(CLASS_SESSIONS_COLLECTION).orderBy("startsAtIso", "asc").limit(500).get()
  const labelById = new Map<string, string>()

  for (const option of CURRENT_GROUP_CLASS_PROGRAM_OPTIONS) {
    labelById.set(option.id, option.label)
  }

  for (const doc of snap.docs) {
    const data = doc.data() as { classType?: unknown; title?: unknown }
    const id = clean(data.classType)
    if (!id || labelById.has(id) || DEPRECATED_GROUP_CLASS_TYPE_IDS.has(id)) continue
    const fallbackLabel = programLabel(id)
    labelById.set(id, fallbackLabel && fallbackLabel !== id ? fallbackLabel : clean(data.title) || id)
  }

  for (const id of extraIds.map((item) => item.trim()).filter(Boolean)) {
    if (DEPRECATED_GROUP_CLASS_TYPE_IDS.has(id)) continue
    if (!labelById.has(id)) labelById.set(id, programLabel(id) || id)
  }

  return [...labelById.entries()].map(([id, label]) => ({ id, label }))
}

export function currentGroupClassProgramOptions(): GroupClassProgramOption[] {
  return CURRENT_GROUP_CLASS_PROGRAM_OPTIONS
}

export async function groupClassProgramIdsFromSessions(extraIds: string[] = []): Promise<string[]> {
  return (await groupClassProgramOptionsFromSessions(extraIds)).map((option) => option.id)
}

export function currentGroupClassProgramIds(): string[] {
  return CURRENT_GROUP_CLASS_PROGRAM_OPTIONS.map((option) => option.id)
}
