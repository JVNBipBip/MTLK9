export const TORONTO_TIME_ZONE = "America/Toronto"

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

const ymdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TORONTO_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

const weekdayShortFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TORONTO_TIME_ZONE,
  weekday: "short",
})

const WEEKDAY_INDEX_BY_SHORT: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

export function makeTorontoDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

export function torontoDateParts(date: Date) {
  const parts = ymdFormatter.formatToParts(date)
  const year = Number(parts.find((p) => p.type === "year")?.value)
  const month = Number(parts.find((p) => p.type === "month")?.value)
  const day = Number(parts.find((p) => p.type === "day")?.value)
  return { year, month, day }
}

export function torontoDateIso(date: Date) {
  const { year, month, day } = torontoDateParts(date)
  const m = String(month).padStart(2, "0")
  const d = String(day).padStart(2, "0")
  return `${year}-${m}-${d}`
}

export function parseTorontoDateIso(value?: string) {
  if (!value) return null
  const match = value.match(DATE_ONLY_RE)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!year || !month || !day) return null
  return makeTorontoDate(year, month, day)
}

export function addTorontoDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function torontoWeekdayIndex(date: Date) {
  const short = weekdayShortFormatter.format(date)
  return WEEKDAY_INDEX_BY_SHORT[short] ?? 0
}
