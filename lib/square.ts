import { getAdminDb } from "@/lib/firebase-admin"
import { SQUARE_TOKENS_COLLECTION } from "@/lib/domain"
import { getSquareLocationId } from "@/lib/square-service-config"

const SQUARE_BASE_URL_BY_ENV = {
  production: "https://connect.squareup.com",
  sandbox: "https://connect.squareupsandbox.com",
} as const

type SquareEnv = keyof typeof SQUARE_BASE_URL_BY_ENV

const REFRESH_BUFFER_MS = 60 * 60 * 1000 // refresh if expiring within 1 hour

async function tryRefreshOAuthToken(): Promise<boolean> {
  const url = process.env.SQUARE_OAUTH_REFRESH_URL?.trim()
  if (!url) return false
  try {
    const res = await fetch(url, { method: "POST", cache: "no-store" })
    if (res.ok) return true
  } catch {
    /* ignore */
  }
  return false
}

/** OAuth first, fallback to SQUARE_ACCESS_TOKEN from env */
async function getSquareConfigAsync() {
  const locationId = await getSquareLocationId()
  const env = (process.env.SQUARE_ENV || "sandbox") as SquareEnv
  const apiVersion = process.env.SQUARE_API_VERSION || "2025-10-16"

  if (!locationId) throw new Error("Missing location. Set in Admin → Service Mapping or SQUARE_LOCATION_ID env.")
  if (!SQUARE_BASE_URL_BY_ENV[env]) throw new Error("Invalid SQUARE_ENV. Use sandbox or production.")

  try {
    const db = getAdminDb()
    const snap = await db.collection(SQUARE_TOKENS_COLLECTION).limit(5).get()
    const doc = snap.docs.find((d) => {
      const data = d.data()
      return data?.accessToken || data?.refreshToken
    })
    if (doc) {
      const data = doc.data() as {
        accessToken?: string
        expiresAt?: string
        refreshToken?: string
      }
      const accessToken = data?.accessToken?.trim()
      const expiresAt = data?.expiresAt
      const expiresAtDate = expiresAt ? new Date(expiresAt) : null
      const isExpired = expiresAtDate ? expiresAtDate <= new Date() : false
      const expiresSoon = expiresAtDate ? expiresAtDate.getTime() - Date.now() < REFRESH_BUFFER_MS : false

      if (accessToken && !isExpired && !expiresSoon) {
        return {
          accessToken,
          locationId,
          apiVersion,
          baseUrl: SQUARE_BASE_URL_BY_ENV[env],
        }
      }

      if ((isExpired || expiresSoon) && data?.refreshToken?.trim()) {
        const refreshed = await tryRefreshOAuthToken()
        if (refreshed) return getSquareConfigAsync()
      }
    }
  } catch {
    /* fall through to env */
  }

  const accessToken = process.env.SQUARE_ACCESS_TOKEN?.trim()
  if (!accessToken) throw new Error("Missing SQUARE_ACCESS_TOKEN. Connect Square via OAuth in Admin or set SQUARE_ACCESS_TOKEN.")

  return {
    accessToken,
    locationId,
    apiVersion,
    baseUrl: SQUARE_BASE_URL_BY_ENV[env],
  }
}

async function squareRequest<T>(path: string, init: RequestInit) {
  const cfg = await getSquareConfigAsync()
  const response = await fetch(`${cfg.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${cfg.accessToken}`,
      "Square-Version": cfg.apiVersion,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  })

  const data = (await response.json().catch(() => null)) as { errors?: Array<{ detail?: string; code?: string }> } | null
  if (!response.ok) {
    const firstError = data?.errors?.[0]
    throw new Error(firstError?.detail || firstError?.code || `Square request failed with ${response.status}.`)
  }
  return data as T
}

export type SquareSearchAvailabilityResult = {
  availabilities?: Array<{
    start_at?: string
    appointment_segments?: Array<{
      service_variation_id?: string
      team_member_id?: string
      duration_minutes?: number
    }>
  }>
}

export async function searchSquareAvailability(input: {
  serviceVariationId: string
  teamMemberId?: string
  startAt: string
  endAt: string
}) {
  const cfg = await getSquareConfigAsync()
  const segmentFilter: Record<string, unknown> = {
    service_variation_id: input.serviceVariationId,
  }
  if (input.teamMemberId) {
    segmentFilter.team_member_id_filter = {
      any: [input.teamMemberId],
    }
  }
  return squareRequest<SquareSearchAvailabilityResult>("/v2/bookings/availability/search", {
    method: "POST",
    body: JSON.stringify({
      query: {
        filter: {
          start_at_range: {
            start_at: input.startAt,
            end_at: input.endAt,
          },
          location_id: cfg.locationId,
          segment_filters: [
            segmentFilter,
          ],
        },
      },
    }),
  })
}

export async function createSquareCustomer(input: { givenName: string; emailAddress: string; phoneNumber?: string }) {
  return squareRequest<{ customer?: { id?: string } }>("/v2/customers", {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      given_name: input.givenName || undefined,
      email_address: input.emailAddress || undefined,
      phone_number: input.phoneNumber || undefined,
    }),
  })
}

export async function searchSquareCustomerByEmail(emailAddress: string) {
  return squareRequest<{ customers?: Array<{ id?: string; email_address?: string }> }>("/v2/customers/search", {
    method: "POST",
    body: JSON.stringify({
      query: {
        filter: {
          email_address: {
            exact: emailAddress,
          },
        },
      },
      limit: 1,
    }),
  })
}

export async function getOrCreateSquareCustomer(input: { name: string; email: string; phone?: string }) {
  const normalizedEmail = input.email.trim().toLowerCase()
  if (!normalizedEmail) throw new Error("Customer email is required for Square booking.")

  const existing = await searchSquareCustomerByEmail(normalizedEmail)
  const existingId = existing.customers?.[0]?.id
  if (existingId) return existingId

  const created = await createSquareCustomer({
    givenName: input.name,
    emailAddress: normalizedEmail,
    phoneNumber: input.phone,
  })
  const customerId = created.customer?.id
  if (!customerId) throw new Error("Square customer could not be created.")
  return customerId
}

export async function getServiceVariationVersion(serviceVariationId: string) {
  const result = await squareRequest<{ object?: { version?: number } }>(`/v2/catalog/object/${serviceVariationId}`, {
    method: "GET",
  })
  const version = result.object?.version
  if (!version) throw new Error("Could not resolve Square service variation version.")
  return BigInt(version).toString()
}

export async function createSquareBooking(input: {
  customerId: string
  startAt: string
  serviceVariationId: string
  teamMemberId: string
  idempotencyKey: string
  note?: string
}) {
  const cfg = await getSquareConfigAsync()
  const serviceVariationVersion = await getServiceVariationVersion(input.serviceVariationId)
  return squareRequest<{ booking?: { id?: string; status?: string } }>("/v2/bookings", {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: input.idempotencyKey,
      booking: {
        location_id: cfg.locationId,
        customer_id: input.customerId,
        start_at: input.startAt,
        appointment_segments: [
          {
            service_variation_id: input.serviceVariationId,
            service_variation_version: serviceVariationVersion,
            team_member_id: input.teamMemberId,
          },
        ],
        customer_note: input.note || undefined,
      },
    }),
  })
}

export type SquareCatalogObject = {
  id?: string
  type?: string
  is_deleted?: boolean
  present_at_all_locations?: boolean
  present_at_location_ids?: string[]
  absent_at_location_ids?: string[]
  item_variation_data?: {
    item_id?: string
    name?: string
    available_for_booking?: boolean
    team_member_ids?: string[]
    service_duration?: number
    price_money?: {
      amount?: number
      currency?: string
    }
  }
  item_data?: {
    name?: string
    product_type?: string
    description?: string
    variations?: SquareCatalogObject[]
  }
}

export async function retrieveSquareCatalogObject(objectId: string) {
  return squareRequest<{ object?: SquareCatalogObject }>(`/v2/catalog/object/${objectId}`, {
    method: "GET",
  })
}

/**
 * Human-readable label for a catalog variation ID (ITEM_VARIATION), using Square item + variation names.
 * Returns null if the object is missing or not usable.
 */
export async function getCatalogVariationDisplayName(variationId: string): Promise<string | null> {
  const id = variationId.trim()
  if (!id) return null
  try {
    const { object: root } = await retrieveSquareCatalogObject(id)
    if (!root || root.is_deleted) return null
    const t = String(root.type || "").toUpperCase()

    if (t === "ITEM_VARIATION") {
      const varName = root.item_variation_data?.name?.trim() || ""
      const itemId = root.item_variation_data?.item_id?.trim()
      let itemName = ""
      if (itemId) {
        const { object: item } = await retrieveSquareCatalogObject(itemId)
        if (item && !item.is_deleted) {
          itemName = item.item_data?.name?.trim() || ""
        }
      }
      if (itemName && varName && varName !== itemName) {
        return `${itemName} — ${varName}`
      }
      if (itemName) return itemName
      if (varName) return varName
      return null
    }

    if (t === "ITEM") {
      return root.item_data?.name?.trim() || null
    }

    return null
  } catch {
    return null
  }
}

export async function createSquarePaymentLinkForVariation(input: {
  variationId: string
  quantity?: string
  buyerEmail?: string
  buyerPhoneNumber?: string
  note?: string
  redirectUrl?: string
  /** Correlates Square order → Firestore booking (webhook reads order.reference_id). */
  orderReferenceId?: string
}) {
  const cfg = await getSquareConfigAsync()
  return squareRequest<{ payment_link?: { id?: string; url?: string } }>("/v2/online-checkout/payment-links", {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      order: {
        location_id: cfg.locationId,
        ...(input.orderReferenceId ? { reference_id: input.orderReferenceId.slice(0, 40) } : {}),
        line_items: [
          {
            catalog_object_id: input.variationId,
            quantity: input.quantity || "1",
          },
        ],
      },
      checkout_options: {
        redirect_url: input.redirectUrl || undefined,
      },
      pre_populated_data: {
        buyer_email: input.buyerEmail || undefined,
        buyer_phone_number: input.buyerPhoneNumber || undefined,
      },
      description: input.note || undefined,
    }),
  })
}

export type SquareAppointmentSegment = {
  service_variation_id?: string
  team_member_id?: string
  duration_minutes?: number
}

export type SquareBooking = {
  id?: string
  status?: string
  start_at?: string
  location_id?: string
  customer_id?: string
  customer_note?: string
  seller_note?: string
  created_at?: string
  updated_at?: string
  source?: string
  appointment_segments?: SquareAppointmentSegment[]
}

export async function retrieveSquareBooking(bookingId: string) {
  return squareRequest<{ booking?: SquareBooking }>(`/v2/bookings/${encodeURIComponent(bookingId)}`, {
    method: "GET",
  })
}

export async function retrieveSquareOrder(orderId: string) {
  return squareRequest<{
    order?: { id?: string; reference_id?: string; state?: string; total_money?: { amount?: bigint | number; currency?: string } }
  }>(`/v2/orders/${encodeURIComponent(orderId)}`, { method: "GET" })
}

export async function listSquareCatalogItems() {
  const items: SquareCatalogObject[] = []
  let cursor: string | undefined

  do {
    const query = new URLSearchParams({ types: "ITEM" })
    if (cursor) query.set("cursor", cursor)
    const response = await squareRequest<{ objects?: SquareCatalogObject[]; cursor?: string }>(`/v2/catalog/list?${query.toString()}`, {
      method: "GET",
    })
    items.push(...(response.objects || []))
    cursor = response.cursor || undefined
  } while (cursor)

  return items
}

type TeamMemberBookingProfile = {
  team_member_id?: string
  is_bookable?: boolean
}

type LocationBookingProfile = {
  location_id?: string
  booking_site_url?: string
  online_booking_enabled?: boolean
}

/**
 * Team members enabled for booking at the location. Used so availability can be queried per staff;
 * Square's unfiltered search often returns only one assignee per slot even when others are free.
 */
export async function listBookableTeamMemberIdsForLocation(): Promise<string[]> {
  const cfg = await getSquareConfigAsync()
  if (!cfg.locationId) return []
  const ids: string[] = []
  let cursor: string | undefined
  do {
    const params = new URLSearchParams({
      location_id: cfg.locationId,
      bookable_only: "true",
      limit: "100",
    })
    if (cursor) params.set("cursor", cursor)
    const data = await squareRequest<{
      team_member_booking_profiles?: TeamMemberBookingProfile[]
      cursor?: string
    }>(`/v2/bookings/team-member-booking-profiles?${params.toString()}`, { method: "GET" })
    for (const p of data.team_member_booking_profiles || []) {
      const id = p.team_member_id?.trim()
      if (id && p.is_bookable !== false) ids.push(id)
    }
    cursor = data.cursor || undefined
  } while (cursor)
  return [...new Set(ids)]
}

export async function getSquareBookingSiteUrlForLocation(): Promise<string | null> {
  const cfg = await getSquareConfigAsync()
  if (!cfg.locationId) return null

  let cursor: string | undefined
  do {
    const params = new URLSearchParams({ limit: "100" })
    if (cursor) params.set("cursor", cursor)
    const data = await squareRequest<{
      location_booking_profiles?: LocationBookingProfile[]
      cursor?: string
    }>(`/v2/bookings/location-booking-profiles?${params.toString()}`, { method: "GET" })

    const profile = (data.location_booking_profiles || []).find((item) => item.location_id === cfg.locationId)
    if (profile) {
      if (profile.online_booking_enabled === false) return null
      return profile.booking_site_url?.trim() || null
    }

    cursor = data.cursor || undefined
  } while (cursor)

  return null
}

export function buildSquarePublicClassDetailsUrl(input: {
  bookingSiteUrl: string
  locationId: string
  scheduleId: string
  startsAtIso: string
}): string | null {
  const bookingSiteUrl = input.bookingSiteUrl.trim()
  const locationId = input.locationId.trim()
  const scheduleId = input.scheduleId.trim()
  const startsAt = new Date(input.startsAtIso)
  if (!bookingSiteUrl || !locationId || !scheduleId || Number.isNaN(startsAt.getTime())) return null

  try {
    const parsed = new URL(bookingSiteUrl)
    const match = parsed.pathname.match(/^(\/classes\/[^/]+\/location\/[^/]+)/)
    const basePath = match ? match[1] : null
    if (!basePath) return null

    const url = new URL(`${basePath}/classDetails/${encodeURIComponent(scheduleId)}`, parsed.origin)
    url.searchParams.set("dateStart", String(Math.floor(startsAt.getTime() / 1000)))
    return url.toString()
  } catch {
    return null
  }
}

export async function retrieveSquareTeamMember(teamMemberId: string) {
  const result = await squareRequest<{
    team_member?: { given_name?: string; family_name?: string }
  }>(`/v2/team-members/${teamMemberId}`, { method: "GET" })
  const tm = result.team_member
  if (!tm) return null
  const parts = [tm.given_name, tm.family_name].filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : null
}

export async function listSquareBookings(input?: { startAtMin?: string; startAtMax?: string; limit?: number }) {
  const cfg = await getSquareConfigAsync()
  const params = new URLSearchParams()
  params.set("location_id", cfg.locationId)
  params.set("start_at_min", input?.startAtMin || new Date().toISOString())
  if (input?.startAtMax) params.set("start_at_max", input.startAtMax)
  if (input?.limit) params.set("limit", String(input.limit))
  return squareRequest<{
    bookings?: Array<{
      start_at?: string
      appointment_segments?: Array<{ service_variation_id?: string }>
    }>
  }>(`/v2/bookings?${params.toString()}`, {
    method: "GET",
  })
}

