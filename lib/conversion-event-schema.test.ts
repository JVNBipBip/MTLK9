import { parseConversionEventPayload } from "@/lib/conversion-event-schema"

describe("conversion event payload", () => {
  it("accepts and normalizes a phone-link click", () => {
    expect(
      parseConversionEventPayload({
        event: "phone_link_clicked",
        locale: "fr",
        path: "/fr/services/reactivity",
        location: " hero_cta ",
      }),
    ).toEqual({
      event: "phone_link_clicked",
      locale: "fr",
      path: "/fr/services/reactivity",
      location: "hero_cta",
    })
  })

  it("rejects unsupported events and invalid paths", () => {
    expect(parseConversionEventPayload({ event: "form_submitted", path: "/en" })).toBeNull()
    expect(parseConversionEventPayload({ event: "phone_link_clicked", path: "https://example.com" })).toBeNull()
    expect(parseConversionEventPayload(null)).toBeNull()
  })

  it("keeps the event non-PII and bounded", () => {
    const result = parseConversionEventPayload({
      event: "phone_link_clicked",
      locale: "unknown",
      path: `/${"p".repeat(300)}`,
      location: "x".repeat(100),
      email: "not-stored@example.com",
    })

    expect(result?.locale).toBeNull()
    expect(result?.path).toHaveLength(240)
    expect(result?.location).toHaveLength(80)
    expect(result).not.toHaveProperty("email")
  })
})
