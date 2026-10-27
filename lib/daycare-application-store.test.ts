import type { Firestore } from "firebase-admin/firestore"
import { storeDaycareApplication, DaycareSubmissionConflict, DaycareSubmissionLimited } from "./daycare-application-store"

function memoryDb() {
  const data = new Map<string, Record<string, unknown>>()
  const db = {
    collection: (name: string) => ({ doc: (id: string) => ({ path: `${name}/${id}` }) }),
    runTransaction: async (handler: (transaction: unknown) => unknown) => {
      const writes: [string, Record<string, unknown>][] = []
      const write = (ref: { path: string }, value: Record<string, unknown>) => writes.push([ref.path, value])
      const result = await handler({ get: async (ref: { path: string }) => ({ exists: data.has(ref.path), data: () => data.get(ref.path) }), create: write, set: write })
      for (const [key, value] of writes) data.set(key, value)
      return result
    },
  }
  return { db: db as unknown as Firestore, data }
}
const payload = { requestId: "test-id", locale: "en" as const, answers: { ownerEmail: "test@example.com", dogName: "Test dog" }, rateIdentity: "test-ip-hash" }
it("retries do not duplicate applications, overwrite review state or consume rate budget", async () => {
  const { db, data } = memoryDb()
  const first = await storeDaycareApplication(db, payload, 1000)
  expect(first.created).toBe(true)
  const saved = data.get(`daycare_applications/${first.id}`)!
  saved.status = "approved"
  const again = await storeDaycareApplication(db, payload, 1001)
  expect(again.created).toBe(false); expect(saved.status).toBe("approved")
  expect([...data.entries()].filter(([key]) => key.startsWith("daycare_applications/"))).toHaveLength(1)
  expect([...data.entries()].filter(([key]) => key.startsWith("daycare_submission_limits/")).every(([,value]) => value.count === 1)).toBe(true)
})
it("prevents reuse of an idempotency key for different answers", async () => {
  const { db } = memoryDb(); await storeDaycareApplication(db, payload, 1000)
  await expect(storeDaycareApplication(db, { ...payload, answers: { ...payload.answers, dogName: "Changed" } }, 1000)).rejects.toBeInstanceOf(DaycareSubmissionConflict)
})
it("limits submissions atomically without saving a fourth email application", async () => {
  const { db, data } = memoryDb()
  for (let i = 0; i < 3; i++) await storeDaycareApplication(db, { ...payload, requestId: `id-${i}` }, 1000)
  await expect(storeDaycareApplication(db, { ...payload, requestId: "id-4" }, 1000)).rejects.toBeInstanceOf(DaycareSubmissionLimited)
  expect([...data.keys()].filter(key => key.startsWith("daycare_applications/"))).toHaveLength(3)
  expect(JSON.stringify([...data.keys()])).not.toContain("test@example.com")
})
