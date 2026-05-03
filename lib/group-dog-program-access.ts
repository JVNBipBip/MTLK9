import { getAdminDb } from "@/lib/firebase-admin"
import { currentGroupClassProgramIds } from "@/lib/group-class-programs"
import { programLabel } from "@/lib/programs"
import {
  clientBookingSettingsRef,
  clientGroupAccessCollection,
} from "@/lib/client-records"

export function normalizedDogKey(dogName: string) {
  return dogName.trim().toLowerCase()
}

export function isGroupProgramsAllFutureForDog(
  settingsData: { groupProgramsIncludeAllFutureByDog?: unknown } | undefined,
  dogKey: string,
): boolean {
  const m = settingsData?.groupProgramsIncludeAllFutureByDog
  if (!m || typeof m !== "object" || Array.isArray(m)) return false
  return Boolean((m as Record<string, boolean>)[dogKey])
}

export async function allConfiguredGroupProgramTypeIds(): Promise<string[]> {
  return currentGroupClassProgramIds()
}

async function mergeAllowedGroupProgramIds(
  explicitIds: string[],
  settingsData: { groupProgramsIncludeAllFutureByDog?: unknown } | undefined,
  dogKey: string,
): Promise<string[]> {
  const set = new Set(explicitIds.filter(Boolean))
  if (isGroupProgramsAllFutureForDog(settingsData, dogKey)) {
    for (const id of await allConfiguredGroupProgramTypeIds()) set.add(id)
  }
  return [...set]
}

type ApprovedGroupClassRow = {
  classTypeId: string
  classLabel: string
  squareServiceVariationId: string
}

/**
 * Group classes allowed for a client + dog on legacy booking links (consultation token flows).
 * Merges dog_class_access with "all current & future" from client_booking_settings when enabled.
 */
export async function buildApprovedGroupClassesForClientDog(
  clientIdNorm: string,
  dogNameExact: string,
): Promise<ApprovedGroupClassRow[]> {
  const db = getAdminDb()
  const dogKey = normalizedDogKey(dogNameExact)

  const [nestedSettingsSnap, nestedClassAccessSnap] = await Promise.all([
    clientBookingSettingsRef(db, clientIdNorm).get(),
    clientGroupAccessCollection(db, clientIdNorm, dogNameExact).where("status", "==", "allowed").get(),
  ])

  const fromDoc = new Map<string, { classLabel: string; squareServiceVariationId: string }>()
  const explicitIds: string[] = []
  for (const doc of nestedClassAccessSnap.docs) {
    const data = doc.data() as { classTypeId?: string; classLabel?: string; squareServiceVariationId?: string }
    const classTypeId = String(data.classTypeId || "").trim()
    if (!classTypeId) continue
    explicitIds.push(classTypeId)
    fromDoc.set(classTypeId, {
      classLabel: String(data.classLabel || "").trim() || classTypeId,
      squareServiceVariationId: String(data.squareServiceVariationId || "").trim(),
    })
  }

  const settingsData = nestedSettingsSnap.data()
  const mergedIds = await mergeAllowedGroupProgramIds(explicitIds, settingsData, dogKey)
  if (mergedIds.length === 0) return []

  return mergedIds.map((classTypeId) => {
    const row = fromDoc.get(classTypeId)
    return {
      classTypeId,
      classLabel: row?.classLabel || programLabel(classTypeId),
      squareServiceVariationId: row?.squareServiceVariationId || "",
    }
  })
}
