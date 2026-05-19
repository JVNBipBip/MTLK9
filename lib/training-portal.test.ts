import {
  isActiveSyncedSquareBooking,
  isCompletedConsultationOlderThanOneYear,
  resolvePortalDogName,
} from "./training-portal"

describe("resolvePortalDogName", () => {
  it("returns the requested dog name when provided", () => {
    expect(
      resolvePortalDogName({
        requestedDogName: "Luna",
        consultations: [],
        dogRecords: [],
        bookingRows: [],
      }),
    ).toBe("Luna")
  })

  it("infers dog name from the latest completed consultation when omitted", () => {
    expect(
      resolvePortalDogName({
        requestedDogName: "",
        consultations: [
          {
            id: "older",
            status: "completed",
            dogName: "Max",
            completedAtIso: "2025-01-01T12:00:00.000Z",
          },
          {
            id: "newer",
            status: "completed",
            dogName: "Luna",
            completedAtIso: "2026-01-01T12:00:00.000Z",
          },
        ],
        dogRecords: [],
        bookingRows: [],
      }),
    ).toBe("Luna")
  })

  it("falls back to dog records and bookings when no consultation exists", () => {
    expect(
      resolvePortalDogName({
        requestedDogName: "",
        consultations: [],
        dogRecords: [{ dogName: "Cooper" }],
        bookingRows: [{ id: "b1", dogName: "Skip" }],
      }),
    ).toBe("Cooper")
  })
})

describe("training portal eligibility helpers", () => {
  describe("isActiveSyncedSquareBooking", () => {
    const nowIso = "2026-04-30T12:00:00.000Z"

    it("treats future non-cancelled Square bookings as active", () => {
      expect(
        isActiveSyncedSquareBooking(
          {
            id: "sq_1",
            startAtIso: "2026-05-01T12:00:00.000Z",
            status: "ACCEPTED",
          },
          nowIso,
        ),
      ).toBe(true)
    })

    it("does not treat past Square bookings as active", () => {
      expect(
        isActiveSyncedSquareBooking(
          {
            id: "sq_1",
            startAtIso: "2026-04-29T12:00:00.000Z",
            status: "ACCEPTED",
          },
          nowIso,
        ),
      ).toBe(false)
    })

    it("does not treat cancelled Square bookings as active", () => {
      expect(
        isActiveSyncedSquareBooking(
          {
            id: "sq_1",
            startAtIso: "2026-05-01T12:00:00.000Z",
            status: "CANCELLED",
          },
          nowIso,
        ),
      ).toBe(false)
    })
  })

  describe("isCompletedConsultationOlderThanOneYear", () => {
    const now = new Date("2026-04-30T12:00:00.000Z")

    it("flags completed consultations older than one calendar year", () => {
      expect(
        isCompletedConsultationOlderThanOneYear(
          {
            id: "consult_1",
            status: "completed",
            completedAtIso: "2025-04-29T12:00:00.000Z",
          },
          now,
        ),
      ).toBe(true)
    })

    it("keeps completed consultations within one calendar year valid", () => {
      expect(
        isCompletedConsultationOlderThanOneYear(
          {
            id: "consult_1",
            status: "completed",
            completedAtIso: "2025-04-30T12:00:00.000Z",
          },
          now,
        ),
      ).toBe(false)
    })

    it("does not flag incomplete consultations", () => {
      expect(
        isCompletedConsultationOlderThanOneYear(
          {
            id: "consult_1",
            status: "pending",
            completedAtIso: "2025-04-29T12:00:00.000Z",
          },
          now,
        ),
      ).toBe(false)
    })
  })
})
