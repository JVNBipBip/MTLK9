import { serviceInquiryNotes } from "./service-inquiries"

describe("service inquiry notes", () => {
  it("preserves ordinary inquiry notes unchanged", () => {
    expect(serviceInquiryNotes(undefined, "My dog pulls.")).toBe("My dog pulls.")
  })
  it("keeps the program visible in the existing staff notification", () => {
    expect(serviceInquiryNotes("day-training", "Weekdays preferred.")).toBe("Requested program: Day Training Program\nWeekdays preferred.")
    expect(serviceInquiryNotes("daycare", "")).toBe("Requested program: Regular Daycare Program")
    expect(serviceInquiryNotes("training-documentation-offer", "")).toContain("30% Training Documentation Offer")
  })
})
