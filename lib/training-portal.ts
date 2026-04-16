import {
  BOOKINGS_COLLECTION,
  CLASS_SESSIONS_COLLECTION,
  CLIENT_BOOKING_SETTINGS_COLLECTION,
  CONSULTATIONS_COLLECTION,
  DOG_CLASS_ACCESS_COLLECTION,
  PRIVATE_TRAINING_PACKAGES_COLLECTION,
  SQUARE_CUSTOMERS_COLLECTION,
  clientBookingSettingsDocId,
  type PrivateLocationAccess,
  type PrivateTrainingAccess,
} from "@/lib/domain"
import { parsePrivateLocationAccess, parsePrivateTrainingAccess } from "@/lib/client-booking-settings"
import { getAdminDb } from "@/lib/firebase-admin"
import { allConfiguredGroupProgramTypeIds, isGroupProgramsAllFutureForDog } from "@/lib/group-dog-program-access"

export const ONE_ON_ONE_PROGRAM_ID = "one-on-one-training"
export const ONE_ON_ONE_PROGRAM_LABEL = "1-on-1 Training"
export const PRIVATE_SERVICE_TYPES = ["in_facility", "in_home"] as const
export const PRIVATE_PLAN_TYPES = ["pack_3", "pack_5", "pack_7", "unit"] as const
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
  squareServiceVariationId?: string | null
  createdAt?: unknown
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

export async function loadTrainingPortalContext(input: {
  clientEmail: string
  dogName: string
  oneOnOneServiceVariationIds: string[]
}) {
  const clientId = normalized(input.clientEmail)
  const dogName = normalized(input.dogName)
  const db = getAdminDb()

  const settingsDocId = clientBookingSettingsDocId(clientId)
  const [consultationSnap, classAccessSnap, bookingSnap, privatePackageSnap, squareCustomerSnap, clientSettingsSnap] =
    await Promise.all([
      db.collection(CONSULTATIONS_COLLECTION).where("clientId", "==", clientId).limit(200).get(),
      db.collection(DOG_CLASS_ACCESS_COLLECTION).where("clientId", "==", clientId).where("status", "==", "allowed").limit(200).get(),
      db.collection(BOOKINGS_COLLECTION).where("clientId", "==", clientId).limit(300).get(),
      db.collection(PRIVATE_TRAINING_PACKAGES_COLLECTION).where("clientId", "==", clientId).where("status", "==", "active").limit(50).get(),
      db.collection(SQUARE_CUSTOMERS_COLLECTION).where("emailLower", "==", clientId).limit(1).get(),
      db.collection(CLIENT_BOOKING_SETTINGS_COLLECTION).doc(settingsDocId).get(),
    ])

  const privateLocationAccess: PrivateLocationAccess = clientSettingsSnap.exists
    ? parsePrivateLocationAccess(clientSettingsSnap.data()?.privateLocationAccess)
    : parsePrivateLocationAccess(undefined)

  const privateTrainingAccess: PrivateTrainingAccess = clientSettingsSnap.exists
    ? parsePrivateTrainingAccess(clientSettingsSnap.data()?.privateTrainingAccess)
    : parsePrivateTrainingAccess(undefined)

  let squareCustomerSnapResult = squareCustomerSnap
  if (squareCustomerSnap.empty) {
    const fallbackSnap = await db
      .collection(SQUARE_CUSTOMERS_COLLECTION)
      .where("email", "==", clientId)
      .limit(1)
      .get()
    squareCustomerSnapResult = fallbackSnap
  }

  const consultations = consultationSnap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<ConsultationLookup, "id">) }))
    .filter((item) => normalized(String(item.dogName || "")) === dogName)

  const squareCustomer = squareCustomerSnapResult.empty
    ? null
    : (squareCustomerSnapResult.docs[0].data() as { bookings?: unknown[]; displayName?: string; email?: string })

  const hasSquareBookings = Boolean(squareCustomer?.bookings?.length && squareCustomer.bookings.length > 0)

  let latestConsultation = pickLatestConsultation(consultations)
  let assessmentCompleted = latestConsultation?.status === "completed"
  let effectiveDogName = dogName || (latestConsultation?.dogName ? normalized(String(latestConsultation.dogName)) : "")
  const isPlaceholderDogName = normalized(SQUARE_CLIENT_PLACEHOLDER_DOG_NAME) === effectiveDogName

  if (!assessmentCompleted && (!effectiveDogName || isPlaceholderDogName) && hasSquareBookings) {
    assessmentCompleted = true
    effectiveDogName = SQUARE_CLIENT_PLACEHOLDER_DOG_NAME
  }

  if (!assessmentCompleted && !effectiveDogName && squareCustomer && !hasSquareBookings) {
    assessmentCompleted = false
  }

  const effectiveDogNorm = normalized(effectiveDogName)
  const explicitGroupIds = [
    ...new Set(
      classAccessSnap.docs
        .map((doc) => doc.data() as ClassAccessLookup & { dogName?: string; classTypeId?: string })
        .filter((item) => normalized(String(item.dogName || "")) === effectiveDogNorm)
        .map((item) => String(item.classTypeId || "").trim())
        .filter(Boolean),
    ),
  ]
  let allowedGroupClassTypeIds = explicitGroupIds
  if (isGroupProgramsAllFutureForDog(clientSettingsSnap.data(), effectiveDogNorm)) {
    allowedGroupClassTypeIds = [...new Set([...explicitGroupIds, ...(await allConfiguredGroupProgramTypeIds())])]
  }
  const allowedClassCount = allowedGroupClassTypeIds.length

  const bookingRows = bookingSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<BookingLookup, "id">) }))
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
  const activePrivatePackage = pickLatestActivePackage(
    privatePackageSnap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<PrivatePackageLookup, "id">) }))
      .filter((item) => normalized(String(item.dogName || "")) === effectiveDogNorm),
  )
  const packageSelectionRequired =
    Boolean(assessmentCompleted) &&
    (!activePrivatePackage || activePrivatePackage.status !== "active" || activePrivatePackage.sessionsRemaining <= 0)

  const upcomingBookings = bookingRows
    .filter((item) => normalized(String(item.dogName || "")) === effectiveDogNorm)
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
      } satisfies UpcomingTrainingBooking
    })
    .filter((item): item is UpcomingTrainingBooking => Boolean(item))

  const sortedUpcoming = sortByStartAsc(upcomingBookings)
  const oneOnOneUpcomingBooking = sortedUpcoming.find((item) => item.type === "one_on_one") || null

  return {
    clientId,
    dogName: effectiveDogName || dogName,
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
