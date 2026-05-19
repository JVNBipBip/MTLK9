import {
  consultationConfirmedScheduledIso,
  consultationRequestedScheduledIso,
  isConsultationAppointmentConfirmed,
  isConsultationDepositUnpaid,
  scheduledAtIsoFromConsultationSlotKey,
} from "@/lib/consultation-deposit"

describe("consultation-deposit", () => {
  it("parses slot key start time", () => {
    expect(scheduledAtIsoFromConsultationSlotKey("2026-05-20T16:00:00.000Z|var|tm")).toBe(
      "2026-05-20T16:00:00.000Z",
    )
  })

  it("does not treat unpaid deposit as confirmed schedule", () => {
    const row = {
      status: "intake_submitted",
      initialPaymentStatus: "pending_payment",
      requestedScheduledAtIso: "2026-05-20T16:00:00.000Z",
      scheduledAtIso: null,
    }
    expect(isConsultationDepositUnpaid(row)).toBe(true)
    expect(isConsultationAppointmentConfirmed(row)).toBe(false)
    expect(consultationConfirmedScheduledIso(row)).toBe("")
    expect(consultationRequestedScheduledIso(row)).toBe("2026-05-20T16:00:00.000Z")
  })

  it("treats paid consultation as confirmed schedule", () => {
    const row = {
      status: "scheduled",
      initialPaymentStatus: "paid",
      scheduledAtIso: "2026-05-20T16:00:00.000Z",
    }
    expect(isConsultationAppointmentConfirmed(row)).toBe(true)
    expect(consultationConfirmedScheduledIso(row)).toBe("2026-05-20T16:00:00.000Z")
  })
})
