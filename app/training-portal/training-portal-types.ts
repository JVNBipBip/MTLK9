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
  }>
  privateUpcomingBookings: Array<{ id: string; startAt: string; label: string; type: string }>
  activePrivatePackage: PrivatePackage | null
  options: {
    oneOnOne: {
      eligible: boolean
      hasUpcoming: boolean
      blockedReason: string | null
      sessionsRemaining: number
    }
    group: { eligible: boolean; allowedClassCount: number }
  }
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
