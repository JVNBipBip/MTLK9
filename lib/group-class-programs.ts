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

function clean(value: unknown) {
  return String(value || "").trim()
}

export async function groupClassProgramOptionsFromSessions(extraIds: string[] = []): Promise<GroupClassProgramOption[]> {
  const db = getAdminDb()
  const snap = await db.collection(CLASS_SESSIONS_COLLECTION).orderBy("startsAtIso", "asc").limit(500).get()
  const labelById = new Map<string, string>()

  for (const doc of snap.docs) {
    const data = doc.data() as { classType?: unknown; title?: unknown }
    const id = clean(data.classType)
    if (!id || labelById.has(id)) continue
    const fallbackLabel = programLabel(id)
    labelById.set(id, fallbackLabel && fallbackLabel !== id ? fallbackLabel : clean(data.title) || id)
  }

  for (const id of extraIds.map((item) => item.trim()).filter(Boolean)) {
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
