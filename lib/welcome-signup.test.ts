import { normalizeWelcomePhone, parseWelcomeSignupPayload } from "@/lib/welcome-signup"

describe("welcome signup payload", () => {
  it("normalizes Canadian phone numbers for GHL", () => {
    expect(normalizeWelcomePhone("(514) 826-9558")).toBe("+15148269558")
    expect(normalizeWelcomePhone("1 514 826 9558")).toBe("+15148269558")
  })

  it("accepts an email-only signup", () => {
    expect(
      parseWelcomeSignupPayload({
        email: " Person@Example.com ",
        variant: "b",
        locale: "en",
        path: "/en/services",
      }),
    ).toEqual({
      email: "person@example.com",
      phone: null,
      message: null,
      variant: "b",
      locale: "en",
      path: "/en/services",
    })
  })

  it("includes a normalized optional phone number", () => {
    expect(
      parseWelcomeSignupPayload({
        email: "person@example.com",
        phone: "514-555-0123",
        message: "Leash reactivity",
        variant: "a",
        locale: "fr",
        path: "/fr/services/reactivity",
      }),
    ).toMatchObject({ phone: "+15145550123", locale: "fr", message: "Leash reactivity" })
  })

  it("rejects a supplied but invalid phone number", () => {
    expect(
      parseWelcomeSignupPayload({
        email: "person@example.com",
        phone: "123",
        variant: "a",
        locale: "en",
        path: "/en",
      }),
    ).toBeNull()
  })
})
