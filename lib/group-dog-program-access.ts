import { CLIENT_BOOKING_SETTINGS_COLLECTION, DOG_CLASS_ACCESS_COLLECTION, clientBookingSettingsDocId } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import { currentGroupClassProgramIds } from "@/lib/group-class-programs"
import { programLabel } from "@/lib/programs"

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

  const [settingsSnap, classAccessSnap] = await Promise.all([
    db.collection(CLIENT_BOOKING_SETTINGS_COLLECTION).doc(clientBookingSettingsDocId(clientIdNorm)).get(),
    db
      .collection(DOG_CLASS_ACCESS_COLLECTION)
      .where("clientId", "==", clientIdNorm)
      .where("dogName", "==", dogNameExact)
      .where("status", "==", "allowed")
      .get(),
  ])

  const fromDoc = new Map<string, { classLabel: string; squareServiceVariationId: string }>()
  const explicitIds: string[] = []
  for (const doc of classAccessSnap.docs) {
    const data = doc.data() as { classTypeId?: string; classLabel?: string; squareServiceVariationId?: string }
    const classTypeId = String(data.classTypeId || "").trim()
    if (!classTypeId) continue
    explicitIds.push(classTypeId)
    fromDoc.set(classTypeId, {
      classLabel: String(data.classLabel || "").trim() || classTypeId,
      squareServiceVariationId: String(data.squareServiceVariationId || "").trim(),
    })
  }

  const mergedIds = await mergeAllowedGroupProgramIds(explicitIds, settingsSnap.data(), dogKey)
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
