import {
  isActiveSyncedSquareBooking,
  isCompletedConsultationOlderThanOneYear,
} from "./training-portal"

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
