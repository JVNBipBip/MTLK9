import { cn } from "./utils"

describe("utils", () => {
  describe("cn", () => {
    it("merges class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar")
    })

    it("handles conditional classes", () => {
      expect(cn("base", false && "hidden", "visible")).toBe("base visible")
    })

    it("handles tailwind merge - later overrides earlier", () => {
      // twMerge dedupes conflicting tailwind classes
      const result = cn("p-4", "p-2")
      expect(result).toBe("p-2")
    })

    it("handles empty input", () => {
      expect(cn()).toBe("")
    })
  })
})
