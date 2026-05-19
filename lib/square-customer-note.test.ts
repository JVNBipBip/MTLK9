import { describe, expect, it } from "@jest/globals"
import {
  SQUARE_CUSTOMER_NOTE_AUTO_START,
  buildInquirySquareCustomerNoteAppendixLines,
  composeSquareCustomerNote,
  parseStaffNoteFromSquareNote,
} from "./square-customer-note"
import { INITIAL_FORM_DATA } from "@/app/booking/types"

describe("square-customer-note", () => {
  it("parses staff note before auto marker", () => {
    const full = `VIP client\n\n${SQUARE_CUSTOMER_NOTE_AUTO_START}\nDogs: Max`
    expect(parseStaffNoteFromSquareNote(full)).toBe("VIP client")
  })

  it("builds inquiry appendix from form fields", () => {
    const lines = buildInquirySquareCustomerNoteAppendixLines({
      formData: {
        ...INITIAL_FORM_DATA,
        contactName: "Jane Doe",
        contactEmail: "jane@example.com",
        contactPhone: "5145551234",
        contactBestTime: "morning",
        contactNotes: "Can we talk this week?",
        dogName: "Max",
        dogBreed: "Labrador",
        dogAge: "1-2-years",
        dogDuration: "1-3-years",
        dogSource: "breeder",
        issue: "pulls-lunges-reacts",
        duration: "1-6-months",
        tried: ["youtube-articles"],
        impact: ["dread-walking"],
        goals: ["calm-walks"],
      },
      issueLabel: "Leash pulling, reactivity and overall obedience",
      goalLabels: ["Calm, enjoyable walks"],
      intakeResponseSummary: "",
      locale: "en",
      preferredTrainerLabel: "Tyson",
      submittedAtIso: "2026-05-18T12:00:00.000Z",
    })

    expect(lines.some((line) => line.startsWith("Website inquiry"))).toBe(true)
    expect(lines.some((line) => line.includes("Jane Doe"))).toBe(true)
    expect(lines.some((line) => line.includes("Max"))).toBe(true)
    expect(lines.some((line) => line.includes("Leash pulling"))).toBe(true)
    expect(lines.some((line) => line.includes("Can we talk this week?"))).toBe(true)
    expect(lines.some((line) => line.includes("Tyson"))).toBe(true)
  })

  it("composes staff note with inquiry appendix", () => {
    const appendix = buildInquirySquareCustomerNoteAppendixLines({
      formData: { ...INITIAL_FORM_DATA, dogName: "Max", contactName: "Jane", contactEmail: "j@x.com" },
      issueLabel: "Puppy training",
      goalLabels: [],
      intakeResponseSummary: "",
      locale: "en",
      submittedAtIso: "2026-05-18T12:00:00.000Z",
    })
    const out = composeSquareCustomerNote("VIP", appendix)
    expect(out).toContain("VIP")
    expect(out).toContain(SQUARE_CUSTOMER_NOTE_AUTO_START)
    expect(out).toContain("Max")
  })
})
