jest.mock("./square-service-config", () => ({
  getConsultationServiceVariationIds: jest.fn(async () => ["consult-var"]),
}))

import type { Firestore } from "firebase-admin/firestore"
import { BOOKINGS_COLLECTION, CONSULTATIONS_COLLECTION, SQUARE_CUSTOMERS_COLLECTION } from "@/lib/domain"
import { reconcileSquareBookingWebhook } from "./square-webhook-bookings"

type DocData = Record<string, unknown>

function deepMerge(target: DocData, source: DocData): DocData {
  const output: DocData = { ...target }
  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      output[key] &&
      typeof output[key] === "object" &&
      !Array.isArray(output[key])
    ) {
      output[key] = deepMerge(output[key] as DocData, value as DocData)
    } else {
      output[key] = value
    }
  }
  return output
}

class FakeDocRef {
  constructor(
    private store: Map<string, DocData>,
    readonly id: string,
  ) {}

  async set(data: DocData, options?: { merge?: boolean }) {
    const existing = this.store.get(this.id) || {}
    this.store.set(this.id, options?.merge ? deepMerge(existing, data) : data)
  }

  async get() {
    const data = this.store.get(this.id)
    return {
      exists: data !== undefined,
      data: () => data,
    }
  }
}

class FakeQuerySnapshot {
  constructor(private store: Map<string, DocData>, private entries: Array<[string, DocData]>) {}

  get empty() {
    return this.entries.length === 0
  }

  get docs() {
    return this.entries.map(([id, data]) => ({
      id,
      ref: new FakeDocRef(this.store, id),
      data: () => data,
    }))
  }
}

class FakeQuery {
  constructor(
    private store: Map<string, DocData>,
    private field: string,
    private value: unknown,
    private max: number = 1,
  ) {}

  limit(n: number) {
    this.max = n
    return this
  }

  async get() {
    const entries = [...this.store.entries()].filter(([, data]) => data[this.field] === this.value)
    return new FakeQuerySnapshot(this.store, entries.slice(0, this.max))
  }
}

class FakeCollection {
  constructor(private store: Map<string, DocData>, private nextId: () => string) {}

  where(field: string, _op: string, value: unknown) {
    return new FakeQuery(this.store, field, value)
  }

  doc(id: string) {
    return new FakeDocRef(this.store, id)
  }

  async add(data: DocData) {
    const id = this.nextId()
    this.store.set(id, data)
    return new FakeDocRef(this.store, id)
  }

  all() {
    return [...this.store.entries()].map(([id, data]) => ({ id, data }))
  }
}

class FakeFirestore {
  private collections = new Map<string, Map<string, DocData>>()
  private idCounter = 0

  collection(name: string) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map())
    }
    const store = this.collections.get(name)!
    return new FakeCollection(store, () => `doc_${++this.idCounter}`)
  }

  seed(collectionName: string, id: string, data: DocData) {
    if (!this.collections.has(collectionName)) {
      this.collections.set(collectionName, new Map())
    }
    this.collections.get(collectionName)!.set(id, data)
  }

  data(collectionName: string, id: string) {
    return this.collections.get(collectionName)?.get(id)
  }

  all(collectionName: string) {
    return this.collection(collectionName).all()
  }
}

function payloadFor(bookingId: string, type = "booking.updated", eventId = "evt_1") {
  return {
    type,
    event_id: eventId,
    created_at: "2026-04-10T15:30:00.000Z",
    data: {
      object: {
        booking: {
          id: bookingId,
        },
      },
    },
  }
}

function canonicalBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: "sq_booking_1",
    status: "ACCEPTED",
    start_at: "2026-04-20T16:00:00.000Z",
    customer_id: "cust_1",
    location_id: "loc_1",
    updated_at: "2026-04-10T15:30:00.000Z",
    appointment_segments: [
      {
        service_variation_id: "class-var",
        team_member_id: "tm_1",
        duration_minutes: 60,
      },
    ],
    ...overrides,
  }
}

describe("reconcileSquareBookingWebhook", () => {
  it("updates a matched booking and marks reschedules", async () => {
    const db = new FakeFirestore()
    db.seed(BOOKINGS_COLLECTION, "booking_doc", {
      squareBookingId: "sq_booking_1",
      bookingStatus: "booked_no_payment",
      selectedSlots: ["2026-04-15T16:00:00.000Z|class-var|tm_1"],
      summary: {
        when: ["2026-04-15T16:00:00.000Z"],
        where: ["Square booking"],
        what: ["Puppy Foundations"],
      },
    })

    await reconcileSquareBookingWebhook(db as unknown as Firestore, payloadFor("sq_booking_1"), {
      retrieveBooking: async () => ({
        booking: canonicalBooking(),
      }),
    })

    expect(db.data(BOOKINGS_COLLECTION, "booking_doc")).toMatchObject({
      squareBookingStatus: "ACCEPTED",
      squareCustomerId: "cust_1",
      squareServiceVariationId: "class-var",
      squareTeamMemberId: "tm_1",
      bookingStatus: "rescheduled",
      selectedSlots: ["2026-04-20T16:00:00.000Z|class-var|tm_1"],
      summary: {
        when: ["2026-04-20T16:00:00.000Z"],
        where: ["Square booking"],
        what: ["Puppy Foundations"],
      },
      squareWebhookLastEventId: "evt_1",
      squareWebhookLastEventType: "booking.updated",
      lastRescheduledAtIso: "2026-04-10T15:30:00.000Z",
    })
  })

  it("updates a matched consultation schedule and reschedule metadata", async () => {
    const db = new FakeFirestore()
    db.seed(CONSULTATIONS_COLLECTION, "consult_doc", {
      squareConsultationBookingId: "sq_booking_1",
      squareConsultationStatus: "ACCEPTED",
      scheduledAtIso: "2026-04-12T16:00:00.000Z",
      rescheduleCount: 1,
    })

    await reconcileSquareBookingWebhook(db as unknown as Firestore, payloadFor("sq_booking_1"), {
      retrieveBooking: async () => ({
        booking: canonicalBooking({
          appointment_segments: [
            {
              service_variation_id: "consult-var",
              team_member_id: "tm_2",
              duration_minutes: 75,
            },
          ],
        }),
      }),
    })

    expect(db.data(CONSULTATIONS_COLLECTION, "consult_doc")).toMatchObject({
      squareConsultationStatus: "ACCEPTED",
      scheduledAtIso: "2026-04-20T16:00:00.000Z",
      consultationDateTime: "2026-04-20T16:00:00.000Z",
      locationId: "loc_1",
      squareServiceVariationId: "consult-var",
      squareTeamMemberId: "tm_2",
      rescheduleCount: 2,
      lastRescheduledAtIso: "2026-04-10T15:30:00.000Z",
      lastRescheduledBy: "square-webhook",
      lastRescheduleReason: "booking.updated",
    })
  })

  it("marks cancelled bookings as cancelled locally", async () => {
    const db = new FakeFirestore()
    db.seed(BOOKINGS_COLLECTION, "booking_doc", {
      squareBookingId: "sq_booking_1",
      bookingStatus: "confirmed",
      selectedSlots: ["2026-04-15T16:00:00.000Z|class-var|tm_1"],
      summary: {
        when: ["2026-04-15T16:00:00.000Z"],
        where: ["Square booking"],
        what: ["Puppy Foundations"],
      },
    })

    await reconcileSquareBookingWebhook(
      db as unknown as Firestore,
      payloadFor("sq_booking_1", "booking.updated", "evt_cancel"),
      {
        retrieveBooking: async () => ({
          booking: canonicalBooking({
            status: "CANCELLED",
          }),
        }),
      },
    )

    expect(db.data(BOOKINGS_COLLECTION, "booking_doc")).toMatchObject({
      bookingStatus: "cancelled",
      squareBookingStatus: "CANCELLED",
      squareWebhookLastEventId: "evt_cancel",
    })
  })

  it("merges an unmatched consultation booking into an existing consultation when email matches", async () => {
    const db = new FakeFirestore()
    db.seed(CONSULTATIONS_COLLECTION, "intake_doc", {
      clientName: "Jamie Client",
      clientEmail: "jamie@example.com",
      clientPhone: "+15145551234",
      status: "intake_submitted",
    })

    const outcome = await reconcileSquareBookingWebhook(
      db as unknown as Firestore,
      payloadFor("sq_booking_new", "booking.created"),
      {
        retrieveBooking: async () => ({
          booking: canonicalBooking({
            id: "sq_booking_new",
            appointment_segments: [
              {
                service_variation_id: "consult-var",
                team_member_id: "tm_2",
                duration_minutes: 75,
              },
            ],
          }),
        }),
        retrieveCustomer: async () => ({
          customer: {
            id: "cust_1",
            given_name: "Jamie",
            family_name: "Client",
            email_address: "jamie@example.com",
            phone_number: "+15145551234",
          },
        }),
      },
    )

    expect(outcome.action).toBe("merged_existing_consultation")
    expect(outcome.matchedBy).toBe("email")
    expect(outcome.docId).toBe("intake_doc")
    expect(db.data(CONSULTATIONS_COLLECTION, "intake_doc")).toMatchObject({
      squareConsultationBookingId: "sq_booking_new",
      squareCustomerId: "cust_1",
      scheduledAtIso: "2026-04-20T16:00:00.000Z",
      consultationDateTime: "2026-04-20T16:00:00.000Z",
      clientName: "Jamie Client",
      clientEmail: "jamie@example.com",
      clientPhone: "+15145551234",
      status: "scheduled",
    })
    // must not create a new stub
    expect(db.all(CONSULTATIONS_COLLECTION)).toHaveLength(1)
  })

  it("populates a consultation stub with Square customer data when no match exists", async () => {
    const db = new FakeFirestore()

    const outcome = await reconcileSquareBookingWebhook(
      db as unknown as Firestore,
      payloadFor("sq_booking_new", "booking.created"),
      {
        retrieveBooking: async () => ({
          booking: canonicalBooking({
            id: "sq_booking_new",
            appointment_segments: [
              {
                service_variation_id: "consult-var",
                team_member_id: "tm_2",
                duration_minutes: 75,
              },
            ],
          }),
        }),
        retrieveCustomer: async () => ({
          customer: {
            id: "cust_1",
            given_name: "Pat",
            family_name: "New",
            email_address: "pat@example.com",
            phone_number: "+15145550000",
          },
        }),
      },
    )

    expect(outcome.action).toBe("created_consultation_stub")
    expect(outcome.clientEmail).toBe("pat@example.com")
    const created = db.all(CONSULTATIONS_COLLECTION)
    expect(created).toHaveLength(1)
    expect(created[0]?.data).toMatchObject({
      clientName: "Pat New",
      clientEmail: "pat@example.com",
      clientPhone: "+15145550000",
      squareCustomerId: "cust_1",
      squareConsultationBookingId: "sq_booking_new",
      status: "scheduled",
      needsAdminReview: true,
    })
  })

  it("enriches from the local square_customers mirror without calling the Square API", async () => {
    const db = new FakeFirestore()
    db.seed(SQUARE_CUSTOMERS_COLLECTION, "cust_1", {
      givenName: "Sam",
      familyName: "Local",
      email: "sam@example.com",
      emailLower: "sam@example.com",
      phone: "+15145559999",
      displayName: "Sam Local",
    })

    let apiCalls = 0
    const outcome = await reconcileSquareBookingWebhook(
      db as unknown as Firestore,
      payloadFor("sq_booking_new", "booking.created"),
      {
        retrieveBooking: async () => ({
          booking: canonicalBooking({
            id: "sq_booking_new",
            appointment_segments: [
              {
                service_variation_id: "consult-var",
                team_member_id: "tm_2",
                duration_minutes: 75,
              },
            ],
          }),
        }),
        retrieveCustomer: async () => {
          apiCalls += 1
          return { customer: { id: "cust_1", email_address: "should-not-win@example.com" } }
        },
      },
    )

    expect(outcome.action).toBe("created_consultation_stub")
    // Local mirror wins over the API response for display fields.
    expect(outcome.clientName).toBe("Sam Local")
    expect(outcome.clientEmail).toBe("sam@example.com")
    expect(outcome.clientPhone).toBe("+15145559999")
    // The live call is still made in parallel (used as a fallback), but its
    // values don't override the local mirror.
    expect(apiCalls).toBe(1)

    const created = db.all(CONSULTATIONS_COLLECTION)
    expect(created).toHaveLength(1)
    expect(created[0]?.data).toMatchObject({
      clientName: "Sam Local",
      clientEmail: "sam@example.com",
      clientPhone: "+15145559999",
      squareCustomerId: "cust_1",
    })
  })

  it("matches existing consultation by squareCustomerId even when email differs", async () => {
    const db = new FakeFirestore()
    db.seed(CONSULTATIONS_COLLECTION, "existing_doc", {
      clientName: "Alex Existing",
      clientEmail: "old-email@example.com",
      clientPhone: "+15145551111",
      status: "intake_submitted",
      squareCustomerId: "cust_1",
    })

    const outcome = await reconcileSquareBookingWebhook(
      db as unknown as Firestore,
      payloadFor("sq_booking_new", "booking.created"),
      {
        retrieveBooking: async () => ({
          booking: canonicalBooking({
            id: "sq_booking_new",
            appointment_segments: [
              {
                service_variation_id: "consult-var",
                team_member_id: "tm_2",
                duration_minutes: 75,
              },
            ],
          }),
        }),
        retrieveCustomer: async () => ({
          customer: {
            id: "cust_1",
            email_address: "new-email@example.com",
          },
        }),
      },
    )

    expect(outcome.action).toBe("merged_existing_consultation")
    expect(outcome.matchedBy).toBe("square_customer_id")
    expect(outcome.docId).toBe("existing_doc")
    expect(db.data(CONSULTATIONS_COLLECTION, "existing_doc")).toMatchObject({
      squareConsultationBookingId: "sq_booking_new",
      squareCustomerId: "cust_1",
      // Existing email is preserved; we only fill blanks, never overwrite.
      clientEmail: "old-email@example.com",
      status: "scheduled",
    })
    expect(db.all(CONSULTATIONS_COLLECTION)).toHaveLength(1)
  })

  it("still creates a stub when Square customer retrieval fails", async () => {
    const db = new FakeFirestore()

    const outcome = await reconcileSquareBookingWebhook(
      db as unknown as Firestore,
      payloadFor("sq_booking_new", "booking.created"),
      {
        retrieveBooking: async () => ({
          booking: canonicalBooking({
            id: "sq_booking_new",
            appointment_segments: [
              {
                service_variation_id: "consult-var",
                team_member_id: "tm_2",
                duration_minutes: 75,
              },
            ],
          }),
        }),
        retrieveCustomer: async () => {
          throw new Error("Square customer fetch blew up")
        },
      },
    )

    expect(outcome.action).toBe("created_consultation_stub")
    expect(outcome.clientEmail).toBeNull()
    const created = db.all(CONSULTATIONS_COLLECTION)
    expect(created).toHaveLength(1)
    expect(created[0]?.data).toMatchObject({
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      squareCustomerId: "cust_1",
      squareConsultationBookingId: "sq_booking_new",
    })
  })

  it("creates a review-needed stub for unmatched non-consultation bookings", async () => {
    const db = new FakeFirestore()

    await reconcileSquareBookingWebhook(db as unknown as Firestore, payloadFor("sq_booking_1", "booking.created"), {
      retrieveBooking: async () => ({
        booking: canonicalBooking(),
      }),
    })

    const created = db.all(BOOKINGS_COLLECTION)
    expect(created).toHaveLength(1)
    expect(created[0]?.data).toMatchObject({
      source: "square-webhook-review",
      needsAdminReview: true,
      reviewReason: "unmatched_square_webhook_booking",
      squareBookingId: "sq_booking_1",
      squareBookingStatus: "ACCEPTED",
      squareCustomerId: "cust_1",
      squareServiceVariationId: "class-var",
      squareTeamMemberId: "tm_1",
      bookingStatus: "booked_no_payment",
    })
  })

  it("ignores duplicate webhook replays for matched records", async () => {
    const db = new FakeFirestore()
    db.seed(BOOKINGS_COLLECTION, "booking_doc", {
      squareBookingId: "sq_booking_1",
      bookingStatus: "booked_no_payment",
      selectedSlots: ["2026-04-15T16:00:00.000Z|class-var|tm_1"],
      summary: {
        when: ["2026-04-15T16:00:00.000Z"],
        where: ["Square booking"],
        what: ["Puppy Foundations"],
      },
      squareWebhookLastEventId: "evt_1",
    })

    await reconcileSquareBookingWebhook(db as unknown as Firestore, payloadFor("sq_booking_1"), {
      retrieveBooking: async () => ({
        booking: canonicalBooking({
          start_at: "2026-05-01T12:00:00.000Z",
        }),
      }),
    })

    expect(db.data(BOOKINGS_COLLECTION, "booking_doc")).toMatchObject({
      bookingStatus: "booked_no_payment",
      selectedSlots: ["2026-04-15T16:00:00.000Z|class-var|tm_1"],
      squareWebhookLastEventId: "evt_1",
    })
  })
})
