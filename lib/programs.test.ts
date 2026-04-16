import { PROGRAM_LABEL_BY_ID, programLabel } from "./programs"

describe("programs", () => {
  describe("PROGRAM_LABEL_BY_ID", () => {
    it("includes the currently offered programs", () => {
      expect(PROGRAM_LABEL_BY_ID["reactivity"]).toBe("Reactivity Training")
      expect(PROGRAM_LABEL_BY_ID["in-home"]).toBe("In-Home Training")
    })
  })

  describe("programLabel", () => {
    it("uses slot order when id is listed", () => {
      const order = ["x", "y"]
      expect(programLabel("y", order)).toBe("Group class #2")
    })

    it("falls back to the configured program labels", () => {
      expect(programLabel("private-classes")).toBe("Private Classes")
    })

    it("humanizes unknown ids without hardcoding legacy offerings", () => {
      expect(programLabel("custom-program")).toBe("Custom Program")
    })
  })
})
