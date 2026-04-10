import { LEGACY_GROUP_PROGRAM_LABELS, programLabel } from "./programs"

describe("programs", () => {
  describe("LEGACY_GROUP_PROGRAM_LABELS", () => {
    it("includes known legacy ids", () => {
      expect(LEGACY_GROUP_PROGRAM_LABELS["puppy-foundations"]).toBe("Puppy Foundations")
      expect(LEGACY_GROUP_PROGRAM_LABELS["city-manners"]).toBe("City Manners")
    })
  })

  describe("programLabel", () => {
    it("uses slot order when id is listed", () => {
      const order = ["x", "y"]
      expect(programLabel("y", order)).toBe("Group class #2")
    })

    it("falls back to legacy when no slot order", () => {
      expect(programLabel("high-risk")).toBe("High-Risk Behaviors")
    })
  })
})
