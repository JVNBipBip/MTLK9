import { type PrivateLocationAccess, type PrivateTrainingAccess } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import { clientBookingSettingsRef } from "@/lib/client-records"

export function defaultPrivateLocationAccess(): PrivateLocationAccess {
  return "facility_only"
}

export function parsePrivateLocationAccess(raw: unknown): PrivateLocationAccess {
  if (raw === "facility_and_in_home") return "facility_and_in_home"
  return "facility_only"
}

export function inHomeBookingAllowed(access: PrivateLocationAccess): boolean {
  return access === "facility_and_in_home"
}

export function defaultPrivateTrainingAccess(): PrivateTrainingAccess {
  return "allowed"
}

export function parsePrivateTrainingAccess(raw: unknown): PrivateTrainingAccess {
  if (raw === "blocked") return "blocked"
  return "allowed"
}

export function privateTrainingBookingAllowed(access: PrivateTrainingAccess): boolean {
  return access !== "blocked"
}

export async function getClientPrivateLocationAccess(clientEmail: string): Promise<PrivateLocationAccess> {
  const clientId = clientEmail.trim().toLowerCase()
  if (!clientId) return defaultPrivateLocationAccess()
  const db = getAdminDb()
  const snap = await clientBookingSettingsRef(db, clientId).get()
  const data = snap.data()
  if (!data) return defaultPrivateLocationAccess()
  return parsePrivateLocationAccess(data.privateLocationAccess)
}
