import type { Slot } from "./training-portal-types"

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

export function formatSlotDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateStr = d.toLocaleDateString("en-CA", {
    timeZone: "America/Toronto",
    weekday: "long",
    month: "short",
    day: "numeric",
  })
  if (d.toDateString() === today.toDateString()) return `Today, ${dateStr.split(", ")[1]}`
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${dateStr.split(", ")[1]}`
  return dateStr
}

export function formatSlotTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-CA", {
    timeZone: "America/Toronto",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function getMondayOfWeek(d: Date) {
  const copy = new Date(d)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function getWeekRange(weekOffset: number) {
  const today = new Date()
  const monday = getMondayOfWeek(today)
  const start = new Date(monday)
  start.setDate(start.getDate() + weekOffset * 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
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
    const d = new Date(slot.startAt)
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
  const startStr = start.toLocaleDateString("en-CA", {
    timeZone: "America/Toronto",
    month: "short",
    day: "numeric",
  })
  const endStr = end.toLocaleDateString("en-CA", {
    timeZone: "America/Toronto",
    month: "short",
    day: "numeric",
  })
  return isThisWeek ? `This week · ${startStr} – ${endStr}` : `Week of ${startStr} – ${endStr}`
}

export function formatDayHeader(weekOffset: number, dayIndex: number) {
  const { start } = getWeekRange(weekOffset)
  const d = new Date(start)
  d.setDate(d.getDate() + dayIndex)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const label = d.toLocaleDateString("en-CA", {
    timeZone: "America/Toronto",
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  return isToday ? `Today · ${label.split(", ")[1]}` : label
}
