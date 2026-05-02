export type PrivatePackage = {
  id: string
  consultationId: string | null
  serviceType: "in_facility" | "in_home"
  planType: "pack_3" | "pack_5" | "pack_7" | "unit"
  sessionLimit: number
  sessionsBookedCount: number
  sessionsRemaining: number
  paymentStatus: "pending_in_store" | "paid_in_store" | "cancelled"
  status: "active" | "exhausted" | "cancelled"
}

export type Slot = {
  slotKey: string
  startAt: string
  programLabel: string
  teamMemberId?: string
  teamMemberName?: string | null
}

export type PrivateLocationAccess = "facility_only" | "facility_and_in_home"

export type ApprovedGroupProgram = {
  programId: string
  programLabel: string
  squareUrl: string | null
}

export type GroupSeriesListItem = {
  seriesId: string
  classType: string
  programLabel: string
  sessionCount: number
  spotsRemaining: number
  sessions: Array<{
    id: string
    title: string
    startsAtIso: string
    endsAtIso: string
    locationLabel: string
    priceAmountCents: number | null
    priceCurrency: string | null
    spotsRemaining: number
  }>
}

export type StatusResponse = {
  ok: boolean
  hasConsultation: boolean
  assessmentCompleted: boolean
  latestConsultationStatus: string | null
  clientSummary: {
    clientName: string | null
    clientEmail: string | null
    clientPhone: string | null
    dogName: string | null
    dogBreed: string | null
    dogAge: string | null
    issue: string | null
  } | null
  lookup: { clientEmail: string; dogName: string }
  existingBookings: Array<{
    id: string
    startAt: string
    label: string
    type: "one_on_one" | "group"
    bookingStatus: string
    squareBookingStatus: string | null
    squarePaymentLinkUrl: string | null
  }>
  privateUpcomingBookings: Array<{
    id: string
    startAt: string
    label: string
    type: string
    bookingStatus?: string
    squareBookingStatus?: string | null
  }>
  activePrivatePackage: PrivatePackage | null
  options: {
    oneOnOne: {
      eligible: boolean
      hasUpcoming: boolean
      blockedReason: string | null
      sessionsRemaining: number
    }
    groupClasses: {
      eligible: boolean
      allowedProgramIds: string[]
      blockedReason: string | null
    }
  }
  /** Admin default: facility_only (in-home hidden until enabled). */
  privateLocationAccess: PrivateLocationAccess
  inHomeBookingAllowed: boolean
  privateTrainingAccess: "allowed" | "blocked"
  privateTrainingAllowed: boolean
  squareBookingSiteUrl: string | null
}

export const SERVICE_TYPE_LABEL: Record<PrivatePackage["serviceType"], string> = {
  in_facility: "In-Facility Training",
  in_home: "In-Home Training",
}

export const PLAN_TYPE_LABEL: Record<PrivatePackage["planType"], string> = {
  pack_3: "Option A · 3 sessions",
  pack_5: "Option B · 5 sessions",
  pack_7: "Option C · 7 sessions",
  unit: "Unit · 1 session",
}
