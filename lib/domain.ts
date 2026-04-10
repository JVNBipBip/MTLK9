export const CONSULTATIONS_COLLECTION = "consultations"
export const SQUARE_CUSTOMERS_COLLECTION = "square_customers"
export const SQUARE_SERVICE_CONFIG_COLLECTION = "square_service_config"
export const CLASS_SESSIONS_COLLECTION = "class_sessions"
export const BOOKINGS_COLLECTION = "bookings"
export const SQUARE_TOKENS_COLLECTION = "square_tokens"
export const DOG_CLASS_ACCESS_COLLECTION = "dog_class_access"
export const PRIVATE_TRAINING_PACKAGES_COLLECTION = "private_training_packages"
/** Per-client booking permissions (e.g. in-home vs facility-only). Doc id: `clientBookingSettingsDocId(email)`. */
export const CLIENT_BOOKING_SETTINGS_COLLECTION = "client_booking_settings"
export const CONTRACT_ACCEPTANCES_COLLECTION = "contract_acceptances"

export type ContractKind = "daycare" | "private_classes" | "group_classes" | "assessment_booking"

export type ContractAcceptanceRecord = {
  id: string
  clientEmail: string
  contractKind: ContractKind
  /** Bump when owner replaces legal text. */
  version: string
  acceptedAtIso: string
  source?: string
  dogName?: string
  createdAt?: unknown
}

/** Default when no doc exists: in-facility private training only until admin enables in-home. */
export type PrivateLocationAccess = "facility_only" | "facility_and_in_home"

/** Private 1-on-1 portal (packages + booking). Default when unset: allowed. */
export type PrivateTrainingAccess = "allowed" | "blocked"

export type ClientBookingSettingsRecord = {
  id: string
  clientEmail: string
  privateLocationAccess: PrivateLocationAccess
  privateTrainingAccess?: PrivateTrainingAccess
  /** Keys: normalized dog name (trim + lower). When true, dog may book any configured group program, including new slots. */
  groupProgramsIncludeAllFutureByDog?: Record<string, boolean>
  updatedAt?: unknown
  updatedAtIso?: string
}

/** Firestore-safe document id for a normalized client email (matches client_square_links pattern). */
export function clientBookingSettingsDocId(clientEmail: string) {
  return clientEmail.trim().toLowerCase().replace(/[.#$[\]]/g, "_")
}

export type ConsultationStatus = "intake_submitted" | "scheduled" | "completed" | "no_show" | "expired"
export type BookingPaymentStatus = "pending_payment" | "processing" | "paid" | "failed" | "cancelled" | "not_required"

export type ConsultationRecord = {
  id: string
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  dogName: string
  dogBreed?: string
  dogAge?: string
  dogDuration?: string
  dogSource?: string
  issue?: string
  issueOther?: string
  duration?: string
  tried?: string[]
  impact?: string[]
  goals?: string[]
  connectMethod?: string
  scheduledAtIso?: string | null
  locationId?: string | null
  locationLabel?: string | null
  status: ConsultationStatus
  recommendedClassTypes: string[]
  staffNotes?: string
  completedAtIso?: string | null
  completedBy?: string | null
  noShowAtIso?: string | null
  noShowReason?: string | null
  rescheduleCount?: number
  lastRescheduledAtIso?: string | null
  lastRescheduledBy?: string | null
  lastRescheduleReason?: string | null
  bookingAccess?: {
    tokenHash: string
    expiresAtIso: string
    emailSentAtIso?: string | null
    revokedAtIso?: string | null
  } | null
  source?: string
  squareCustomerId?: string | null
  squareConsultationBookingId?: string | null
  squareConsultationStatus?: string | null
  createdAt?: unknown
  updatedAt?: unknown
  submittedAtIso?: string
}

export type ClassSessionRecord = {
  id: string
  classType: string
  title: string
  startsAtIso: string
  endsAtIso: string
  /** Same id on every session in a purchasable series (client pays for all sessions in the series). */
  seriesId?: string
  locationId?: string
  locationLabel?: string
  coachId?: string
  capacity: number
  bookedCount: number
  /** Seats held for unpaid group-series checkouts; released when paid or hold expires. */
  reservedCount?: number
  isActive: boolean
  waitlistEnabled?: boolean
  minDogAge?: string
  notes?: string
  squareSourceBookingId?: string
  squarePublicClassInstanceId?: string
  squarePublicClassScheduleId?: string
}

export type BookingRecord = {
  id: string
  consultationId: string
  clientId: string
  clientName: string
  clientEmail: string
  dogName: string
  selectedSessionIds?: string[]
  selectedSlots?: string[]
  selectedClassTypes: string[]
  summary: {
    when: string[]
    where: string[]
    what: string[]
  }
  paymentIntentId?: string | null
  paymentStatus: BookingPaymentStatus
  amountCents: number
  currency: string
  paidAtIso?: string | null
  bookingStatus: "pending_payment" | "paid" | "cancelled" | "rescheduled" | "confirmed" | "booked_no_payment"
  squareBookingId?: string | null
  squareBookingStatus?: string | null
  squareServiceVariationId?: string | null
  squareTeamMemberId?: string | null
  privatePackageId?: string | null
  privateServiceType?: "in_facility" | "in_home" | null
  privatePlanType?: "pack_3" | "pack_5" | "pack_7" | "unit" | null
  sessionNumber?: number | null
  /** Firestore booking id passed to Square order.reference_id for payment link checkout. */
  squarePaymentLinkId?: string | null
  squarePaymentLinkUrl?: string | null
  squareOrderId?: string | null
  source?: string
  /** ISO time after which unpaid group hold can be released (reservedCount on sessions). */
  holdExpiresAtIso?: string | null
  groupSeriesId?: string | null
  createdAt?: unknown
  updatedAt?: unknown
}

export type DogClassAccessRecord = {
  id: string
  consultationId: string
  clientId: string
  clientEmail: string
  dogName: string
  classTypeId: string
  classLabel?: string
  squareServiceVariationId?: string
  status: "allowed" | "blocked"
  grantedBy?: string
  grantedAtIso?: string
  expiresAtIso?: string | null
  notes?: string
  createdAt?: unknown
  updatedAt?: unknown
}

export type PrivateTrainingPackageRecord = {
  id: string
  consultationId?: string | null
  clientId: string
  clientEmail?: string
  dogName: string
  serviceType: "in_facility" | "in_home"
  planType: "pack_3" | "pack_5" | "pack_7" | "unit"
  sessionLimit: number
  sessionsBookedCount: number
  sessionsRemaining: number
  paymentStatus: "pending_in_store" | "paid_in_store" | "cancelled"
  status: "active" | "exhausted" | "cancelled"
  selectedAtIso?: string
  replacedByPackageId?: string | null
  cancelledAtIso?: string | null
  source?: string
  createdAt?: unknown
  updatedAt?: unknown
}
