import {
  makeTorontoDate,
  torontoDateParts,
  torontoDateIso,
  parseTorontoDateIso,
  addTorontoDays,
  torontoWeekdayIndex,
  TORONTO_TIME_ZONE,
} from "./toronto-time"

describe("toronto-time", () => {
  describe("makeTorontoDate", () => {
    it("creates a date at noon UTC for given year/month/day", () => {
      const d = makeTorontoDate(2025, 3, 16)
      expect(d.getUTCFullYear()).toBe(2025)
      expect(d.getUTCMonth()).toBe(2)
      expect(d.getUTCDate()).toBe(16)
      expect(d.getUTCHours()).toBe(12)
    })
  })

  describe("torontoDateParts", () => {
    it("extracts year, month, day in Toronto timezone", () => {
      const d = makeTorontoDate(2025, 3, 16)
      const parts = torontoDateParts(d)
      expect(parts.year).toBe(2025)
      expect(parts.month).toBe(3)
      expect(parts.day).toBe(16)
    })
  })

  describe("torontoDateIso", () => {
    it("returns YYYY-MM-DD string", () => {
      const d = makeTorontoDate(2025, 3, 16)
      expect(torontoDateIso(d)).toBe("2025-03-16")
    })
  })

  describe("parseTorontoDateIso", () => {
    it("parses valid YYYY-MM-DD string", () => {
      const d = parseTorontoDateIso("2025-03-16")
      expect(d).not.toBeNull()
      expect(torontoDateIso(d!)).toBe("2025-03-16")
    })

    it("returns null for empty or undefined", () => {
      expect(parseTorontoDateIso("")).toBeNull()
      expect(parseTorontoDateIso(undefined)).toBeNull()
    })

    it("returns null for invalid format", () => {
      expect(parseTorontoDateIso("03-16-2025")).toBeNull()
      expect(parseTorontoDateIso("invalid")).toBeNull()
    })
  })

  describe("addTorontoDays", () => {
    it("adds days to date", () => {
      const d = makeTorontoDate(2025, 3, 16)
      const next = addTorontoDays(d, 5)
      expect(next.getDate()).toBe(21)
      expect(next.getMonth()).toBe(2)
    })
  })

  describe("torontoWeekdayIndex", () => {
    it("returns 0 for Sunday, 1 for Monday", () => {
      const sun = makeTorontoDate(2025, 3, 16)
      expect(torontoWeekdayIndex(sun)).toBe(0)

      const mon = makeTorontoDate(2025, 3, 17)
      expect(torontoWeekdayIndex(mon)).toBe(1)
    })
  })

  it("TORONTO_TIME_ZONE constant is America/Toronto", () => {
    expect(TORONTO_TIME_ZONE).toBe("America/Toronto")
  })
})
