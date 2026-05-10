import { getServiceVariationDurationMinutes, listSquareBookings, type SquareBooking } from "@/lib/square"
import { getConsultationServiceVariationIds, getSquareServiceConfig } from "@/lib/square-service-config"

const DEFAULT_FACILITY_ROOM_CAPACITY = 2
const DEFAULT_APPOINTMENT_DURATION_MINUTES = 60
const DEFAULT_TEAM_APPOINTMENT_BUFFER_MINUTES = 30
const SQUARE_BOOKINGS_MAX_RANGE_MS = 30 * 24 * 60 * 60 * 1000
const ACTIVE_BOOKING_STATUSES = new Set(["accepted", "pending"])

export type FacilityCapacitySlot = {
  startAt: string
  serviceVariationId: string
  durationMinutes?: number
  /** When set, enforces TEAM_APPOINTMENT_BUFFER_MINUTES gaps vs this staff member's other Square bookings. */
  teamMemberId?: string
}

function teamAppointmentBufferMinutes() {
  const raw = Number.parseInt(process.env.TEAM_APPOINTMENT_BUFFER_MINUTES || "", 10)
  if (Number.isNaN(raw) || raw < 0) return DEFAULT_TEAM_APPOINTMENT_BUFFER_MINUTES
  return raw
}

function facilityRoomCapacity() {
  const raw = Number.parseInt(process.env.FACILITY_ROOM_CAPACITY || "", 10)
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_FACILITY_ROOM_CAPACITY
}

export async function getFacilityRoomServiceVariationIds(): Promise<Set<string>> {
  const config = await getSquareServiceConfig()
  const consultationIds = await getConsultationServiceVariationIds()
  const inFacilityPrivateIds = Object.values(config.privateInFacility || {})
    .map((id) => id?.trim())
    .filter((id): id is string => Boolean(id))

  return new Set([...consultationIds, ...inFacilityPrivateIds])
}

async function resolveDurationMinutes(serviceVariationId: string, fallback?: number) {
  if (fallback && fallback > 0) return fallback
  return (await getServiceVariationDurationMinutes(serviceVariationId)) || DEFAULT_APPOINTMENT_DURATION_MINUTES
}

function bookingDurationMinutes(booking: SquareBooking) {
  const total = (booking.appointment_segments || []).reduce((sum, segment) => {
    return sum + Math.max(segment.duration_minutes || 0, 0)
  }, 0)
  return total > 0 ? total : DEFAULT_APPOINTMENT_DURATION_MINUTES
}

function bookingUsesFacilityRoom(booking: SquareBooking, facilityServiceIds: Set<string>) {
  return (booking.appointment_segments || []).some((segment) => {
    const serviceVariationId = segment.service_variation_id?.trim()
    return serviceVariationId ? facilityServiceIds.has(serviceVariationId) : false
  })
}

function timeRangesOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA
}

function activeFacilityBookingsOverlapping(
  bookings: SquareBooking[],
  facilityServiceIds: Set<string>,
  startMs: number,
  endMs: number,
) {
  return bookings.filter((booking) => {
    const status = String(booking.status || "").toLowerCase()
    if (!ACTIVE_BOOKING_STATUSES.has(status)) return false
    if (!bookingUsesFacilityRoom(booking, facilityServiceIds)) return false

    const bookingStartMs = booking.start_at ? new Date(booking.start_at).getTime() : Number.NaN
    if (!Number.isFinite(bookingStartMs)) return false
    const bookingEndMs = bookingStartMs + bookingDurationMinutes(booking) * 60_000
    return timeRangesOverlap(startMs, endMs, bookingStartMs, bookingEndMs)
  })
}

function bookingInvolvesTeamMember(booking: SquareBooking, teamMemberId: string) {
  const id = teamMemberId.trim()
  if (!id) return false
  return (booking.appointment_segments || []).some((seg) => seg.team_member_id?.trim() === id)
}

/** True if an active booking for this staff overlaps [startMs, endMs], extended by buffer on both sides of the booking. */
function teamMemberBufferViolated(
  bookings: SquareBooking[],
  teamMemberId: string,
  startMs: number,
  endMs: number,
  bufferMs: number,
) {
  if (!teamMemberId.trim() || bufferMs <= 0) return false
  for (const booking of bookings) {
    const status = String(booking.status || "").toLowerCase()
    if (!ACTIVE_BOOKING_STATUSES.has(status)) continue
    if (!bookingInvolvesTeamMember(booking, teamMemberId)) continue
    const bookingStartMs = booking.start_at ? new Date(booking.start_at).getTime() : Number.NaN
    if (!Number.isFinite(bookingStartMs)) continue
    const bookingEndMs = bookingStartMs + bookingDurationMinutes(booking) * 60_000
    const blockStart = bookingStartMs - bufferMs
    const blockEnd = bookingEndMs + bufferMs
    if (timeRangesOverlap(startMs, endMs, blockStart, blockEnd)) return true
  }
  return false
}

async function listSquareBookingsForRange(startIso: string, endIso: string): Promise<SquareBooking[]> {
  const startMs = new Date(startIso).getTime()
  const endMs = new Date(endIso).getTime()
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return []

  const bookings: SquareBooking[] = []
  for (let cursorMs = startMs; cursorMs < endMs; cursorMs += SQUARE_BOOKINGS_MAX_RANGE_MS) {
    const chunkEndMs = Math.min(cursorMs + SQUARE_BOOKINGS_MAX_RANGE_MS, endMs)
    const response = await listSquareBookings({
      startAtMin: new Date(cursorMs).toISOString(),
      startAtMax: new Date(chunkEndMs).toISOString(),
      limit: 200,
    })
    bookings.push(...response.bookings)
  }

  return bookings
}

export async function isFacilityRoomAvailable(slot: FacilityCapacitySlot): Promise<boolean> {
  const facilityServiceIds = await getFacilityRoomServiceVariationIds()
  if (!facilityServiceIds.has(slot.serviceVariationId)) return true

  const durationMinutes = await resolveDurationMinutes(slot.serviceVariationId, slot.durationMinutes)
  const startMs = new Date(slot.startAt).getTime()
  if (!Number.isFinite(startMs)) return false
  const endMs = startMs + durationMinutes * 60_000

  const bufferMin = teamAppointmentBufferMinutes()
  const bufferMs = bufferMin * 60_000
  const padMs = Math.max(DEFAULT_APPOINTMENT_DURATION_MINUTES, bufferMin) * 60_000

  const bookings = await listSquareBookingsForRange(
    new Date(startMs - padMs).toISOString(),
    new Date(endMs + padMs).toISOString(),
  )

  if (activeFacilityBookingsOverlapping(bookings, facilityServiceIds, startMs, endMs).length >= facilityRoomCapacity()) {
    return false
  }

  const teamId = slot.teamMemberId?.trim()
  if (teamId && teamMemberBufferViolated(bookings, teamId, startMs, endMs, bufferMs)) {
    return false
  }

  return true
}

export async function filterSlotsByFacilityRoomCapacity<T extends FacilityCapacitySlot>(slots: T[]): Promise<T[]> {
  if (slots.length === 0) return slots

  const facilityServiceIds = await getFacilityRoomServiceVariationIds()
  const facilitySlots = slots.filter((slot) => facilityServiceIds.has(slot.serviceVariationId))
  if (facilitySlots.length === 0) return slots

  const durationByServiceId = new Map<string, number>()
  await Promise.all(
    [...new Set(facilitySlots.map((slot) => slot.serviceVariationId))].map(async (serviceVariationId) => {
      durationByServiceId.set(serviceVariationId, await resolveDurationMinutes(serviceVariationId))
    }),
  )

  const startTimes = facilitySlots.map((slot) => new Date(slot.startAt).getTime()).filter(Number.isFinite)
  if (startTimes.length === 0) return []

  const maxDurationMinutes = Math.max(
    DEFAULT_APPOINTMENT_DURATION_MINUTES,
    ...facilitySlots.map((slot) => slot.durationMinutes || durationByServiceId.get(slot.serviceVariationId) || 0),
  )
  const bufferMin = teamAppointmentBufferMinutes()
  const bufferMs = bufferMin * 60_000
  const rangeStart = new Date(Math.min(...startTimes) - maxDurationMinutes * 60_000 - bufferMs).toISOString()
  const rangeEnd = new Date(Math.max(...startTimes) + maxDurationMinutes * 60_000 + bufferMs).toISOString()
  const bookings = await listSquareBookingsForRange(rangeStart, rangeEnd)

  return slots.filter((slot) => {
    if (!facilityServiceIds.has(slot.serviceVariationId)) return true

    const startMs = new Date(slot.startAt).getTime()
    if (!Number.isFinite(startMs)) return false
    const durationMinutes =
      slot.durationMinutes || durationByServiceId.get(slot.serviceVariationId) || DEFAULT_APPOINTMENT_DURATION_MINUTES
    const endMs = startMs + durationMinutes * 60_000
    const overlapping = activeFacilityBookingsOverlapping(bookings, facilityServiceIds, startMs, endMs)
    if (overlapping.length >= facilityRoomCapacity()) return false

    const teamId = slot.teamMemberId?.trim()
    if (teamId && teamMemberBufferViolated(bookings, teamId, startMs, endMs, bufferMs)) return false

    return true
  })
}
