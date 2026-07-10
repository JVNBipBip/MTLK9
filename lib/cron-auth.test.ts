import { isAuthorizedCronRequest } from "@/lib/cron-auth"

describe("cron request authorization", () => {
  it("accepts the configured bearer token", () => {
    expect(isAuthorizedCronRequest("Bearer expected-secret", "expected-secret")).toBe(true)
  })

  it("rejects missing or incorrect credentials", () => {
    expect(isAuthorizedCronRequest(null, "expected-secret")).toBe(false)
    expect(isAuthorizedCronRequest("Bearer wrong-secret", "expected-secret")).toBe(false)
    expect(isAuthorizedCronRequest("Bearer expected-secret", undefined)).toBe(false)
  })
})
