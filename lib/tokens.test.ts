import { hashAccessToken } from "./tokens"

describe("tokens", () => {
  describe("hashAccessToken", () => {
    it("returns hex string of length 64 (SHA-256)", () => {
      const hash = hashAccessToken("test-token")
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
      expect(hash).toHaveLength(64)
    })

    it("returns same hash for same input", () => {
      const hash1 = hashAccessToken("same-token")
      const hash2 = hashAccessToken("same-token")
      expect(hash1).toBe(hash2)
    })

    it("returns different hash for different input", () => {
      const hash1 = hashAccessToken("token-a")
      const hash2 = hashAccessToken("token-b")
      expect(hash1).not.toBe(hash2)
    })
  })
})
