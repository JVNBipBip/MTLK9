import { PROGRAM_OPTIONS, PROGRAM_LABEL_BY_ID } from "./programs"

describe("programs", () => {
  describe("PROGRAM_OPTIONS", () => {
    it("has 5 program options", () => {
      expect(PROGRAM_OPTIONS).toHaveLength(5)
    })

    it("matches admin PROGRAM_OPTIONS ids", () => {
      const ids = PROGRAM_OPTIONS.map((p) => p.id)
      expect(ids).toEqual([
        "puppy-foundations",
        "city-manners",
        "reactivity-anxiety",
        "high-risk",
        "day-training",
      ])
    })
  })

  describe("PROGRAM_LABEL_BY_ID", () => {
    it("maps each program id to same labels as admin", () => {
      expect(PROGRAM_LABEL_BY_ID["puppy-foundations"]).toBe("Puppy Foundations")
      expect(PROGRAM_LABEL_BY_ID["city-manners"]).toBe("City Manners")
      expect(PROGRAM_LABEL_BY_ID["day-training"]).toBe("Day Training")
    })
  })
})
