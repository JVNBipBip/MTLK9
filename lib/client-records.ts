import { FieldValue, type Firestore, type QueryDocumentSnapshot } from "firebase-admin/firestore"
import { normalizePhoneForMatch } from "@/lib/contact-normalize"
import { CLIENTS_COLLECTION } from "@/lib/domain"

export const CLIENT_CONSULTATIONS_SUBCOLLECTION = "consultations"
export const CLIENT_BOOKINGS_SUBCOLLECTION = "bookings"
export const CLIENT_DOGS_SUBCOLLECTION = "dogs"
export const CLIENT_GROUP_ACCESS_SUBCOLLECTION = "group_access"
export const CLIENT_PRIVATE_PACKAGES_SUBCOLLECTION = "private_packages"
export const CLIENT_CONTRACT_ACCEPTANCES_SUBCOLLECTION = "contract_acceptances"
export const CLIENT_SETTINGS_SUBCOLLECTION = "settings"
export const CLIENT_SQUARE_SUBCOLLECTION = "square"

export function normalizedClientId(clientEmail: string) {
  return clientEmail.trim().toLowerCase()
}

export function clientDocId(clientEmail: string) {
  return normalizedClientId(clientEmail)
}

export function dogDocId(dogName: string) {
  return dogName.trim().toLowerCase().replace(/[/.#$[\]]/g, "_") || "unknown"
}

export function clientDocRef(db: Firestore, clientEmail: string) {
  return db.collection(CLIENTS_COLLECTION).doc(clientDocId(clientEmail))
}

export function clientDogRef(db: Firestore, clientEmail: string, dogName: string) {
  return clientDocRef(db, clientEmail).collection(CLIENT_DOGS_SUBCOLLECTION).doc(dogDocId(dogName))
}

export function clientConsultationRef(db: Firestore, clientEmail: string, id?: string) {
  const coll = clientDocRef(db, clientEmail).collection(CLIENT_CONSULTATIONS_SUBCOLLECTION)
  return id ? coll.doc(id) : coll.doc()
}

export function clientConsultationsCollection(db: Firestore, clientEmail: string) {
  return clientDocRef(db, clientEmail).collection(CLIENT_CONSULTATIONS_SUBCOLLECTION)
}

export function clientBookingRef(db: Firestore, clientEmail: string, id?: string) {
  const coll = clientDocRef(db, clientEmail).collection(CLIENT_BOOKINGS_SUBCOLLECTION)
  return id ? coll.doc(id) : coll.doc()
}

export function clientBookingsCollection(db: Firestore, clientEmail: string) {
  return clientDocRef(db, clientEmail).collection(CLIENT_BOOKINGS_SUBCOLLECTION)
}

export function clientPrivatePackageRef(db: Firestore, clientEmail: string, dogName: string, id?: string) {
  const coll = clientDogRef(db, clientEmail, dogName).collection(CLIENT_PRIVATE_PACKAGES_SUBCOLLECTION)
  return id ? coll.doc(id) : coll.doc()
}

export function clientGroupAccessRef(db: Firestore, clientEmail: string, dogName: string, programId: string) {
  return clientDogRef(db, clientEmail, dogName)
    .collection(CLIENT_GROUP_ACCESS_SUBCOLLECTION)
    .doc(programId.trim().toLowerCase())
}

export function clientGroupAccessCollection(db: Firestore, clientEmail: string, dogName: string) {
  return clientDogRef(db, clientEmail, dogName).collection(CLIENT_GROUP_ACCESS_SUBCOLLECTION)
}

export function clientContractAcceptanceRef(db: Firestore, clientEmail: string, id?: string) {
  const coll = clientDocRef(db, clientEmail).collection(CLIENT_CONTRACT_ACCEPTANCES_SUBCOLLECTION)
  return id ? coll.doc(id) : coll.doc()
}

export function clientBookingSettingsRef(db: Firestore, clientEmail: string) {
  return clientDocRef(db, clientEmail).collection(CLIENT_SETTINGS_SUBCOLLECTION).doc("booking")
}

export function clientSquareLinkRef(db: Firestore, clientEmail: string) {
  return clientDocRef(db, clientEmail).collection(CLIENT_SQUARE_SUBCOLLECTION).doc("link")
}

function docMatchesId(doc: QueryDocumentSnapshot, id: string) {
  if (doc.id === id) return true
  return String((doc.data() as { id?: unknown }).id || "") === id
}

export async function queryClientSubcollectionDocsByField(
  db: Firestore,
  subcollectionName: string,
  fieldPath: string,
  value: string,
  limit: number,
): Promise<QueryDocumentSnapshot[]> {
  try {
    const snap = await db.collectionGroup(subcollectionName).where(fieldPath, "==", value).limit(limit).get()
    return snap.docs
  } catch {
    // Fall back to scanning clients when a collection-group index is unavailable.
  }
  const clientsSnap = await db.collection(CLIENTS_COLLECTION).limit(1000).get()
  const snaps = await Promise.all(
    clientsSnap.docs.map(async (doc) => {
      try {
        return await doc.ref.collection(subcollectionName).where(fieldPath, "==", value).limit(limit).get()
      } catch {
        return { docs: [] as QueryDocumentSnapshot[] }
      }
    }),
  )
  return snaps.flatMap((snap) => snap.docs).slice(0, limit)
}

export async function listClientSubcollectionDocs(
  db: Firestore,
  subcollectionName: string,
  perClientLimit = 100,
): Promise<QueryDocumentSnapshot[]> {
  const clientsSnap = await db.collection(CLIENTS_COLLECTION).limit(1000).get()
  const snaps = await Promise.all(
    clientsSnap.docs.map(async (doc) => {
      try {
        return await doc.ref.collection(subcollectionName).limit(perClientLimit).get()
      } catch {
        return { docs: [] as QueryDocumentSnapshot[] }
      }
    }),
  )
  return snaps.flatMap((snap) => snap.docs)
}

export async function findClientConsultationByAccessTokenHash(
  db: Firestore,
  tokenHash: string,
  consultationId?: string,
) {
  const tokenDocs = await queryClientSubcollectionDocsByField(
    db,
    CLIENT_CONSULTATIONS_SUBCOLLECTION,
    "bookingAccess.tokenHash",
    tokenHash,
    10,
  )
  const docs = consultationId ? tokenDocs.filter((doc) => docMatchesId(doc, consultationId)) : tokenDocs
  return docs[0] || null
}

export async function findClientConsultationByDepositResumeTokenHash(db: Firestore, tokenHash: string) {
  const tokenDocs = await queryClientSubcollectionDocsByField(
    db,
    CLIENT_CONSULTATIONS_SUBCOLLECTION,
    "depositResumeAccess.tokenHash",
    tokenHash,
    10,
  )
  return tokenDocs[0] || null
}

export async function findClientBookingById(db: Firestore, bookingId: string) {
  if (!bookingId) return null
  const docs = await queryClientSubcollectionDocsByField(db, CLIENT_BOOKINGS_SUBCOLLECTION, "id", bookingId, 1)
  return docs[0]?.ref || null
}

export async function findClientConsultationById(db: Firestore, consultationId: string) {
  const id = consultationId.trim()
  if (!id) return null
  const docs = await queryClientSubcollectionDocsByField(db, CLIENT_CONSULTATIONS_SUBCOLLECTION, "id", id, 1)
  if (docs[0]) return docs[0]
  const clientsSnap = await db.collection(CLIENTS_COLLECTION).limit(1000).get()
  const refs = clientsSnap.docs.map((doc) => doc.ref.collection(CLIENT_CONSULTATIONS_SUBCOLLECTION).doc(id))
  const snaps = refs.length ? await db.getAll(...refs) : []
  return snaps.find((doc) => doc.exists) || null
}

function normalizedLocale(value: string | null | undefined) {
  const locale = value?.trim().toLowerCase()
  return locale === "en" || locale === "fr" ? locale : null
}

export async function upsertClientProfile(
  db: Firestore,
  input: {
    clientEmail: string
    clientName?: string
    clientPhone?: string
    dogName?: string
    squareCustomerId?: string | null
    source?: string
    preferredLocale?: string | null
  },
) {
  const clientId = normalizedClientId(input.clientEmail)
  if (!clientId) return null
  const nowIso = new Date().toISOString()
  const clientPatch: Record<string, unknown> = {
    id: clientId,
    clientId,
    clientEmail: clientId,
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtIso: nowIso,
  }
  if (input.clientName?.trim()) clientPatch.clientName = input.clientName.trim()
  if (input.clientPhone?.trim()) {
    clientPatch.clientPhone = input.clientPhone.trim()
    const digits = normalizePhoneForMatch(input.clientPhone)
    if (digits) clientPatch.clientPhoneNormalized = digits
  }
  if (input.squareCustomerId) clientPatch.squareCustomerId = input.squareCustomerId
  if (input.source) clientPatch.lastSource = input.source
  const locale = normalizedLocale(input.preferredLocale)
  if (locale) {
    clientPatch.preferredLocale = locale
    clientPatch.websiteLocale = locale
    clientPatch.preferredLanguage = locale === "fr" ? "French" : "English"
    clientPatch.preferredLocaleUpdatedAtIso = nowIso
  }

  await clientDocRef(db, clientId).set(
    {
      ...clientPatch,
      createdAt: FieldValue.serverTimestamp(),
      createdAtIso: nowIso,
    },
    { merge: true },
  )

  const dogName = input.dogName?.trim()
  if (dogName) {
    await clientDogRef(db, clientId, dogName).set(
      {
        id: dogDocId(dogName),
        dogKey: dogDocId(dogName),
        dogName,
        clientId,
        clientEmail: clientId,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtIso: nowIso,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  }
  return clientDocRef(db, clientId)
}
