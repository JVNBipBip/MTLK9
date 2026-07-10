export const CONVERSION_EVENTS_COLLECTION = "conversionEvents"

export type TrackedConversionEvent = "phone_link_clicked"

export type ConversionEventPayload = {
  event: TrackedConversionEvent
  locale: "en" | "fr" | null
  path: string
  location: string
}

function boundedString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, maxLength)
}

export function parseConversionEventPayload(value: unknown): ConversionEventPayload | null {
  if (!value || typeof value !== "object") return null

  const input = value as Record<string, unknown>
  if (input.event !== "phone_link_clicked") return null

  const path = boundedString(input.path, 240)
  if (!path.startsWith("/")) return null

  return {
    event: input.event,
    locale: input.locale === "en" || input.locale === "fr" ? input.locale : null,
    path,
    location: boundedString(input.location, 80) || "site",
  }
}
