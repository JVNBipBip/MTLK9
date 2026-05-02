import { getServiceVariationDurationMinutes, listSquareBookings, type SquareBooking } from "@/lib/square"
import { getConsultationServiceVariationIds, getSquareServiceConfig } from "@/lib/square-service-config"

const DEFAULT_FACILITY_ROOM_CAPACITY = 2
const DEFAULT_APPOINTMENT_DURATION_MINUTES = 60
const ACTIVE_BOOKING_STATUSES = new Set(["accepted", "pending"])

export type FacilityCapacitySlot = {
  startAt: string
  serviceVariationId: string
  durationMinutes?: number
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

export async function isFacilityRoomAvailable(slot: FacilityCapacitySlot): Promise<boolean> {
  const facilityServiceIds = await getFacilityRoomServiceVariationIds()
  if (!facilityServiceIds.has(slot.serviceVariationId)) return true

  const durationMinutes = await resolveDurationMinutes(slot.serviceVariationId, slot.durationMinutes)
  const startMs = new Date(slot.startAt).getTime()
  if (!Number.isFinite(startMs)) return false
  const endMs = startMs + durationMinutes * 60_000
  const { bookings } = await listSquareBookings({
    startAtMin: new Date(startMs - DEFAULT_APPOINTMENT_DURATION_MINUTES * 60_000).toISOString(),
    startAtMax: new Date(endMs).toISOString(),
    limit: 200,
  })

  return activeFacilityBookingsOverlapping(bookings, facilityServiceIds, startMs, endMs).length < facilityRoomCapacity()
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
  const rangeStart = new Date(Math.min(...startTimes) - maxDurationMinutes * 60_000).toISOString()
  const rangeEnd = new Date(Math.max(...startTimes) + maxDurationMinutes * 60_000).toISOString()
  const { bookings } = await listSquareBookings({ startAtMin: rangeStart, startAtMax: rangeEnd, limit: 200 })

  return slots.filter((slot) => {
    if (!facilityServiceIds.has(slot.serviceVariationId)) return true

    const startMs = new Date(slot.startAt).getTime()
    if (!Number.isFinite(startMs)) return false
    const durationMinutes =
      slot.durationMinutes || durationByServiceId.get(slot.serviceVariationId) || DEFAULT_APPOINTMENT_DURATION_MINUTES
    const endMs = startMs + durationMinutes * 60_000
    const overlapping = activeFacilityBookingsOverlapping(bookings, facilityServiceIds, startMs, endMs)
    return overlapping.length < facilityRoomCapacity()
  })
}
