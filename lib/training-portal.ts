import {
  CLASS_SESSIONS_COLLECTION,
  PRIVATE_TRAINING_PACKAGES_COLLECTION,
  SQUARE_CUSTOMERS_COLLECTION,
  type PrivateLocationAccess,
  type PrivateTrainingAccess,
} from "@/lib/domain"
import { parsePrivateLocationAccess, parsePrivateTrainingAccess } from "@/lib/client-booking-settings"
import { getAdminDb } from "@/lib/firebase-admin"
import { allConfiguredGroupProgramTypeIds, isGroupProgramsAllFutureForDog } from "@/lib/group-dog-program-access"
import {
  CLIENT_DOGS_SUBCOLLECTION,
  CLIENT_PRIVATE_PACKAGES_SUBCOLLECTION,
  clientBookingsCollection,
  clientBookingSettingsRef,
  clientConsultationsCollection,
  clientDocRef,
  clientDogRef,
  clientGroupAccessCollection,
} from "@/lib/client-records"
import type { Query } from "firebase-admin/firestore"

export const ONE_ON_ONE_PROGRAM_ID = "one-on-one-training"
export const ONE_ON_ONE_PROGRAM_LABEL = "1-on-1 Training"
export const PRIVATE_SERVICE_TYPES = ["in_facility", "in_home"] as const
export const PRIVATE_PLAN_TYPES = ["pack_3", "pack_5", "pack_7", "unit"] as const
export const SELECTABLE_PRIVATE_PLAN_TYPES = ["pack_3", "pack_5", "pack_7"] as const
export type PrivateServiceType = (typeof PRIVATE_SERVICE_TYPES)[number]
export type PrivatePlanType = (typeof PRIVATE_PLAN_TYPES)[number]

type ConsultationLookup = {
  id: string
  status?: string
  clientId?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  dogName?: string
  dogBreed?: string
  dogAge?: string
  issue?: string
  submittedAtIso?: string
  completedAtIso?: string | null
}

type BookingLookup = {
  id: string
  consultationId?: string
  clientId?: string
  clientName?: string
  clientEmail?: string
  dogName?: string
  selectedClassTypes?: string[]
  selectedSlots?: string[]
  selectedSessionIds?: string[]
  summary?: { when?: string[]; what?: string[]; where?: string[] }
  bookingStatus?: string
  squareBookingStatus?: string | null
  squarePaymentLinkUrl?: string | null
  squareServiceVariationId?: string | null
  createdAt?: unknown
}

type SyncedSquareBookingLookup = {
  id?: string
  startAtIso?: string
  status?: string | null
}

type SyncedSquareCustomerLookup = {
  bookings?: SyncedSquareBookingLookup[]
  displayName?: string
  email?: string
}

type ClassAccessLookup = {
  classTypeId?: string
  classLabel?: string
  status?: "allowed" | "blocked"
}

type PrivatePackageLookup = {
  id: string
  consultationId?: string | null
  clientId?: string
  clientEmail?: string
  dogName?: string
  serviceType?: PrivateServiceType
  planType?: PrivatePlanType
  sessionLimit?: number
  sessionsBookedCount?: number
  sessionsRemaining?: number
  paymentStatus?: "pending_in_store" | "paid_in_store" | "cancelled"
  status?: "active" | "exhausted" | "cancelled"
  selectedAtIso?: string
  createdAt?: unknown
}

export type UpcomingTrainingBooking = {
  id: string
  startAt: string
  label: string
  type: "one_on_one" | "group"
  bookingStatus: string
  squareBookingStatus: string | null
  squarePaymentLinkUrl: string | null
}

export type ActivePrivatePackage = {
  id: string
  consultationId: string | null
  serviceType: PrivateServiceType
  planType: PrivatePlanType
  sessionLimit: number
  sessionsBookedCount: number
  sessionsRemaining: number
  paymentStatus: "pending_in_store" | "paid_in_store" | "cancelled"
  status: "active" | "exhausted" | "cancelled"
}

export type TrainingPortalContext = {
  clientId: string
  dogName: string
  latestConsultation: ConsultationLookup | null
  assessmentCompleted: boolean
  allowedClassCount: number
  /** Distinct group program ids this dog may book (from dog_class_access). */
  allowedGroupClassTypeIds: string[]
  hasOneOnOneUpcoming: boolean
  oneOnOneUpcomingBooking: UpcomingTrainingBooking | null
  upcomingBookings: UpcomingTrainingBooking[]
  activePrivatePackage: ActivePrivatePackage | null
  packageSelectionRequired: boolean
  /** Admin-controlled; default facility_only when unset. */
  privateLocationAccess: PrivateLocationAccess
  /** Admin-controlled; default allowed when unset. */
  privateTrainingAccess: PrivateTrainingAccess
}

function asIsoDate(value: unknown) {
  if (!value) return null
  if (typeof value === "string") {
    const time = new Date(value).getTime()
    return Number.isNaN(time) ? null : new Date(time).toISOString()
  }
  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isNaN(time) ? null : value.toISOString()
  }
  if (typeof value === "object" && value && "toDate" in value && typeof value.toDate === "function") {
    try {
      const date = value.toDate() as Date
      const time = date.getTime()
      return Number.isNaN(time) ? null : date.toISOString()
    } catch {
      return null
    }
  }
  return null
}

function normalized(value: string) {
  return value.trim().toLowerCase()
}

export function privatePlanSessionLimit(planType: PrivatePlanType) {
  if (planType === "pack_3") return 3
  if (planType === "pack_5") return 5
  if (planType === "pack_7") return 7
  return 1
}

function bookingStartAt(booking: BookingLookup, sessionStartById?: Map<string, string>) {
  const slotStart = booking.selectedSlots?.[0]?.split("|")?.[0]
  if (slotStart) {
    const iso = asIsoDate(slotStart)
    if (iso) return iso
  }
  const ids = booking.selectedSessionIds
  if (ids?.length && sessionStartById?.size) {
    const times = ids.map((id) => sessionStartById.get(id)).filter((v): v is string => Boolean(v))
    if (times.length) {
      const earliest = [...times].sort((a, b) => a.localeCompare(b))[0]
      const iso = asIsoDate(earliest)
      if (iso) return iso
    }
  }
  const summaryStart = booking.summary?.when?.[0]
  return asIsoDate(summaryStart)
}

function isCancelled(booking: BookingLookup) {
  const status = String(booking.bookingStatus || "").toLowerCase()
  const squareStatus = String(booking.squareBookingStatus || "").toLowerCase()
  return status === "cancelled" || squareStatus === "cancelled"
}

function isCancelledSquareStatus(status: unknown) {
  const value = String(status || "").trim().toLowerCase()
  return value === "cancelled" || value === "canceled"
}

export function isActiveSyncedSquareBooking(booking: SyncedSquareBookingLookup, nowIso = new Date().toISOString()) {
  const startAtIso = asIsoDate(booking.startAtIso)
  if (!startAtIso) return false
  if (startAtIso < nowIso) return false
  return !isCancelledSquareStatus(booking.status)
}

export function isCompletedConsultationOlderThanOneYear(consultation: ConsultationLookup | null, now = new Date()) {
  if (consultation?.status !== "completed") return false
  const completedIso = asIsoDate(consultation.completedAtIso) || asIsoDate(consultation.submittedAtIso)
  if (!completedIso) return false

  const oneYearAgo = new Date(now)
  oneYearAgo.setUTCFullYear(oneYearAgo.getUTCFullYear() - 1)
  return completedIso < oneYearAgo.toISOString()
}

function isOneOnOneBooking(booking: BookingLookup, oneOnOneServiceVariationIds: string[]) {
  const classTypes = (booking.selectedClassTypes || []).map((item) => normalized(String(item)))
  const typeMatch = classTypes.includes(ONE_ON_ONE_PROGRAM_ID)
  const variationSet = new Set(oneOnOneServiceVariationIds.map((item) => normalized(item)).filter(Boolean))
  const serviceMatch = variationSet.size > 0 && variationSet.has(normalized(String(booking.squareServiceVariationId || "")))
  return typeMatch || serviceMatch
}

function bookingLabel(booking: BookingLookup) {
  const first = booking.summary?.what?.[0]
  return first?.trim() || "Training Session"
}

function sortByStartAsc(items: UpcomingTrainingBooking[]) {
  return [...items].sort((a, b) => a.startAt.localeCompare(b.startAt))
}

function pickLatestConsultation(items: ConsultationLookup[]) {
  if (items.length === 0) return null
  const withRank = items.map((item) => {
    const completedAt = asIsoDate(item.completedAtIso)
    const submittedAt = asIsoDate(item.submittedAtIso)
    const rankIso = completedAt || submittedAt || "1970-01-01T00:00:00.000Z"
    return { item, rankIso }
  })
  withRank.sort((a, b) => b.rankIso.localeCompare(a.rankIso))
  return withRank[0].item
}

type ClientDogRecord = { dogName?: string }

function consultationDogName(item: ConsultationLookup) {
  return String(item.dogName || "").trim()
}

/** When the client omits dog name, infer it from consultations, bookings, or dog records. */
export function resolvePortalDogName(input: {
  requestedDogName: string
  consultations: ConsultationLookup[]
  dogRecords: ClientDogRecord[]
  bookingRows: BookingLookup[]
}) {
  const requested = input.requestedDogName.trim()
  if (requested) return requested

  const placeholderNorm = normalized(SQUARE_CLIENT_PLACEHOLDER_DOG_NAME)

  const consultationsWithDog = input.consultations.filter((item) => consultationDogName(item))
  const latestCompleted = pickLatestConsultation(
    consultationsWithDog.filter((item) => item.status === "completed"),
  )
  if (latestCompleted) return consultationDogName(latestCompleted)

  const latestAny = pickLatestConsultation(consultationsWithDog)
  if (latestAny) return consultationDogName(latestAny)

  for (const record of input.dogRecords) {
    const name = String(record.dogName || "").trim()
    if (name) return name
  }

  for (const row of input.bookingRows) {
    const name = String(row.dogName || "").trim()
    if (name && normalized(name) !== placeholderNorm) return name
  }

  return ""
}

function uniqueDogNamesForLookup(
  requestedDogName: string,
  resolvedDogName: string,
  consultations: ConsultationLookup[],
  dogRecords: ClientDogRecord[],
  bookingRows: BookingLookup[],
) {
  const names = new Set<string>()
  const add = (value: string) => {
    const trimmed = value.trim()
    if (trimmed) names.add(trimmed)
  }
  if (requestedDogName.trim()) add(requestedDogName)
  else {
    add(resolvedDogName)
    for (const item of consultations) add(consultationDogName(item))
    for (const record of dogRecords) add(String(record.dogName || ""))
    for (const row of bookingRows) add(String(row.dogName || ""))
  }
  return [...names]
}

async function loadAllowedGroupClassTypeIdsForDogs(
  db: ReturnType<typeof getAdminDb>,
  clientId: string,
  dogNames: string[],
  settingsData: { groupProgramsIncludeAllFutureByDog?: unknown } | undefined,
) {
  const explicitGroupIds = new Set<string>()
  for (const dogName of dogNames) {
    const docs = await safeQueryDocs(
      clientGroupAccessCollection(db, clientId, dogName).where("status", "==", "allowed").limit(200),
    )
    for (const doc of docs) {
      const classTypeId = String((doc.data() as ClassAccessLookup).classTypeId || "").trim()
      if (classTypeId) explicitGroupIds.add(classTypeId)
    }
  }

  let allowedGroupClassTypeIds = [...explicitGroupIds]
  for (const dogName of dogNames) {
    const dogKey = normalized(dogName)
    if (isGroupProgramsAllFutureForDog(settingsData, dogKey)) {
      allowedGroupClassTypeIds = [...new Set([...allowedGroupClassTypeIds, ...(await allConfiguredGroupProgramTypeIds())])]
      break
    }
  }
  return allowedGroupClassTypeIds
}

function pickLatestActivePackage(items: PrivatePackageLookup[]) {
  if (items.length === 0) return null
  const withRank = items.map((item) => {
    const rankIso =
      asIsoDate(item.selectedAtIso) ||
      asIsoDate(item.createdAt) ||
      "1970-01-01T00:00:00.000Z"
    return { item, rankIso }
  })
  withRank.sort((a, b) => b.rankIso.localeCompare(a.rankIso))
  const latest = withRank[0]?.item
  if (!latest) return null

  const serviceType = latest.serviceType
  const planType = latest.planType
  if (!serviceType || !planType) return null
  if (!PRIVATE_SERVICE_TYPES.includes(serviceType)) return null
  if (!PRIVATE_PLAN_TYPES.includes(planType)) return null

  const sessionLimit = Number(latest.sessionLimit || privatePlanSessionLimit(planType))
  const sessionsBookedCount = Number(latest.sessionsBookedCount || 0)
  const sessionsRemaining = Number(
    latest.sessionsRemaining ?? Math.max(0, sessionLimit - sessionsBookedCount),
  )
  const status = latest.status || "active"
  const paymentStatus = latest.paymentStatus || "pending_in_store"
  return {
    id: latest.id,
    consultationId: latest.consultationId || null,
    serviceType,
    planType,
    sessionLimit: Number.isFinite(sessionLimit) ? sessionLimit : privatePlanSessionLimit(planType),
    sessionsBookedCount: Number.isFinite(sessionsBookedCount) ? sessionsBookedCount : 0,
    sessionsRemaining: Number.isFinite(sessionsRemaining) ? Math.max(0, sessionsRemaining) : 0,
    paymentStatus,
    status,
  } satisfies ActivePrivatePackage
}

/** Placeholder dog name when we allow Square clients with past bookings but don't know the dog's name */
export const SQUARE_CLIENT_PLACEHOLDER_DOG_NAME = "Guest"

async function safeQueryDocs(query: Query) {
  try {
    const snap = await query.get()
    return snap.docs
  } catch (error) {
    console.warn("[training-portal] Ignoring unavailable Firestore query:", error instanceof Error ? error.message : error)
    return []
  }
}

export async function loadTrainingPortalContext(input: {
  clientEmail: string
  dogName: string
  oneOnOneServiceVariationIds: string[]
}) {
  const clientId = normalized(input.clientEmail)
  const requestedDogName = input.dogName.trim()
  const requestedDogNorm = normalized(requestedDogName)
  const db = getAdminDb()

  const [
    nestedConsultationDocs,
    nestedBookingDocs,
    clientDogDocs,
    privatePackageDocs,
    squareCustomerDocs,
    nestedClientSettingsSnap,
  ] =
    await Promise.all([
      safeQueryDocs(clientConsultationsCollection(db, clientId).limit(200)),
      safeQueryDocs(clientBookingsCollection(db, clientId).limit(300)),
      requestedDogName
        ? Promise.resolve([] as Awaited<ReturnType<typeof safeQueryDocs>>)
        : safeQueryDocs(clientDocRef(db, clientId).collection(CLIENT_DOGS_SUBCOLLECTION).limit(50)),
      safeQueryDocs(db.collection(PRIVATE_TRAINING_PACKAGES_COLLECTION).where("clientId", "==", clientId).limit(50)),
      safeQueryDocs(db.collection(SQUARE_CUSTOMERS_COLLECTION).where("emailLower", "==", clientId).limit(1)),
      clientBookingSettingsRef(db, clientId).get(),
    ])

  const allConsultations = nestedConsultationDocs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<ConsultationLookup, "id">),
  }))
  const dogRecords = clientDogDocs.map((doc) => doc.data() as ClientDogRecord)
  const bookingRowsEarly = nestedBookingDocs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<BookingLookup, "id">),
  }))

  const resolvedDogName = resolvePortalDogName({
    requestedDogName,
    consultations: allConsultations,
    dogRecords,
    bookingRows: bookingRowsEarly,
  })
  const effectiveDogName = resolvedDogName || requestedDogName
  const effectiveDogNorm = normalized(effectiveDogName)

  const dogNamesForGroupAccess = uniqueDogNamesForLookup(
    requestedDogName,
    resolvedDogName,
    allConsultations,
    dogRecords,
    bookingRowsEarly,
  )

  const [nestedClassAccessIds, nestedPrivatePackageDocs] = await Promise.all([
    loadAllowedGroupClassTypeIdsForDogs(
      db,
      clientId,
      dogNamesForGroupAccess.length > 0 ? dogNamesForGroupAccess : effectiveDogName ? [effectiveDogName] : [],
      nestedClientSettingsSnap.data(),
    ),
    effectiveDogName
      ? safeQueryDocs(
          clientDogRef(db, clientId, effectiveDogName)
            .collection(CLIENT_PRIVATE_PACKAGES_SUBCOLLECTION)
            .limit(50),
        )
      : Promise.resolve([] as Awaited<ReturnType<typeof safeQueryDocs>>),
  ])

  const privateLocationAccess: PrivateLocationAccess = nestedClientSettingsSnap.exists
    ? parsePrivateLocationAccess(nestedClientSettingsSnap.data()?.privateLocationAccess)
    : parsePrivateLocationAccess(undefined)

  const privateTrainingAccess: PrivateTrainingAccess = nestedClientSettingsSnap.exists
    ? parsePrivateTrainingAccess(nestedClientSettingsSnap.data()?.privateTrainingAccess)
    : parsePrivateTrainingAccess(undefined)

  let squareCustomerDocsResult = squareCustomerDocs
  if (squareCustomerDocs.length === 0) {
    squareCustomerDocsResult = await safeQueryDocs(
      db
        .collection(SQUARE_CUSTOMERS_COLLECTION)
        .where("email", "==", clientId)
        .limit(1),
    )
  }

  const consultations = requestedDogNorm
    ? allConsultations.filter((item) => normalized(String(item.dogName || "")) === requestedDogNorm)
    : allConsultations

  const squareCustomer = squareCustomerDocsResult[0]?.data() as SyncedSquareCustomerLookup | undefined
  const squareBookings = squareCustomer?.bookings || []
  const activeSquareBookings = squareBookings.filter((booking) => isActiveSyncedSquareBooking(booking))

  const latestConsultation = requestedDogNorm
    ? pickLatestConsultation(consultations)
    : pickLatestConsultation(consultations.filter((item) => item.status === "completed")) ||
      pickLatestConsultation(consultations)
  let assessmentCompleted = requestedDogNorm
    ? latestConsultation?.status === "completed"
    : allConsultations.some((item) => item.status === "completed")
  const isPlaceholderDogName = normalized(SQUARE_CLIENT_PLACEHOLDER_DOG_NAME) === effectiveDogNorm

  let portalDogName = effectiveDogName
  if (!assessmentCompleted && (!portalDogName || isPlaceholderDogName) && activeSquareBookings.length > 0) {
    assessmentCompleted = true
    portalDogName = SQUARE_CLIENT_PLACEHOLDER_DOG_NAME
  }

  if (!assessmentCompleted && !portalDogName && squareCustomer && activeSquareBookings.length === 0) {
    assessmentCompleted = false
  }

  const portalDogNorm = normalized(portalDogName)
  const allowedGroupClassTypeIds = nestedClassAccessIds
  const allowedClassCount = allowedGroupClassTypeIds.length

  const bookingRows = bookingRowsEarly
  const hasMatchingLocalBooking = bookingRows.some((item) => {
    if (isCancelled(item)) return false
    if (!portalDogNorm) return false
    return normalized(String(item.dogName || "")) === portalDogNorm
  })
  const hasKnownBooking =
    hasMatchingLocalBooking ||
    squareBookings.some((booking) => Boolean(asIsoDate(booking.startAtIso)) && !isCancelledSquareStatus(booking.status))
  if (assessmentCompleted && isCompletedConsultationOlderThanOneYear(latestConsultation) && !hasKnownBooking) {
    assessmentCompleted = false
  }

  const allSessionIds = new Set<string>()
  for (const row of bookingRows) {
    for (const sid of row.selectedSessionIds || []) {
      if (sid) allSessionIds.add(sid)
    }
  }
  const sessionStartById = new Map<string, string>()
  if (allSessionIds.size > 0) {
    const ids = [...allSessionIds].slice(0, 120)
    const refs = ids.map((id) => db.collection(CLASS_SESSIONS_COLLECTION).doc(id))
    const snaps = await db.getAll(...refs)
    for (const s of snaps) {
      if (!s.exists) continue
      const d = s.data() as { startsAtIso?: string }
      if (d.startsAtIso) sessionStartById.set(s.id, d.startsAtIso)
    }
  }

  const nowIso = new Date().toISOString()
  const nestedPrivatePackages = nestedPrivatePackageDocs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<PrivatePackageLookup, "id">) }))
    .filter((item) => normalized(String(item.dogName || "")) === portalDogNorm)
  const legacyPrivatePackages = privatePackageDocs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<PrivatePackageLookup, "id">) }))
    .filter((item) => normalized(String(item.dogName || "")) === portalDogNorm)
  const activePrivatePackage = pickLatestActivePackage(
    nestedPrivatePackages.length > 0 ? nestedPrivatePackages : legacyPrivatePackages,
  )
  const packageSelectionRequired =
    Boolean(assessmentCompleted) &&
    (!activePrivatePackage || activePrivatePackage.status !== "active" || activePrivatePackage.sessionsRemaining <= 0)

  const upcomingBookings = bookingRows
    .filter((item) => normalized(String(item.dogName || "")) === portalDogNorm)
    .map((item) => {
      const startAt = bookingStartAt(item, sessionStartById)
      if (!startAt) return null
      if (startAt <= nowIso) return null
      if (isCancelled(item)) return null
      const type: "one_on_one" | "group" = isOneOnOneBooking(item, input.oneOnOneServiceVariationIds) ? "one_on_one" : "group"
      return {
        id: item.id,
        startAt,
        label: bookingLabel(item),
        type,
        bookingStatus: String(item.bookingStatus || ""),
        squareBookingStatus: item.squareBookingStatus || null,
        squarePaymentLinkUrl: item.squarePaymentLinkUrl || null,
      } satisfies UpcomingTrainingBooking
    })
    .filter((item): item is UpcomingTrainingBooking => Boolean(item))

  const sortedUpcoming = sortByStartAsc(upcomingBookings)
  const oneOnOneUpcomingBooking = sortedUpcoming.find((item) => item.type === "one_on_one") || null

  return {
    clientId,
    dogName: portalDogName || resolvedDogName || requestedDogName,
    latestConsultation,
    assessmentCompleted,
    allowedClassCount,
    allowedGroupClassTypeIds,
    hasOneOnOneUpcoming: Boolean(oneOnOneUpcomingBooking),
    oneOnOneUpcomingBooking,
    upcomingBookings: sortedUpcoming,
    activePrivatePackage,
    packageSelectionRequired,
    privateLocationAccess,
    privateTrainingAccess,
  } satisfies TrainingPortalContext
}
