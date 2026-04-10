import { TZDate } from "@date-fns/tz"
import { addDays, addWeeks, startOfWeek } from "date-fns"
import type { Slot } from "./training-portal-types"

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

/** Business timezone — must match labels, week boundaries, and column bucketing. */
const TORONTO_TZ = "America/Toronto"

function torontoYmdString(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TORONTO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d)
  const y = parts.find((p) => p.type === "year")?.value ?? "0"
  const m = parts.find((p) => p.type === "month")?.value ?? "0"
  const day = parts.find((p) => p.type === "day")?.value ?? "0"
  return `${y}-${m}-${day}`
}

export function formatSlotDate(iso: string) {
  const d = new Date(iso)
  const todayY = torontoYmdString(new TZDate(Date.now(), TORONTO_TZ))
  const slotY = torontoYmdString(d)
  const tomorrowY = torontoYmdString(addDays(new TZDate(Date.now(), TORONTO_TZ), 1))
  const monthDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: TORONTO_TZ,
    month: "short",
    day: "numeric",
  }).format(d)
  const fullWeekday = new Intl.DateTimeFormat("en-CA", {
    timeZone: TORONTO_TZ,
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(d)
  if (slotY === todayY) return `Today, ${monthDay}`
  if (slotY === tomorrowY) return `Tomorrow, ${monthDay}`
  return fullWeekday
}

export function formatSlotTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-CA", {
    timeZone: TORONTO_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

/**
 * Monday 00:00:00 – Sunday 23:59:59.999 in America/Toronto (wall time).
 * Matches how we label columns and bucket slots.
 */
export function getWeekRange(weekOffset: number) {
  const now = new TZDate(Date.now(), TORONTO_TZ)
  const mondayStart = startOfWeek(now, { weekStartsOn: 1 })
  const start = addWeeks(mondayStart, weekOffset)
  const end = addDays(start, 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function slotsInWeek(slots: Slot[], weekOffset: number) {
  const { start, end } = getWeekRange(weekOffset)
  const startMs = start.getTime()
  const endMs = end.getTime()
  return slots.filter((s) => {
    const ms = new Date(s.startAt).getTime()
    return ms >= startMs && ms <= endMs
  })
}

export function slotsByWeekday(slots: Slot[]) {
  const byDay: Record<number, Slot[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  for (const slot of slots) {
    const d = new TZDate(new Date(slot.startAt), TORONTO_TZ)
    const day = d.getDay()
    const idx = day === 0 ? 6 : day - 1
    if (!byDay[idx]) byDay[idx] = []
    byDay[idx].push(slot)
  }
  for (const k of Object.keys(byDay)) {
    byDay[Number(k)].sort((a, b) => a.startAt.localeCompare(b.startAt))
  }
  return byDay
}

export function formatWeekLabel(weekOffset: number) {
  const { start, end } = getWeekRange(weekOffset)
  const isThisWeek = weekOffset === 0
  const startStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: TORONTO_TZ,
    month: "short",
    day: "numeric",
  }).format(start)
  const endStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: TORONTO_TZ,
    month: "short",
    day: "numeric",
  }).format(end)
  return isThisWeek ? `This week · ${startStr} – ${endStr}` : `Week of ${startStr} – ${endStr}`
}

export function formatDayHeader(weekOffset: number, dayIndex: number) {
  const { start } = getWeekRange(weekOffset)
  const d = addDays(start, dayIndex)
  const nowToronto = new TZDate(Date.now(), TORONTO_TZ)
  const isToday = torontoYmdString(d) === torontoYmdString(nowToronto)
  const label = new Intl.DateTimeFormat("en-CA", {
    timeZone: TORONTO_TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d)
  return isToday ? `Today · ${label}` : label
}
